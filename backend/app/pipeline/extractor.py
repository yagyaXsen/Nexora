import re
import logging
from typing import Dict, Any
from app.models import RawDocument

logger = logging.getLogger(__name__)

class ExtractedCandidate:
    def __init__(self, raw_document_id: int, cleaned_text: str, candidate_url: str, candidate_title: str):
        self.raw_document_id = raw_document_id
        self.cleaned_text = cleaned_text
        self.candidate_url = candidate_url
        self.candidate_title = candidate_title

class PipelineExtractor:
    def clean_text(self, raw_content: str) -> str:
        # Remove extra whitespace and boilerplate scripts/styles
        text = re.sub(r'[\r\t]+', ' ', raw_content)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        cleaned = '\n'.join(lines)
        return cleaned[:8000]  # Truncate to reasonable context window

    def extract_candidates(self, raw_doc: RawDocument) -> ExtractedCandidate:
        cleaned_text = self.clean_text(raw_doc.raw_content)
        lines = cleaned_text.splitlines()
        candidate_title = lines[0].replace("Title: ", "") if lines else "Untitled Opportunity"
        candidate_url = raw_doc.canonical_url or raw_doc.url

        return ExtractedCandidate(
            raw_document_id=raw_doc.id,
            cleaned_text=cleaned_text,
            candidate_url=candidate_url,
            candidate_title=candidate_title
        )

extractor = PipelineExtractor()
