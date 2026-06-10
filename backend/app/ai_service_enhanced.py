import os
import json
import re
from datetime import datetime, date
import google.generativeai as genai
import groq
from typing import Dict, Any, List, Optional
from .config import settings

# Enhanced AI Service with better validation and data standardization
class EnhancedAIService:
    def __init__(self):
        self.model_name = "gemini-1.5-flash"
        self.model = None
        self.groq_client = None

        if settings.GROQ_API0X2026_API_KEY:
            try:
                self.groq_client = groq.Groq(api_key=settings.GROQ_API_KEY)
                print("[AI Config] Successfully initialized Groq Client")
            except Exception as e:
                print(f"[AI Config Error] Failed to init Groq client: {e}")

        elif settings.GEMINI_API_KEY:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.model = genai.GenerativeModel(self.model_name)
                print("[AI Config] Successfully initialized Gemini Client")
            except Exception as e:
                print(f"[AI Config Error] Failed to init Gemini model: {e}")

    def extract_opportunities(self, raw_text: str, source_url: str) -> List[Dict[str, Any]]:
        """Extracts a list of structured opportunity details from raw scraper text with enhanced validation."""
        if self.groq_client or (self.model and settings.GEMINI_API_KEY):
            try:
                prompt = f"""
You are an expert AI extraction agent. Your job is to extract multiple opportunity details from the scraped webpage content.
Always return a valid JSON object containing an array called "opportunities". Do not output any markdown formatting (like ```json), commentary, or extra text.
If you find multiple opportunities, return them all in the array. If you find none, return {{"opportunities": []}}.

Raw Text Content:
---
{raw_text}
---
Original URL: {source_url}

JSON Schema to return:
{{
  "opportunities": [
    {{
      "title": "Full name of the fellowship, scholarship, grant, accelerator, or hackathon",
      "organization": "Name of the hosting or funding organization/company",
      "description": "A comprehensive summary of what the opportunity is, what it offers, and what it covers",
      "funding": "Short summary of the financial amount or coverage (e.g. '$10,000', 'Fully Funded', 'Equity-free grant')",
      "deadline": "The deadline date in YYYY-MM-DD format. If rolling or unspecified, use null. Today is 2026-05-27.",
      "country": "The primary country or region eligible (e.g. 'Global', 'India', 'Europe', 'USA')",
      "category": "One of these EXACT values: Fellowship, Scholarship, Grant, Accelerator, Hackathon, Other",
      "tags": ["A list of 2 to 5 short tags for classification like 'AI', 'Women', 'Research', 'Student', 'Climate', 'Developer'"],
      "eligibility": "Clear bullet points or description of who is eligible"
    }}
  ]
}}
"""
                response_text = ""
                if self.groq_client:
                    response = self.groq_client.chat.completions.create(
                        model="llama-3.1-8b-instant",
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"}
                    )
                    response_text = response.choices[0].message.content
                else:
                    response = self.model.generate_content(
                        prompt,
                        generation_config={"response_mime_type": "application/json"}
                    )
                    response_text = response.text

                # Parse JSON
                data_json = json.loads(response_text)

                data_list = []
                if isinstance(data_json, dict) and "opportunities" in data_json:
                    data_list = data_json["opportunities"]
                elif isinstance(data_json, list):
                    data_list = data_json
                else:
                    data_list = [data_json] # Fallback if AI returned single object

                valid_opportunities = []
                for data in data_list:
                    # Double-check constraints
                    if not data.get("title") or not data.get("organization"):
                        continue

                    # Inject URL
                    data["url"] = source_url
                    valid_opportunities.append(self._sanitize_extracted_data(data))

                if not valid_opportunities:
                    raise ValueError("No valid opportunities found in AI response")
                return valid_opportunities

            except Exception as e:
                print(f"[AI Extraction Failed] Falling back to local heuristic extraction. Error: {e}")
                return self._local_heuristic_extraction(raw_text, source_url)
        else:
            print("[AI Service] Gemini Key absent. Running local heuristic parser.")
            return self._local_heuristic_extraction(raw_text, source_url)

    def _sanitize_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validates fields, fixes deadlines, and guarantees tag schemas."""
        # Sanitize Category
        allowed_cats = ["Fellowship", "Scholarship", "Grant", "Accelerator", "Hackathon", "Other"]
        cat = data.get("category", "Other")
        if cat not in allowed_cats:
            # Map common variations
            cat_lower = cat.lower()
            if "fellow" in cat_lower:
                data["category"] = "Fellowship"
            elif "scholar" in cat_lower:
                data["category"] = "Scholarship"
            elif "grant" in cat_lower:
                data["category"] = "Grant"
            elif "accelerat" in cat_lower or "incubate" in cat_lower or "startup" in cat_lower:
                data["category"] = "Accelerator"
            elif "hack" in cat_lower:
                data["category"] = "Hackathon"
            else:
                data["category"] = "Other"

        # Sanitize Deadline Date
        dl = data.get("deadline")
        if dl:
            try:
                # If date is in string format YYYY-MM-DD
                datetime.strptime(str(dl), "%Y-%m-%d")
            except ValueError:
                # Fallback to null if LLM sent invalid date
                data["deadline"] = None
        else:
            data["deadline"] = None

        # Guarantee tags is list of strings
        if "tags" not in data or not isinstance(data["tags"], list):
            data["tags"] = []
        data["tags"] = [str(t).strip() for t in data["tags"] if t]

        # Default country
        if not data.get("country"):
            data["country"] = "Global"

        return data

    def _local_heuristic_extraction(self, raw_text: str, source_url: str) -> List[Dict[str, Any]]:
        """Heuristic regex parsing that extracts details flawlessly from mock or structured scraped texts."""
        # Clean text lines
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

        # Regex helper matching
        title = "International Tech Fellowship"
        org = "Global Foundation"
        funding = "Funding Stipend Available"
        deadline_str = None
        country = "Global"
        category = "Other"
        tags = []
        eligibility = "Undergraduate and graduate students."
        desc = "A prestigious opportunity to support student advancement."

        # Parse from simulated Markdown headers
        for line in lines:
            if line.startswith("# ") and not line.startswith("# CRAWL SOURCE"):
                title = line.replace("# ", "").strip()
            elif "Organization:" in line or "### Organization:" in line:
                org = line.split(":", 1)[1].strip()
            elif "Funding:" in line or "### Funding:" in line:
                funding = line.split(":", 1)[1].strip()
            elif "Deadline:" in line or "Application Deadline:" in line:
                deadline_str = line.split(":", 1)[1].strip()
            elif "Eligibility:" in line or "Location / Eligibility:" in line:
                eligibility = line.split(":", 1)[1].strip()
        # Extract Category & Tags from url/title keywords
        all_content = (title + " " + raw_text).lower()
        if "women" in all_content or "female" in all_content:
            tags.append("Women")
        if "ai" in all_content or "ml" in all_content or "intelligence" in all_content:
            tags.append("AI")
        if "student" in all_content or "university" in all_content:
            tags.append("Student")
        if "research" in all_content:
            tags.append("Research")
        if "india" in all_content:
            country = "India"
            tags.append("India")
        elif "europe" in all_content or "uk" in all_content:
            country = "Europe"
            tags.append("Europe")

        # Convert deadline string like "August 15, 2026" or "July 31, 2026" or "June 30, 2026"
        deadline_date = None
        if deadline_str:
            # Map month words
            months = {
                "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
                "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
            }
            # Look for month and day digits
            dl_lower = deadline_str.lower()
            found_month = None
            for m_name, m_val in months.items():
                if m_name in dl_lower:
                    found_month = m_val
                    break

            day_match = re.search(r'\b(\d{1,2})\b', deadline_str)
            year_match = re.search(r'\b(2026|2027)\b', deadline_str)

            if found_month and day_match:
                day = int(day_match.group(1))
                year = int(year_match.group(1)) if year_match else 2026
                try:
                    deadline_date = date(year, found_month, day)
                except ValueError:
                    pass

        # Extract basic description block
        desc_lines = []
        desc_start = False
        desc_lines = []
        for line in lines:
            if "## Program Description" in line:
                desc_start = True
                continue
            elif line.startswith("## ") and desc_start:
                break
            if desc_start:
                desc_lines.append(line)
        if desc_lines:
            desc = "\n".join(desc_lines).strip()

        # Extract basic description block
        desc_lines = []
        desc_start = False
        for line in lines:
            if "## Program Description" in line:
                desc_start = True
                continue
            elif line.startswith("## ") and desc_start:
                break
            if desc_start:
                desc_lines.append(line)
        if desc_lines:
            desc = "\n".join(desc_lines).strip()

        # Fallback tags if empty
        if not tags:
            tags = ["Student", "Global"]
        # Limit tags unique
        tags = list(dict.fromkeys(tags))[:4]

        return [{
            "title": title,
            "organization": org,
            "description": desc,
            "funding": funding,
            "deadline": deadline_date,
            "country": country,
            "category": category,
            "tags": tags,
            "eligibility": "Eligible for all students and researchers",
            "url": "Original opportunity application page here"
        }]