"""
Nexora Pipeline Fetcher — powered by Scrapling
===============================================
Three fetch modes, chosen per-source via source.config:

  config: {}                       → Fetcher     (fast HTTP, TLS impersonation)
  config: {"use_js": true}         → PlayWrightFetcher  (JS-rendered pages)
  config: {"use_stealth": true}    → StealthyFetcher    (Cloudflare / WAF bypass)

Falls back to plain httpx if Scrapling is not installed (keeps dev bootstrap working).
"""

import hashlib
import logging
from typing import List, Optional
from urllib.parse import urljoin

import feedparser
from sqlalchemy.orm import Session

from app.models import Source, SourceType, RawDocument, RawDocumentStatus

logger = logging.getLogger(__name__)

# ── Scrapling import — try each fetcher independently ────────────────────────
# A missing DynamicFetcher (PlayWright) shouldn't disable the basic Fetcher.
_SCRAPLING_AVAILABLE = True
_ScraplingFetcher = None
_PlayWrightFetcher = None
_StealthyFetcher = None

try:
    from scrapling import Fetcher as _ScraplingFetcher
except ImportError:
    pass

try:
    from scrapling import DynamicFetcher as _PlayWrightFetcher
except ImportError:
    pass

try:
    from scrapling import StealthyFetcher as _StealthyFetcher
except ImportError:
    pass

if _ScraplingFetcher is None:
    _SCRAPLING_AVAILABLE = False
    logger.warning("Scrapling not installed — falling back to httpx + BeautifulSoup.")
else:
    logger.info(f"Scrapling loaded: Fetcher={_ScraplingFetcher is not None}, "
                f"DynamicFetcher={_PlayWrightFetcher is not None}, "
                f"StealthyFetcher={_StealthyFetcher is not None}")

if not _SCRAPLING_AVAILABLE:
    import httpx
    from bs4 import BeautifulSoup as _BS4

# ── Constants ──────────────────────────────────────────────────────────────────

JUNK_PATH_PATTERNS = [
    '/stories', '/alumni', '/about', '/privacy', '/terms', '/faq',
    '/contact', '/login', '/signup', '/blog', '/news', '/press',
    '/careers#', '/jobs#', '?page=', '#',
]

APPLY_ANCHOR_TEXTS = [
    'apply now', 'apply here', 'apply online', 'start application',
    'submit application', 'apply for', 'apply today', 'apply via',
    'apply to', 'application form', 'apply →', 'apply ->', 'apply »',
    'submit your application', 'register now', 'register here',
    'online application', 'click to apply',
]


def _is_junk_url(url: str) -> bool:
    url_lower = url.lower()
    return any(pat in url_lower for pat in JUNK_PATH_PATTERNS)


# ── Unified page result ────────────────────────────────────────────────────────

