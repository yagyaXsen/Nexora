import hashlib
import json
import logging
import re
import time
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

from app.config import settings
from app.schemas import OpportunityExtract, SearchIntent
from app.models import OpportunityCategory

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.use_mock = settings.USE_MOCK_AI or not bool(settings.GROQ_API_KEY)
        self.client = None
        if not self.use_mock and settings.GROQ_API_KEY:
            try:
                from groq import Groq
                self.client = Groq(api_key=settings.GROQ_API_KEY, timeout=settings.AI_TIMEOUT_SECONDS)
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}. Falling back to mock mode.")
                self.use_mock = True
        self.search_cache = OrderedDict()

    def is_invalid_junk_url(self, url: str, text: str) -> bool:
        """Reject blog articles, shell tutorials, forum threads, news articles, 
        and non-opportunity URLs. Returns True if the URL SHOULD be rejected.
        
        The checks are ordered from cheapest (URL pattern match) to most
        expensive (text scanning) so non-opportunities are rejected early.
        """
        if not url or not text:
            return True

        url_lower = url.lower()
        text_lower = text.lower()

        # ── Tier 1: Reject known non-opportunity domains ────────────────────────
        junk_domains = [
            # Forums & social media
            'forum.', 'discourse.', 'reddit.com', 'news.ycombinator.com', 
            'twitter.com', 'x.com', 'facebook.com', 'quora.com', 'stackoverflow.com',
            'discord.', 'slack.com', 'telegram.', 
            # News & media
            'wsj.com', 'techcrunch.com', 'bloomberg.com', 'forbes.com', 'nytimes.com',
            'reuters.com', 'cnbc.com', 'medium.com', 'refp.se', 'github.blog',
            'popsci.com', 'popularmechanics.com', 'wired.com', 'theverge.com',
            'arstechnica.com', 'bbc.com', 'bbc.in', 'cnn.com', 'theguardian.com',
            'news.mongabay.com', 'energiesmedia.com', 'aerospaceglobalnews.com',
            'korben.info', 'dead.garden', 'saffroncr.itch.io',
            # Personal blogs / substacks
            'substack.com', 'medium.com', 'wordpress.com', 'blogger.com',
            'tumblr.com', 'ghost.org', 'hashnode.dev', 'dev.to',
            # Package registries & code hosting
            'pypi.org', 'npmjs.com', 'crates.io', 'rubygems.org',
            'pkg.go.dev', 'godoc.org',
        ]
        url_domain = url_lower.split('/')[2] if '://' in url_lower else url_lower
        for domain in junk_domains:
            if domain in url_lower or domain in url_domain:
                return True

        # ── Tier 2: Reject URLs with junk path patterns ────────────────────────
        junk_path_patterns = [
            # Navigational / non-content pages
            '/t/', '/topic/', '/comments/', '/thread/', '/discussion/', '/viewtopic',
            '/stories', '/about', '/privacy', '/terms', '/faq', '/contact', '/login', '/signup',
            # Blogs & news sections
            '/blog/', '/blogs/', '/news/', '/press/', '/media/', '/article/', '/articles/',
            '/post/', '/posts/', '/story/', '/stories/',
            # Legal & admin
            '/legal', '/cookies', '/cookie', '/gdpr',
        ]
        for pat in junk_path_patterns:
            if pat in url_lower:
                return True

        # ── Tier 3: Reject known non-opportunity URL patterns ──────────────────
        # devpost.com hackathon listing page (not a specific competition page)
        if 'devpost.com' in url_lower and 'hackathons' in url_lower:
            return True

        # kaggle.com/competitions listing page only (not a specific competition)
        # Specific competitions use slug-based URLs like /competitions/competition-name
        if 'kaggle.com' in url_lower:
            url_no_query = url_lower.split('?')[0].rstrip('/')
            if url_no_query.endswith('/competitions'):
                return True

        # ── Tier 4: Mandatory opportunity keywords ─────────────────────────────
        # Must contain at least TWO opportunity keywords (one is too permissive).
        # This prevents blog posts that casually mention "funding" or "award" from
        # being classified as opportunities.
        opportunity_keywords = [
            'fellowship', 'grant', 'scholarship', 'accelerator', 'stipend', 
            'call for applications', 'call for proposals', 'apply now', 'apply today',
            'funding opportunity', 'funding program', 'funding scheme',
            'research grant', 'research fellowship', 'doctoral', 'postdoctoral',
            'studentship', 'cohort', 'incubation', 'seed funding',
            'young professionals', 'graduate program', 'traineeship',
        ]
        
        opportunity_keyword_count = sum(
            1 for kw in opportunity_keywords 
            if kw in text_lower or kw in url_lower
        )
        if opportunity_keyword_count < 2:
            return True

        # ── Tier 5: Title heuristic — reject titles that don't look like opportunities ──
        # Extract the first line as a rough title
        first_line = text.strip().split('\n')[0] if text else ''
        first_line_lower = first_line.lower()
        
        # Reject if the first line reads like a blog post or article
        blog_title_indicators = [
            'how to', 'why i', 'what is', 'the case for', 'my take on',
            'a look at', 'review:', 'tutorial:', 'guide:', 'introducing',
            'announcing', 'show hn:', 'ask hn:', 'tell hn:', 'launch hn:',
            'building a', 'building an', 'i built', 'i made', 'we built',
        ]
        for indicator in blog_title_indicators:
            if first_line_lower.startswith(indicator):
                return True

        # Reject very short titles (less than 10 chars after stripping labels)
        cleaned_first = re.sub(r'^title:\s*', '', first_line, flags=re.IGNORECASE).strip()
        if len(cleaned_first) < 10:
            return True

        return False

    def extract_opportunity(self, text_content: str, source_name: str, candidate_url: str) -> OpportunityExtract:
        if self.is_invalid_junk_url(candidate_url, text_content):
            raise ValueError(f"URL {candidate_url} identified as forum or discussion thread — skipping normalization.")

        if self.use_mock or not self.client:
            return self._mock_extraction(text_content, source_name, candidate_url)

        prompt = f"""
You are an expert opportunity discovery AI. Analyze the text content from "{source_name}" below and extract key opportunity details.
Target URL: {candidate_url}

Output strictly a valid JSON object with the following fields:
- category: one of ["scholarship", "fellowship", "grant", "accelerator", "competition", "conference", "exchange", "travel", "gov_scheme", "giveaway"]
- title: string
- organizer: string
- deadline: ISO datetime string (e.g., "2026-12-31T23:59:59Z") or null
- apply_url: direct apply URL string (use "{candidate_url}" if no better link is found)
- country: eligible region string or "Global" or null
- funding_amount: grant/prize string (e.g., "$10,000" or "Fully Funded") or null
- eligibility_text: short summary of eligibility criteria or null
- description: concise summary (2-4 sentences)
- tags: list of keyword strings
- confidence: float between 0.0 and 1.0 representing confidence in extraction quality

Text Content:
\"\"\"
{text_content[:4000]}
\"\"\"
"""
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You output JSON matching the required opportunity extract schema."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            content = chat_completion.choices[0].message.content
            parsed = json.loads(content)
            return OpportunityExtract(**parsed)
        except Exception as e:
            logger.error(f"Groq AI extraction failed: {e}. Retrying with fallback mock mode.")
            return self._mock_extraction(text_content, source_name, candidate_url)

    def _mock_extraction(self, text_content: str, source_name: str, candidate_url: str) -> OpportunityExtract:
        text_hash = hashlib.md5(text_content.encode("utf-8")).hexdigest()
        hash_val = int(text_hash[:8], 16)
        
        categories = list(OpportunityCategory)
        cat = categories[hash_val % len(categories)]
        
        # Derive title lines
        lines = [l.strip() for l in text_content.splitlines() if l.strip()]
        first_line = lines[0] if lines else "Global Opportunity Program"
        title = first_line[:120] if len(first_line) > 5 else f"{source_name} Opportunity Program {hash_val % 1000}"

        future_days = 15 + (hash_val % 60)
        deadline_dt = datetime.now(timezone.utc) + timedelta(days=future_days)
        
        return OpportunityExtract(
            category=cat,
            title=title,
            organizer=source_name if source_name else "Global Grants Foundation",
            deadline=deadline_dt,
            apply_url=candidate_url,
            country="Global" if hash_val % 2 == 0 else "United States",
            funding_amount=f"${(hash_val % 50 + 5) * 1000} USD" if hash_val % 3 != 0 else "Fully Funded",
            eligibility_text="Open to students, researchers, and early-stage innovators worldwide.",
            description=lines[1][:250] if len(lines) > 1 else f"Discovered opportunity from {source_name}. Applications are open for eligible candidates worldwide.",
            tags=[cat.value, "innovation", "funding", "global"],
            confidence=0.88 + (hash_val % 10) / 100.0,
        )

    # --- AI-powered search query parsing ---

    CATEGORY_SYNONYMS = {
        "scholarship": "scholarship", "scholarships": "scholarship",
        "fellowship": "fellowship", "fellowships": "fellowship",
        "grant": "grant", "grants": "grant",
        "accelerator": "accelerator", "accelerators": "accelerator", "incubator": "accelerator",
        "competition": "competition", "competitions": "competition",
        "hackathon": "competition", "hackathons": "competition", "contest": "competition",
        "conference": "conference", "conferences": "conference", "summit": "conference",
        "exchange": "exchange", "exchanges": "exchange",
        "travel": "travel",
        "scheme": "gov_scheme", "schemes": "gov_scheme", "government": "gov_scheme",
        "giveaway": "giveaway", "giveaways": "giveaway", "credits": "giveaway",
    }

    COUNTRY_HINTS = {
        "india": "India", "indian": "India", "indians": "India",
        "usa": "United States", "us": "United States", "america": "United States",
        "american": "United States", "americans": "United States", "states": "United States",
        "uk": "United Kingdom", "britain": "United Kingdom", "british": "United Kingdom",
        "germany": "Germany", "german": "Germany",
        "canada": "Canada", "canadian": "Canada",
        "australia": "Australia", "australian": "Australia",
        "europe": "Europe", "european": "Europe",
        "africa": "Africa", "african": "Africa",
        "asia": "Asia", "asian": "Asia",
        "global": "Global", "international": "Global", "worldwide": "Global",
    }

    FUNDING_WORDS = ("paid", "funded", "funding", "stipend", "fully", "sponsored")

    STOPWORDS = {
        "a", "an", "the", "for", "in", "on", "at", "of", "to", "with", "and", "or",
        "is", "are", "any", "all", "me", "my", "i", "want", "looking", "find",
        "show", "give", "get", "need", "best", "top", "new", "opportunities", "opportunity",
    }

    def parse_search_query(self, query: str) -> SearchIntent:
        normalized_query = " ".join(query.lower().split())
        cached = self.search_cache.get(normalized_query)
        if cached and cached[0] > time.monotonic():
            self.search_cache.move_to_end(normalized_query)
            return cached[1]

        if len(normalized_query) < settings.AI_MIN_QUERY_LENGTH_FOR_LLM:
            return self._cache_search_intent(normalized_query, self._mock_parse_search(query))
        if self.use_mock or not self.client:
            return self._cache_search_intent(normalized_query, self._mock_parse_search(query))

        categories = [c.value for c in OpportunityCategory]
        prompt = f"""
You are a search intent parser for an opportunity discovery platform.
Convert the user's natural language query into a structured JSON filter.

Output strictly a valid JSON object with these fields:
- category: one of {json.dumps(categories)} or null if no clear category
- country: eligible country or region name (e.g. "India", "United States", "Global") or null
- tags: list of topic tag strings (e.g. ["AI", "developer"])
- keywords: list of 1-4 significant search terms from the query
- funding_required: true if the user wants paid/funded/stipend opportunities, else false

User query: "{query}"
"""
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You output JSON matching the required search intent schema."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            content = chat_completion.choices[0].message.content
            parsed = json.loads(content)
            return self._cache_search_intent(normalized_query, SearchIntent(**parsed))
        except Exception as e:
            logger.error(f"Groq search parsing failed: {e}. Falling back to mock parser.")
            return self._cache_search_intent(normalized_query, self._mock_parse_search(query))

    def _cache_search_intent(self, normalized_query: str, intent: SearchIntent) -> SearchIntent:
        if not normalized_query:
            return intent
        self.search_cache[normalized_query] = (
            time.monotonic() + settings.AI_QUERY_CACHE_TTL_SECONDS,
            intent,
        )
        self.search_cache.move_to_end(normalized_query)
        while len(self.search_cache) > settings.AI_QUERY_CACHE_MAX_ENTRIES:
            self.search_cache.popitem(last=False)
        return intent

    def _mock_parse_search(self, query: str) -> SearchIntent:
        tokens = re.findall(r"[a-z0-9]+", query.lower())

        category = None
        country = None
        matched = set()

        for token in tokens:
            if category is None and token in self.CATEGORY_SYNONYMS:
                category = self.CATEGORY_SYNONYMS[token]
                matched.add(token)
            if country is None and token in self.COUNTRY_HINTS:
                country = self.COUNTRY_HINTS[token]
                matched.add(token)

        funding_required = any(token in self.FUNDING_WORDS for token in tokens)
        matched.update(t for t in tokens if t in self.FUNDING_WORDS)

        keywords = []
        for token in tokens:
            if token not in matched and token not in self.STOPWORDS and len(token) > 2:
                keywords.append(token)
            if len(keywords) >= 4:
                break

        return SearchIntent(
            category=category,
            country=country,
            tags=keywords[:2],
            keywords=keywords,
            funding_required=funding_required,
        )

ai_service = AIService()
