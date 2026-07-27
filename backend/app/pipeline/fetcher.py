import hashlib
import logging
from typing import List, Dict, Any, Optional
import httpx
import feedparser
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from app.models import Source, SourceType, RawDocument, RawDocumentStatus

logger = logging.getLogger(__name__)

class FetchedItem:
    def __init__(self, url: str, raw_content: str, canonical_url: Optional[str] = None):
        self.url = url
        self.canonical_url = canonical_url or url
        self.raw_content = raw_content
        self.content_hash = hashlib.sha256(raw_content.encode("utf-8")).hexdigest()

class PipelineFetcher:
    def __init__(self, timeout: float = 15.0):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "NexoraDiscoveryBot/1.0 (+https://nexora.io)"
        }

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
                logger.warning(f"Unknown source type: {source.type} for source ID {source.id}")
        except Exception as e:
            logger.error(f"Error fetching source {source.name} ({source.url}): {e}")
            raise

        raw_docs: List[RawDocument] = []
        for item in items:
            # Skip if content_hash already exists for this source
            existing = db.query(RawDocument).filter(
                RawDocument.source_id == source.id,
                RawDocument.content_hash == item.content_hash
            ).first()

            if existing:
                logger.info(f"Unchanged content hash {item.content_hash[:8]} for {item.url}, skipping fetch.")
                continue

            raw_doc = RawDocument(
                source_id=source.id,
                url=item.url,
                canonical_url=item.canonical_url,
                content_hash=item.content_hash,
                raw_content=item.raw_content,
                status=RawDocumentStatus.FETCHED.value
            )
            db.add(raw_doc)
            db.flush()
            raw_docs.append(raw_doc)

        db.commit()
        return raw_docs

    def _fetch_rss(self, source: Source) -> List[FetchedItem]:
        logger.info(f"Fetching RSS feed: {source.url}")
        feed = feedparser.parse(source.url)
        items = []
        for entry in feed.entries[:20]:  # Cap per run
            link = getattr(entry, "link", source.url)
            title = getattr(entry, "title", "")
            summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
            raw_content = f"Title: {title}\nLink: {link}\nSummary: {summary}\n"
            if hasattr(entry, "content"):
                raw_content += f"Content: {entry.content[0].value}\n"
            
            items.append(FetchedItem(url=link, raw_content=raw_content, canonical_url=link))
        return items

    def _fetch_html(self, source: Source) -> List[FetchedItem]:
        logger.info(f"Fetching HTML page: {source.url}")
        with httpx.Client(timeout=self.timeout, headers=self.headers, follow_redirects=True) as client:
            resp = client.get(source.url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

        config = source.config or {}
        item_selector = config.get("item_selector", "article, .opportunity, .job, .grant, .program-card, .card")
        title_selector = config.get("title_selector", "h1, h2, h3")
        link_selector = config.get("link_selector", "a")

        elements = soup.select(item_selector)
        items = []
        if not elements:
            # Treat entire page as single opportunity item
            items.append(FetchedItem(url=source.url, raw_content=soup.get_text(separator="\n"), canonical_url=source.url))
            return items

        junk_href_patterns = ['/stories', '/alumni', '/about', '/privacy', '/terms', '/faq', '/contact', '/login', '/signup']

        for el in elements[:15]:
            link_el = el.select_one(link_selector) if link_selector else None
            href = link_el.get("href") if link_el and link_el.get("href") else source.url
            if href and not href.startswith("http"):
                from urllib.parse import urljoin
                href = urljoin(source.url, href)

            if any(pat in href.lower() for pat in junk_href_patterns):
                continue

            title_el = el.select_one(title_selector) if title_selector else None
            title_text = title_el.get_text(strip=True) if title_el else ""
            if not title_text or len(title_text) < 5:
                continue

            raw_text = el.get_text(separator="\n", strip=True)
            items.append(FetchedItem(url=href or source.url, raw_content=f"Title: {title_text}\nContent: {raw_text}", canonical_url=href))
        
        if not items:
            items.append(FetchedItem(url=source.url, raw_content=soup.get_text(separator="\n"), canonical_url=source.url))
            
        return items

    def _fetch_sitemap(self, source: Source) -> List[FetchedItem]:
        logger.info(f"Fetching Sitemap: {source.url}")
        with httpx.Client(timeout=self.timeout, headers=self.headers, follow_redirects=True) as client:
            resp = client.get(source.url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "xml")

        locs = [loc.text.strip() for loc in soup.find_all("loc")]
        items = []
        for loc in locs[:15]:
            try:
                with httpx.Client(timeout=self.timeout, headers=self.headers, follow_redirects=True) as client:
                    page_resp = client.get(loc)
                    if page_resp.status_code == 200:
                        page_soup = BeautifulSoup(page_resp.text, "html.parser")
                        items.append(FetchedItem(url=loc, raw_content=page_soup.get_text(separator="\n"), canonical_url=loc))
            except Exception as e:
                logger.warning(f"Failed to fetch sitemap URL {loc}: {e}")
        return items

fetcher = PipelineFetcher()