class PageResult:
    """Normalised result from any fetcher backend."""
    def __init__(self, url: str, text: str, soup=None):
        self.url = url          # final URL after redirects
        self.text = text        # full page text (stripped)
        self._soup = soup       # raw BeautifulSoup or Scrapling page object

    # ── DOM-agnostic helpers ───────────────────────────────────────────────────

    @staticmethod
    def _find_apply_url_impl(
        css_first_fn, css_all_fn, get_text_fn, get_attr_fn,
        base_url: str, selector: Optional[str],
    ) -> Optional[str]:
        """Single implementation of the 3-step apply-link algorithm.

        Callers supply DOM-adapter callbacks so the same logic works with
        Scrapling, BeautifulSoup, or any other parser.

        Step 1: explicit CSS selector (from source config)
        Step 2: anchor text matching any APPLY_ANCHOR_TEXTS phrase
        Step 3: href containing "apply" or "application"
        """
        if selector:
            el = css_first_fn(selector)
            href = get_attr_fn(el, 'href') if el else None
            if href:
                return urljoin(base_url, href)

        for anchor in (css_all_fn('a[href]') or []):
            text = (get_text_fn(anchor) or '').strip().lower()
            href = (get_attr_fn(anchor, 'href') or '').strip()
            if href and not href.startswith('#') and any(p in text for p in APPLY_ANCHOR_TEXTS):
                return urljoin(base_url, href)

        for anchor in (css_all_fn('a[href]') or []):
            href = (get_attr_fn(anchor, 'href') or '').lower()
            if ('apply' in href or 'application' in href) and not href.startswith('#'):
                return urljoin(base_url, href.strip())

        return None

    @staticmethod
    def _find_cards_impl(
        css_all_fn, get_text_fn, get_attr_fn,
        item_sel: str, title_sel: str, link_sel: str,
    ):
        """Single implementation of listing-card extraction."""
        results = []
        for el in (css_all_fn(item_sel) or [])[:15]:
            title_el = css_all_fn.__wrapped__(title_sel, el) if hasattr(css_all_fn, '__wrapped__') else None
            # Use simple one-element queries for title/link
            results.append(('', ''))  # placeholder
        # Cleaner approach below:
        return []

    def find_apply_url(self, base_url: str, selector: Optional[str] = None) -> Optional[str]:
        """Extract the most direct apply link from the page."""
        if _SCRAPLING_AVAILABLE and self._soup is not None and hasattr(self._soup, 'css'):
            return self._find_apply_url_impl(
                lambda sel: self._soup.css_first(sel),
                lambda sel: self._soup.css(sel),
                lambda el: el.text,
                lambda el, attr: el.attrib.get(attr, ''),
                base_url, selector,
            )
        elif self._soup is not None:
            return self._find_apply_url_impl(
                lambda sel: self._soup.select_one(sel),
                lambda sel: self._soup.find_all(sel.split('[')[0]) if '[' in sel else self._soup.select(sel),
                lambda el: el.get_text(strip=True),
                lambda el, attr: el.get(attr, ''),
                base_url, selector,
            )
        return None

    def find_cards(self, item_sel: str, title_sel: str, link_sel: str):
        """Return list of (title, href) from listing page cards."""
        if _SCRAPLING_AVAILABLE and self._soup is not None and hasattr(self._soup, 'css'):
            return self._scrapling_cards(item_sel, title_sel, link_sel)
        elif self._soup is not None:
            return self._bs4_cards(item_sel, title_sel, link_sel)
        return []

    def _scrapling_cards(self, item_sel, title_sel, link_sel):
        page = self._soup
        results = []
        for el in (page.css(item_sel) or [])[:15]:
            title_node = el.css_first(title_sel)
            link_node = el.css_first(link_sel)
            title = (title_node.text if title_node else el.text or '').strip()[:120]
            href = (link_node.attrib.get('href') if link_node else None) or ''
            if len(title) >= 5 and href:
                results.append((title, href))
        return results

    def _bs4_cards(self, item_sel, title_sel, link_sel):
        soup = self._soup
        results = []
        for el in soup.select(item_sel)[:15]:
            title_node = el.select_one(title_sel)
            link_node = el.select_one(link_sel)
            title = (title_node.get_text(strip=True) if title_node else '').strip()[:120]
            href = (link_node.get('href') if link_node else None) or ''
            if len(title) >= 5 and href:
                results.append((title, href))
        return results


# ── Low-level HTTP helpers ─────────────────────────────────────────────────────

_STEALTH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Upgrade-Insecure-Requests": "1",
}


