# Nexora: Comprehensive System Architecture & Tech Stack Documentation

## 🌟 What is Nexora?
**Nexora** is an AI-driven platform designed to automate the discovery and tracking of academic and professional opportunities (such as scholarships, fellowships, hackathons, and corporate grants). 

It solves a massive problem: **Information fragmentation**. Opportunity details are scattered across the web, written in messy, unstructured formats, and hard to search. Nexora automates this by scraping web pages, using AI to intelligently extract key information into a structured database, and providing a dynamic search and Kanban tracking experience for the user.

---

## 🏗️ The Tech Stack

The application follows a modern decoupled architecture, split between a highly robust Python backend and a lightning-fast React frontend.

### **Backend (Python 3.13)**
The backend is responsible for API routing, orchestrating the web scraping, communicating with the AI models, and managing the database.

* **Core Framework:** **FastAPI** + **Uvicorn**
  * *Why:* Extremely fast, highly asynchronous, and natively supports Server-Sent Events (SSE) which is used for real-time scraping logs.
* **Database & ORM:** **PostgreSQL** + **SQLAlchemy** + **psycopg2-binary**
  * *Why:* Relational database for structuring the data (Opportunities, Scraped Sources, Applications).
* **Data Validation:** **Pydantic**
  * *Why:* Validates the structure of the data coming *out* of the AI model to ensure dates, lists, and strings strictly match the SQL database types.
* **Scraping Engine:** **Playwright** + **HTTPX** + **BeautifulSoup4**
  * *Why:* Uses `httpx` for fast, lightweight HTTP crawling, `playwright` for headless browsing on heavy JavaScript sites, and `beautifulsoup4` to clean messy HTML into readable Markdown.
* **AI Engine:** **Google Generative AI (Gemini 1.5 Flash)** + **Groq**
  * *Why:* Parses the raw scraped Markdown and intelligently converts it into structured JSON schemas.

### **Frontend (JavaScript / React)**
The user-facing interface, designed with a premium dark mode aesthetic.

* **Core Framework:** **React 19**
* **Build Tool:** **Vite 8**
  * *Why:* Offers blazing-fast hot module replacement (HMR) and optimized build times compared to Webpack/Create React App.
* **Icons:** `lucide-react` (for sleek, modern SVG icons).
* **Styling:** Vanilla CSS 
  * *Why:* A bespoke, highly controlled CSS design system prioritizing high-fidelity premium designs over generic utility classes.

---

## ⚙️ How the System Actually Works (The Pipeline)

Nexora follows a precise 6-step pipeline: **Collect → Extract → Categorize → Index → Search → Track**.

### 1. The Scraper Engine (Collect)
Instead of freezing the app when trying to load heavy pages, Nexora uses asynchronous workers. It uses `httpx` with rotated user-agents to fetch the HTML. If the page requires Javascript, it boots up `Playwright`. Once it has the DOM tree, `BeautifulSoup` strips out the garbage (navbars, footers, ad banners) and converts the core content into clean Markdown.

### 2. The AI Extraction (Extract & Categorize)
Raw text is useless for a database. Nexora takes the cleaned Markdown and feeds it to the **Gemini LLM**. 
It uses a highly specific prompt to force the LLM to output pure JSON. For example, if the webpage says *"applications close at the end of next July"*, the AI converts that into a strict `YYYY-MM-DD` SQL date format. It also extracts arrays of tags and categorizes the opportunity.
*(Fallback: If the Gemini API key is missing, the system gracefully degrades to using advanced local Regex heuristics).*

### 3. Real-Time Streaming (Server-Sent Events)
Web scraping takes time. Instead of making the user stare at a blank loading screen, Nexora uses **SSE (Server-Sent Events)** via FastAPI. As the backend crawls websites and as the AI extracts data, it streams these events to the React frontend in real-time.

### 4. The Database Schema (Index)
The verified data is saved into PostgreSQL under three main tables:
* `opportunities`: The actual grants/fellowships (uses a unique URL index to prevent duplicates).
* `scraped_sources`: Metadata on what websites were scraped and when.
* `applications`: A table bridging users to opportunities, using cascading deletes so if an opportunity is removed, user bookmarks update instantly.

### 5. Hybrid Search Assistant (Search)
Standard SQL `ILIKE` searches are rigid (e.g., searching "paid" misses opportunities that say "funded"). 
Nexora's search passes the user's natural language query to the AI to extract their *intent*. It then builds a dynamic SQL query that searches across regions, checks for JSON array tag intersections, and falls back to broad keywords if strict conditions fail.

### 6. Kanban Board (Track)
Finally, on the React frontend, users can add these opportunities to their pipeline and move them across a visual Kanban board (from *Saved* → *Applying* → *Accepted*).
