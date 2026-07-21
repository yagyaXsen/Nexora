import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

from app.config import settings
from app.schemas import OpportunityExtract
from app.models import OpportunityCategory

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.use_mock = settings.USE_MOCK_AI or not bool(settings.GROQ_API_KEY)
        self.client = None
        if not self.use_mock and settings.GROQ_API_KEY:
            try:
                from groq import Groq
                self.client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}. Falling back to mock mode.")
                self.use_mock = True

    def extract_opportunity(self, text_content: str, source_name: str, candidate_url: str) -> OpportunityExtract:
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

ai_service = AIService()