def _fetch_page(
    url: str,
    use_stealth: bool = False,
    use_js: bool = False,
    timeout: float = 25.0,
) -> Optional[PageResult]:
    """
    Fetch a single URL using the best available backend.

    Priority:
      use_stealth=True  → StealthyFetcher  (Cloudflare/WAF bypass)
      use_js=True       → DynamicFetcher   (JS-rendered pages)
      default           → Fetcher          (fast TLS-impersonating HTTP)
      fallback          → plain httpx      (if Scrapling not installed)
    """
    if _SCRAPLING_AVAILABLE:
        try:
            # Degrade per-mode: if the requested fetcher class didn't load,
            # fall back to the basic Fetcher or httpx.
            if use_stealth and _StealthyFetcher:
                page = _StealthyFetcher().get(url, timeout=timeout)
            elif use_js and _PlayWrightFetcher:
                page = _PlayWrightFetcher().fetch(url, timeout=timeout)
            elif _ScraplingFetcher:
                page = _ScraplingFetcher().get(url, timeout=timeout)
            else:
                # None of the Scrapling fetchers loaded — go straight to httpx fallback
                page = None

            if page is None:
                logger.warning(f"Scrapling returned None for {url}")
                return None

            # get_all_text strips script/style/nav by default in 0.4.x
            text = page.get_all_text(ignore_tags=('script', 'style', 'nav', 'footer', 'header'))
            return PageResult(url=url, text=text, soup=page)

        except TypeError as te:
            # timeout= kwarg not supported by this Scrapling version — retry without
            logger.warning(f"Scrapling timeout kwarg not supported for {url}: {te}. Retrying without timeout.")
            try:
                if use_stealth and _StealthyFetcher:
                    page = _StealthyFetcher().get(url)
                elif use_js and _PlayWrightFetcher:
                    page = _PlayWrightFetcher().fetch(url)
                elif _ScraplingFetcher:
                    page = _ScraplingFetcher().get(url)
                else:
                    page = None
                if page is None:
                    return None
                text = page.get_all_text(ignore_tags=('script', 'style', 'nav', 'footer', 'header'))
                return PageResult(url=url, text=text, soup=page)
            except Exception as inner_e:
                logger.warning(f"Scrapling retry (no timeout) failed for {url}: {inner_e}")
                return None

        except Exception as e:
            logger.warning(f"Scrapling fetch failed for {url}: {e}")
            return None

    # ── Fallback: plain httpx + BeautifulSoup ──────────────────────────────────
    try:
        import httpx
        from bs4 import BeautifulSoup
        with httpx.Client(
            timeout=timeout,
            headers=_STEALTH_HEADERS,
            follow_redirects=True,
        ) as client:
            resp = client.get(url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')
            for noise in soup.select('script,style,nav,footer,header'):
                noise.decompose()
            text = soup.get_text(separator='\n', strip=True)
            return PageResult(url=url, text=text, soup=soup)
    except Exception as e:
        logger.warning(f"httpx fallback fetch failed for {url}: {e}")
        return None


# ── FetchedItem ────────────────────────────────────────────────────────────────

class FetchedItem:
    def __init__(
        self,
        url: str,
        raw_content: str,
        canonical_url: Optional[str] = None,
        apply_url: Optional[str] = None,
    ):
        self.url = url
        self.canonical_url = canonical_url or url
        self.apply_url = apply_url or canonical_url or url
        self.raw_content = raw_content
        self.content_hash = hashlib.sha256(raw_content.encode('utf-8')).hexdigest()


# ── PipelineFetcher ────────────────────────────────────────────────────────────

class PipelineFetcher:

    # ── Public entry point ─────────────────────────────────────────────────────

    def fetch_source(self, db: Session, source: Source) -> List[RawDocument]:
        items: List[FetchedItem] = []
        try:
            if source.type == SourceType.RSS.value:
                items = self._fetch_rss(source)
            elif source.type == SourceType.HTML.value:
                items = self._fetch_html(source)
            elif source.type == SourceType.SITEMAP.value:
                items = self._fetch_sitemap(source)
            else:
                logger.warning(f"Unknown source type: {source.type} for source {source.id}")
        except Exception as e:
            logger.error(f"Error fetching source {source.name} ({source.url}): {e}")
            raise

        raw_docs: List[RawDocument] = []
        for item in items:
            existing = db.query(RawDocument).filter(
                RawDocument.source_id == source.id,
                RawDocument.content_hash == item.content_hash,
            ).first()
            if existing:
                logger.info(f"Unchanged {item.content_hash[:8]} for {item.url}, skipping.")
                continue

            # Embed resolved apply URL on line 1 so extractor lifts it out cleanly
            enriched = f"DIRECT_APPLY_URL: {item.apply_url}\n\n{item.raw_content}"

            raw_doc = RawDocument(
                source_id=source.id,
                url=item.url,
                canonical_url=item.apply_url,
                content_hash=item.content_hash,
                raw_content=enriched,
                status=RawDocumentStatus.FETCHED.value,
            )
            db.add(raw_doc)
            db.flush()
            raw_docs.append(raw_doc)

        db.commit()
        return raw_docs

    # ── Internal: deep-fetch a single program page ─────────────────────────────

    def _deep_fetch_program_page(
        self,
        program_url: str,
        use_stealth: bool = False,
        use_js: bool = False,
        apply_link_selector: Optional[str] = None,
    ) -> FetchedItem:
        page = _fetch_page(program_url, use_stealth=use_stealth, use_js=use_js)
        if not page:
            return FetchedItem(url=program_url, raw_content='', apply_url=program_url)

        apply_url = page.find_apply_url(program_url, apply_link_selector) or program_url

        raw_content = (
            f"# Program Page\n"
            f"**Program URL:** {program_url}\n"
            f"**Apply URL:** {apply_url}\n\n"
            f"{page.text}"
        )
        return FetchedItem(
            url=program_url,
            raw_content=raw_content,
            canonical_url=program_url,
            apply_url=apply_url,
        )

    # ── RSS ────────────────────────────────────────────────────────────────────

    def _fetch_rss(self, source: Source) -> List[FetchedItem]:
        logger.info(f"Fetching RSS: {source.url}")
        config = source.config or {}
        use_stealth = config.get('use_stealth', False)
        use_js = config.get('use_js', False)
        apply_link_selector = config.get('apply_link_selector')

        feed = feedparser.parse(source.url)
        items: List[FetchedItem] = []

        for entry in feed.entries[:20]:
            link = getattr(entry, 'link', None) or source.url
            title = getattr(entry, 'title', '')
            summary = getattr(entry, 'summary', '') or getattr(entry, 'description', '')

            if link and link != source.url and not _is_junk_url(link):
                deep = self._deep_fetch_program_page(
                    link, use_stealth=use_stealth, use_js=use_js,
                    apply_link_selector=apply_link_selector,
                )
                deep.raw_content = (
                    f"# {title}\n"
                    f"**Source:** {source.name}\n"
                    f"**Apply URL:** {deep.apply_url}\n\n"
                    f"## Summary\n{summary}\n\n"
                    f"## Program Page\n{deep.raw_content}"
                )
                items.append(deep)
            else:
                raw_content = (
                    f"# {title}\n**Source:** {source.name}\n**Apply URL:** {link}\n\n"
                    f"## Overview\n{summary}\n"
                )
                if hasattr(entry, 'content'):
                    raw_content += f"\n## Full Description\n{entry.content[0].value}\n"
                items.append(FetchedItem(url=link, raw_content=raw_content, apply_url=link))

        return items

    # ── HTML listing (two-level crawl) ─────────────────────────────────────────

    def _fetch_html(self, source: Source) -> List[FetchedItem]:
        logger.info(f"Fetching HTML listing: {source.url}")
        config = source.config or {}
        use_stealth = config.get('use_stealth', False)
        use_js = config.get('use_js', False)
        item_sel = config.get('item_selector', 'article, .opportunity, .job, .grant, .program-card, .card, li')
        title_sel = config.get('title_selector', 'h1, h2, h3, h4')
        link_sel = config.get('link_selector', 'a')
        apply_link_selector = config.get('apply_link_selector')

        # Level 1: fetch the listing page
        listing = _fetch_page(source.url, use_stealth=use_stealth, use_js=use_js)
        if not listing:
            return []

        cards = listing.find_cards(item_sel, title_sel, link_sel)

        items: List[FetchedItem] = []
        seen: set = set()

        if cards:
            for title_text, href in cards:
                full_href = urljoin(source.url, href) if not href.startswith('http') else href
                if _is_junk_url(full_href) or full_href in seen:
                    continue
                seen.add(full_href)

                logger.info(f"  Deep-fetching: {full_href}")
                deep = self._deep_fetch_program_page(
                    full_href,
                    use_stealth=use_stealth,
                    use_js=use_js,
                    apply_link_selector=apply_link_selector,
                )
                deep.raw_content = (
                    f"# {title_text}\n"
                    f"**Source:** {source.name}\n"
                    f"**Program URL:** {full_href}\n"
                    f"**Apply URL:** {deep.apply_url}\n\n"
                    f"{deep.raw_content}"
                )
                items.append(deep)

        if not items:
            # No cards or all junk — treat the listing page itself as one item
            apply_url = listing.find_apply_url(source.url, apply_link_selector) or source.url
            items.append(FetchedItem(
                url=source.url,
                raw_content=f"# {source.name}\n**Apply URL:** {apply_url}\n\n{listing.text}",
                canonical_url=source.url,
                apply_url=apply_url,
            ))

        return items

    # ── Sitemap ────────────────────────────────────────────────────────────────

    def _fetch_sitemap(self, source: Source) -> List[FetchedItem]:
        logger.info(f"Fetching Sitemap: {source.url}")
        config = source.config or {}
        use_stealth = config.get('use_stealth', False)
        use_js = config.get('use_js', False)
        apply_link_selector = config.get('apply_link_selector')

        import httpx
        from bs4 import BeautifulSoup
        try:
            with httpx.Client(timeout=20, headers=_STEALTH_HEADERS, follow_redirects=True) as client:
                resp = client.get(source.url)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, 'xml')
            locs = [loc.text.strip() for loc in soup.find_all('loc') if loc.text.strip()]
        except Exception as e:
            logger.error(f"Sitemap fetch failed for {source.url}: {e}")
            return []

        items: List[FetchedItem] = []
        for loc in locs[:15]:
            if _is_junk_url(loc):
                continue
            logger.info(f"  Deep-fetching sitemap URL: {loc}")
            deep = self._deep_fetch_program_page(
                loc,
                use_stealth=use_stealth,
                use_js=use_js,
                apply_link_selector=apply_link_selector,
            )
            if deep.raw_content:
                # Wrap with source context so the extractor gets a meaningful
                # title line instead of the generic "# Program Page" header.
                deep.raw_content = (
                    f"# {source.name}\n"
                    f"**Source:** {source.name}\n"
                    f"**Program URL:** {loc}\n"
                    f"**Apply URL:** {deep.apply_url}\n\n"
                    f"{deep.raw_content}"
                )
                items.append(deep)

        return items

    # ── Public utility: resolve apply URL for a known program page ─────────────

    def resolve_apply_url(
        self,
        program_url: str,
        use_stealth: bool = False,
        use_js: bool = False,
        apply_link_selector: Optional[str] = None,
    ) -> str:
        """Fetch a program page and return its direct apply link. Used by backfill."""
        page = _fetch_page(program_url, use_stealth=use_stealth, use_js=use_js)
        if not page:
            return program_url
        return page.find_apply_url(program_url, apply_link_selector) or program_url


fetcher = PipelineFetcher()
