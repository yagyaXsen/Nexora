import re
import logging
from app.models import RawDocument

logger = logging.getLogger(__name__)

# The fetcher embeds the resolved apply URL as the very first line of raw_content
# in this format so the extractor can lift it out reliably.
_DIRECT_APPLY_PREFIX = "DIRECT_APPLY_URL: "

# Title artefacts introduced by the pipeline or scraped from nav elements.
# These are stripped from the title at extraction time so the AI and the
# frontend always see clean, display-ready titles.
_TITLE_CLEANUP_REGEXES = [
    re.compile(r"^DIRECT_APPLY_URL:\s*\S+\s*", re.IGNORECASE),
    re.compile(r"^Program Page\s*", re.IGNORECASE),
    re.compile(r"^title:\s*", re.IGNORECASE),
    re.compile(r"^(Stories|About|Home|Search|Contact|Menu|Navigation|Skip to content)\s*", re.IGNORECASE),
]


def _clean_title(title: str) -> str:
    """Strip pipeline artefacts and HTML nav leftovers from a scraped title."""
    if not title:
        return ""
    text = title
    for pattern in _TITLE_CLEANUP_REGEXES:
        text = pattern.sub("", text)
    return text.strip()


class ExtractedCandidate:
    def __init__(
        self,
        raw_document_id: int,
        cleaned_text: str,
        candidate_url: str,
        candidate_title: str,
        direct_apply_url: str,
    ):
        self.raw_document_id = raw_document_id
        self.cleaned_text = cleaned_text
        self.candidate_url = candidate_url       # the program page URL
        self.candidate_title = candidate_title
        self.direct_apply_url = direct_apply_url  # the resolved apply button URL


class PipelineExtractor:
    def clean_text(self, raw_content: str) -> str:
        text = re.sub(r"[\r\t]+", " ", raw_content)
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        cleaned = "\n".join(lines)
        return cleaned[:8000]

    def extract_candidates(self, raw_doc: RawDocument) -> ExtractedCandidate:
        raw_content = raw_doc.raw_content or ""

        # Pull out the DIRECT_APPLY_URL header the fetcher planted on line 1
        direct_apply_url: str = raw_doc.canonical_url or raw_doc.url
        first_line = raw_content.split("\n", 1)[0].strip()
        if first_line.startswith(_DIRECT_APPLY_PREFIX):
            direct_apply_url = first_line[len(_DIRECT_APPLY_PREFIX):].strip() or direct_apply_url

        cleaned_text = self.clean_text(raw_content)
        lines = cleaned_text.splitlines()

        # Strip the DIRECT_APPLY_URL prefix line from cleaned text so the AI
        # never sees the pipeline artifact — it gets only the real content.
        content_lines = lines
        if content_lines and content_lines[0].startswith(_DIRECT_APPLY_PREFIX):
            content_lines = content_lines[1:]

        cleaned_text_clean = "\n".join(content_lines) if content_lines else ""

        # Derive the title from the first *real* content line
        title_line = content_lines[0] if content_lines else ""
        raw_title = title_line.lstrip("# ").replace("Title: ", "") or "Untitled Opportunity"
        candidate_title = _clean_title(raw_title)

        candidate_url = raw_doc.canonical_url or raw_doc.url

        return ExtractedCandidate(
            raw_document_id=raw_doc.id,
            cleaned_text=cleaned_text_clean,
            candidate_url=candidate_url,
            candidate_title=candidate_title,
            direct_apply_url=direct_apply_url,
        )


extractor = PipelineExtractor()
