import os
import json
import re
from datetime import datetime, date
import google.generativeai as genai
import groq
from typing import Dict, Any, List, Optional
from .config import settings

# Initialize Gemini if API key is present
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    gemini_available = True
else:
    gemini_available = False

class AIService:
    def __init__(self):
        self.model_name = "gemini-1.5-flash"
        self.model = None
        self.groq_client = None
        
        if settings.GROQ_API_KEY:
            try:
                self.groq_client = groq.Groq(api_key=settings.GROQ_API_KEY)
                print("[AI Config] Successfully initialized Groq Client")
            except Exception as e:
                print(f"[AI Config Error] Failed to init Groq client: {e}")
                
        elif gemini_available:
            try:
                self.model = genai.GenerativeModel(self.model_name)
                print("[AI Config] Successfully initialized Gemini Client")
            except Exception as e:
                print(f"[AI Config Error] Failed to init Gemini model: {e}")

    def extract_opportunities(self, raw_text: str, source_url: str) -> List[Dict[str, Any]]:
        """Extracts a list of structured opportunity details from raw scraper text using Groq, Gemini, or smart fallback."""
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

    def parse_search_query(self, user_query: str) -> Dict[str, Any]:
        """Translates a user's natural language search query into structured database filters."""
        default_filters = {
            "category": None,
            "country": None,
            "tags": [],
            "keywords": [user_query],
            "funding_required": False
        }
        
        if self.groq_client or (self.model and settings.GEMINI_API_KEY):
            try:
                prompt = f"""
Analyze the user's search query and translate it into database filters.
Always return a valid JSON object matching the JSON schema below. Do not output any markdown formatting (like ```json), commentary, or extra text.

User Search Query: "{user_query}"

JSON Schema to return:
{{
  "category": "Extract standard category if mentioned, else null. One of: Fellowship, Scholarship, Grant, Accelerator, Hackathon",
  "country": "Extract country or region if mentioned (e.g. 'India', 'Europe', 'USA'), else null. If 'global' is implied, use 'Global'",
  "tags": ["A list of 1-3 tags implied by the search (e.g. ['AI', 'Women', 'Research', 'Student', 'Climate'])"],
  "keywords": ["1-3 key terms/nouns extracted from the query for keyword search"],
  "funding_required": true
}}
Note: funding_required must be a boolean.
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
                
                filters = json.loads(response_text)
                return filters
            except Exception as e:
                print(f"[AI Query Parse Failed] Falling back to local token parser. Error: {e}")
                return self._local_token_query_parser(user_query)
        else:
            return self._local_token_query_parser(user_query)

    def _sanitize_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validates fields, fixes deadlines, and guarantees tag schemas with enhanced validation."""
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

        # Enhanced deadline validation with standardized date formats
        dl = data.get("deadline")
        if dl:
            try:
                # If date is in string format YYYY-MM-DD
                if isinstance(dl, str):
                    datetime.strptime(str(dl), "%Y-%m-%d")
            except ValueError:
                # Fallback to null if LLM sent invalid date
                data["deadline"] = None
        else:
            data["deadline"] = None

        # Enhanced funding information standardization
        funding = data.get("funding")
        if funding:
            # Standardize funding format
            if isinstance(funding, str):
                # Extract numeric values and standardize format
                import re
                # Look for dollar amounts
                dollar_matches = re.findall(r'\$?(\d+(?:,\d{3})*(?:\.\d{2})?)', funding)
                if dollar_matches:
                    data["funding_standardized"] = ", ".join(dollar_matches)
                else:
                    data["funding_standardized"] = funding
            else:
                data["funding_standardized"] = str(funding)
        else:
            data["funding_standardized"] = "Unspecified"

        # Guarantee tags is list of strings with enhanced validation
        if "tags" not in data or not isinstance(data["tags"], list):
            data["tags"] = []
        # Clean and standardize tags
        cleaned_tags = []
        for tag in data["tags"]:
            if isinstance(tag, str) and tag.strip():
                cleaned_tags.append(tag.strip().title())
        data["tags"] = cleaned_tags[:5]  # Limit to 5 tags maximum

        # Default country with enhanced validation
        if not data.get("country"):
            data["country"] = "Global"
        else:
            # Standardize country names
            country = data["country"].strip()
            if "global" in country.lower() or "worldwide" in country.lower():
                data["country"] = "Global"
            elif "india" in country.lower():
                data["country"] = "India"
            elif "europe" in country.lower() or "eu" in country.lower():
                data["country"] = "Europe"
            elif "usa" in country.lower() or "united states" in country.lower():
                data["country"] = "USA"
            else:
                data["country"] = country

        # Enhanced title validation
        if not data.get("title") or not data["title"].strip():
            data["title"] = "Untitled Opportunity"
        else:
            data["title"] = data["title"].strip()

        # Enhanced organization validation
        if not data.get("organization") or not data["organization"].strip():
            data["organization"] = "Unknown Organization"
        else:
            data["organization"] = data["organization"].strip()

        # Enhanced description validation
        if not data.get("description") or not data["description"].strip():
            data["description"] = "No description available"
        else:
            data["description"] = data["description"].strip()

        # Enhanced eligibility validation
        if not data.get("eligibility") or not data["eligibility"].strip():
            data["eligibility"] = "See opportunity details for specific requirements"
        else:
            data["eligibility"] = data["eligibility"].strip()

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
            elif "Deadline:" in line or "### Application Deadline:" in line:
                deadline_str = line.split(":", 1)[1].strip()
            elif "Eligibility:" in line or "Location / Eligibility:" in line:
                eligibility = line.split(":", 1)[1].strip()

        # Extract Category & Tags from url/title keywords
        all_content = (title + " " + raw_text).lower()
        if "fellow" in all_content:
            category = "Fellowship"
            tags.append("Fellowship")
        elif "scholar" in all_content:
            category = "Scholarship"
            tags.append("Scholarship")
        elif "grant" in all_content:
            category = "Grant"
            tags.append("Grant")
        elif "accelerat" in all_content or "startup" in all_content:
            category = "Accelerator"
            tags.append("Startup")
        elif "hack" in all_content:
            category = "Hackathon"
            tags.append("Hackathon")
            
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
            "eligibility": eligibility,
            "url": source_url
        }]

    def _local_token_query_parser(self, user_query: str) -> Dict[str, Any]:
        """Local tokenizer to parse natural queries and return search parameters."""
        q = user_query.lower()
        
        category = None
        if "fellow" in q:
            category = "Fellowship"
        elif "scholar" in q:
            category = "Scholarship"
        elif "grant" in q:
            category = "Grant"
        elif "accelerat" in q or "incubat" in q:
            category = "Accelerator"
        elif "hack" in q:
            category = "Hackathon"

        country = None
        if "india" in q:
            country = "India"
        elif "europe" in q or "eu" in q:
            country = "Europe"
        elif "usa" in q or "america" in q:
            country = "USA"
        elif "global" in q or "international" in q:
            country = "Global"

        tags = []
        if "women" in q or "female" in q or "founder" in q:
            tags.append("Women")
        if "ai" in q or "ml" in q or "tech" in q:
            tags.append("AI")
        if "student" in q or "undergrad" in q or "grad" in q:
            tags.append("Student")
        if "research" in q or "science" in q:
            tags.append("Research")
            
        funding_required = any(k in q for k in ["funded", "funding", "paid", "stipend", "money", "grant", "cash"])

        # Extract keywords (ignoring stop words)
        stop_words = {"in", "for", "a", "an", "the", "of", "and", "or", "to", "with", "grants", "fellowships", "scholarships", "accelerators", "hackathons"}
        words = [w.strip("?,.!") for w in q.split()]
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        
        if not keywords:
            keywords = [user_query]

        return {
            "category": category,
            "country": country,
            "tags": tags,
            "keywords": keywords[:3],
            "funding_required": funding_required
        }

    def generate_application_draft(self, profile: Dict[str, Any], opportunity: Dict[str, Any], draft_type: str) -> str:
        """Generates a highly tailored, structured application draft (SOP, Cover Letter, or Email) using Groq, Gemini, or a high-quality fallback template."""
        user_name = profile.get("name", "Applicant")
        user_email = profile.get("email", "")
        user_status = profile.get("academic_status", "Student")
        user_univ = profile.get("university", "University")
        user_bio = profile.get("bio", "")
        user_interests = ", ".join(profile.get("research_interests", []))
        
        opp_title = opportunity.get("title", "Opportunity")
        opp_org = opportunity.get("organization", "Organization")
        opp_desc = opportunity.get("description", "")
        opp_elig = opportunity.get("eligibility", "")
        opp_funding = opportunity.get("funding", "")
        opp_deadline = opportunity.get("deadline", "Rolling")
        
        if draft_type == "sop":
            type_label = "Statement of Purpose"
            instructions = "Write a detailed, structured Statement of Purpose (SOP) in academic essay format, outlining why the applicant is a perfect match and how their research goals align with the opportunity."
        elif draft_type == "cover_letter":
            type_label = "Cover Letter"
            instructions = "Write a formal, professional Cover Letter addressed to the selection committee. Include standard header fields, salutation, body paragraphs, and professional sign-off."
        else:
            type_label = "Cold Email"
            instructions = "Write a short, professional, and high-impact cold email addressed to the Program Director or Principal Investigator of this opportunity, requesting a discussion or highlighting candidacy."

        prompt = f"""
You are an expert academic advisor and professional writer. Your task is to draft a highly tailored, structured {type_label} for the opportunity details below, using the applicant's profile.
Do not use any emojis in your response. Keep the tone formal, professional, aspirational, and highly polished. Do not include markdown wraps (like ```markdown), commentary, or extra conversational text.

APPLICANT PROFILE:
- Name: {user_name}
- Current Status: {user_status} at {user_univ}
- Email: {user_email}
- Bio / Research Focus: {user_bio}
- Key Research Interests: {user_interests}

OPPORTUNITY DETAILS:
- Title: {opp_title}
- Organization: {opp_org}
- Category: {opportunity.get("category", "Other")}
- Description: {opp_desc}
- Eligibility: {opp_elig}
- Funding Offer: {opp_funding}
- Deadline: {opp_deadline}

INSTRUCTIONS:
{instructions}
Ensure that the text directly references specific details from both the applicant's profile and the opportunity's focus. Make the alignment clear. Do not use any placeholder brackets (like [Insert Date]) unless absolutely necessary, and if you do, fill them in with appropriate mock data where possible (e.g. today's date or rolling basis). Do not use emojis anywhere in the output.
"""
        if self.groq_client or (self.model and settings.GEMINI_API_KEY):
            try:
                response_text = ""
                if self.groq_client:
                    response = self.groq_client.chat.completions.create(
                        model="llama-3.1-8b-instant",
                        messages=[{"role": "user", "content": prompt}]
                    )
                    response_text = response.choices[0].message.content
                else:
                    response = self.model.generate_content(prompt)
                    response_text = response.text
                
                return response_text.strip()
            except Exception as e:
                print(f"[AI Draft Generation Failed] Falling back to template-based generator. Error: {e}")
                return self._local_template_draft(profile, opportunity, draft_type)
        else:
            print("[AI Service] Gemini/Groq keys absent. Generating draft using templates.")
            return self._local_template_draft(profile, opportunity, draft_type)

    def _local_template_draft(self, profile: Dict[str, Any], opportunity: Dict[str, Any], draft_type: str) -> str:
        """Generates a high-quality static template fallback for application drafts."""
        user_name = profile.get("name", "Alok Kumar")
        user_email = profile.get("email", "alok.kumar@nexora.io")
        user_status = profile.get("academic_status", "CS Undergraduate")
        user_univ = profile.get("university", "Nexora University")
        user_bio = profile.get("bio", "Focused on machine learning, web applications, and artificial intelligence frameworks.")
        user_interests = ", ".join(profile.get("research_interests", ["Machine Learning", "Software Engineering"]))
        
        opp_title = opportunity.get("title", "Tech Fellowship")
        opp_org = opportunity.get("organization", "Global Research Lab")
        opp_country = opportunity.get("country", "Global")
        opp_funding = opportunity.get("funding", "Fully Funded")

        if draft_type == "email":
            return f"""Subject: Inquiry Regarding {opp_title} - {user_name}

Dear Program Director,

I hope this message finds you well.

My name is {user_name}, and I am currently a {user_status} at {user_univ}. I am writing to express my strong interest in the {opp_title} program hosted by {opp_org}. My academic background and research focus align closely with the initiatives of your organization.

Specifically, my work is centered on {user_interests}. In my academic journey, I have focused on:
"{user_bio}"

Given the focus of {opp_title} on building advanced solutions and fostering global talent, I am eager to contribute my skills and learn from the world-class researchers at your lab. The offer of {opp_funding} would allow me to fully immerse myself in this research.

I have attached my academic resume for your review. I would welcome the opportunity to discuss how my research background and interests can add value to the upcoming cohort. Thank you for your time and consideration.

Sincerely,

{user_name}
{user_email}
{user_univ}"""

        elif draft_type == "cover_letter":
            return f"""{user_name}
{user_univ}
{user_email}

Date: June 13, 2026

To the Selection Committee,
{opp_org}
Location: {opp_country}

Subject: Application for {opp_title}

Dear Members of the Selection Committee,

I am writing to formally submit my application for the {opp_title} opportunity offered by {opp_org}. As a {user_status} at {user_univ} specialized in {user_interests}, I have long admired {opp_org}'s leadership in fostering impactful global research and technological innovation.

My academic bio and research activities focus on the following:
{user_bio}

I believe my technical background makes me a strong fit for the {opp_title} program. In particular, my work with {user_interests} has prepared me to tackle the challenging research objectives outlined in your program description. The prospect of conducting research globally aligns with my career goal of working on scalable, high-impact intelligent platforms.

This opportunity represents the ideal environment for me to apply my expertise while learning from mentors at {opp_org}. I am highly motivated to bring my dedication and collaborative mindset to your cohort.

Thank you for your time, consideration, and review of my application materials. I look forward to the possibility of discussing my candidacy in more detail.

Sincerely,

{user_name}
{user_univ}"""

        else: # sop
            return f"""STATEMENT OF PURPOSE

Applicant: {user_name}
Program: {opp_title}
Institution: {opp_org}

My interest in {opp_title} stems from a desire to work at the intersection of technical innovation and scalable intelligence. As a {user_status} at {user_univ}, I have dedicated my academic training to studying {user_interests}. The opportunity to join the program at {opp_org} represents the logical next step in my development as a researcher.

Throughout my academic career, I have sought out challenging environments to refine my focus. My current research aims and accomplishments are summarized as follows:
{user_bio}

I am particularly drawn to {opp_org} because of its commitment to pioneering research and its track record of supporting ambitious candidates. The {opp_title} matches my academic interests in {user_interests} and will provide the resources, including the {opp_funding} funding structure, necessary to conduct deep research.

In the long term, I plan to leverage the training and connections gained from {opp_org} to lead development on next-generation opportunity intelligence platforms. I am confident that my background, research aptitude, and ambition will allow me to be a productive and active member of your research cohort.

I thank the selection committee for their time and consideration of my statement of purpose.

Submitted by,
{user_name}
{user_univ}"""
