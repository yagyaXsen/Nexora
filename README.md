# Nexora: AI-Driven Opportunity Discovery & Tracking System

Nexora is an intelligent, high-fidelity platform that automates the collection, extraction, categorization, semantic searching, and tracking of academic and professional opportunities (scholarships, research fellowships, startup accelerators, hackathons, and corporate grants). 

---

## 1. Product Vision: The Core Problem & Solution

### The Scattered Web Problem
Ambitious students, researchers, and early-stage founders waste dozens of hours manually scouring disparate websites (university portals, LinkedIn, NGO websites, accelerator boards, government announcements). 
* **Fragmentation**: Information exists, but there is no centralized database.
* **Unstructured Content**: Webpages are messy and conversational. Humans can read them, but computers cannot easily filter them (e.g., extracting *"funding amount"*, *"deadline dates"*, or *"demographic eligibility"* from 3,000-word articles).
* **Search Blindspots**: Conventional SQL queries look for exact matches. When a student types *"paid fellowships for Indian developers in USA"*, standard database indices miss relevant entries unless they contain that exact string.
* **Leaking Funnels**: Discovering opportunities is only half the struggle. Candidates lose track of deadlines, documents, and application states, managing them in scattered spreadsheets, Notion lists, or notes.

### Nexora’s Solution
Nexora solves these problems by building a robust **Collect → Extract → Categorize → Index → Search → Track** pipeline:
1. **Automated Discovery**: A crawling service that scrapes target websites daily and converts messy DOM trees into clean structured content.
2. **AI-Powered Structured Extraction**: A Gemini LLM pipeline that reads raw crawled pages and parses them into strict, type-validated Pydantic models (extracting titles, organizations, deadlines, countries, categories, and tags).
3. **Hybrid AI Search Assistant**: Translates natural language queries into logical database conditions (intent mapping, cross-country eligibility, and JSON tag intersections) merged with fallback keyword indices.
4. **Interactive Kanban Pipeline & Calendar**: A visual tracking console allowing students to transition bookmarks from *Saved* to *Accepted* with custom workspace diaries.

---

## 2. Technical System Architecture

```
                 [ DAILY SCHEDULER / SSE MANUAL EVENT ]
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  Playwright Scraper /   │
                     │  HTTPX Rotated Crawler  │
                     └─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │   BeautifulSoup DOM     │
                     │  HTML-to-MD Text Clean  │
                     └─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │    Gemini LLM Engine    │
                     │ (JSON Schema Extraction)│
                     └────────────┬────────────┘
                                  │  (Failover: Regex Heuristics)
                                  ▼
                     ┌─────────────────────────┐
                     │   Pydantic Validation   │
                     │    and Sanitize Layer   │
                     └─────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │   PostgreSQL Database   │
                     └─────────────────────────┘
                        ▲                 ▲
                        │                 │
                (Search Query API) (Kanban Tracker API)
                        │                 │
                     ┌──┴─────────────────┴────┐
                     │   FastAPI Backend API   │
                     └─────────────────────────┘
                                  ▲
                                  │ (REST / EventSource SSE)
                                  ▼
                     ┌─────────────────────────┐
                     │   React Vite Frontend   │
                     │   Premium Dark Mode     │
                     └─────────────────────────┘
```

---

## 3. Deep-Dive: How & Why Each Component Works

### A. The Scraper & Crawler Engine (`backend/app/scraper.py`)
* **Why**: Loading heavy pages via headless browsers is resource-intensive. If a crawler gets blocked by Cloudflare, DNS timeouts, or request limits, the backend pipeline should never freeze or crash.
* **How**:
  1. Utilizes rotated `User-Agent` headers and lightweight `httpx` connections for immediate HTML returns.
  2. Parses the raw HTML using `BeautifulSoup`. It strips out irrelevant sections (header, footer, style sheets, scripts, iframe banners) and reconstructs standard HTML elements into clean readable Markdown text.
  3. If a request is blocked, throws an exception, or targets a mock URL, it engages a **high-fidelity mockup generator** that serves simulated content. This keeps the application fully demonstrable under any network conditions.

### B. AI Structured Extraction (`backend/app/ai_service.py`)
* **Why**: LLM outputs are naturally conversational and unpredictable. To load these into PostgreSQL, they must be parsed into strict SQL types (e.g., date formats, list parameters, and category enums).
* **How**:
  1. Integrates with the **Gemini API** (`gemini-1.5-flash`) using Structured Outputs (`response_mime_type: "application/json"`).
  2. Prompt templates instruct the LLM to convert vague deadline texts (e.g., *"closing at the end of next July"*) into valid SQL dates (`YYYY-MM-DD`).
  3. **Bulletproof Fallback Engine**: If the `GEMINI_API_KEY` is not present, the system runs an advanced local regex parser that reads the scraped markdown blocks, extracts fields, parses months into date structures, and maps keywords into tags deterministically.

### C. PostgreSQL Database Schema (`backend/app/models.py`)
* We use a relational schema to manage structural dependencies and application states:
  * **`opportunities`**: Contains fully detailed opportunity specs. We use a **`url` unique index** to prevent duplicate entries from multiple scrapes.
  * **`scraped_sources`**: Tracks our target scrapers, their respective crawl status, and last scraped timestamps.
  * **`applications`**: User tracking table. References `opportunities.id` with `ondelete="CASCADE"`. This ensures that if an opportunity is removed, its bookmarks disappear instantly.

### D. Hybrid Search Assistant (`backend/app/search.py`)
* **Why**: Traditional keyword searches (e.g. `ILIKE`) are too literal. If a user asks for *"paid fellowships for Indian developers in Europe"*, a keyword search misses opportunities that say *"Global eligibility"* or fail to contain the specific word *"paid"* (using *"funded"* instead).
* **How**:
  1. The search assistant passes the user query to the AI parser, which extracts the structural intent (Category: `Fellowship`, Country: `Europe`, Tags: `['AI', 'Developer']`, FundingRequired: `True`).
  2. The query constructor then builds a dynamic SQL query:
     - **Cross-Region Coverage**: If `Country=Europe` is searched, SQL matches `country ILIKE '%europe%'` OR `country ILIKE '%global%'` (since global applicants apply).
     - **Array Intersection**: Scans the PostgreSQL `JSONB` array for overlapping tags.
     - **Broad Search Fallback**: If strict conditions yield zero matches, the system gracefully degrades to a full-text SQL broad keyword scan.

### E. Server-Sent Events Scraping Stream (`backend/app/routes/scraper.py`)
* **Why**: Scraping multiple sites is slow and typically blocks HTTP responses. The user must not experience a blank loader screen that times out.
* **How**:
  * Implements Server-Sent Events (SSE) using FastAPI's `StreamingResponse`. 
  * When clicked, the frontend opens an `EventSource` connection. The backend streams real-time JSON log frames detailing Playwright crawls, LLM structures, duplicate validations, and SQL inserts, providing a highly visual experience.

---

## 4. How to Set Up & Run the MVP

### Prerequisites
* **macOS** with Homebrew
* **PostgreSQL** running locally
* **Python 3.13** and **Node.js v25** (with NPM)

### 1. Database Creation
Verify your local postgres is running, then create the database:
```bash
createdb nexora_db
```

### 2. Backend Setup
1. Open a new terminal tab and enter the backend directory:
   ```bash
   cd backend
   ```
2. Install the required Python packages:
   ```bash
   pip3 install -r requirements.txt
   ```
3. Initialize your environment file. Create `/Users/alokkumar/Nexora/.env` (or a `.env` in the `backend/` directory) and populate it:
   ```env
   DATABASE_URL=postgresql://localhost:5432/nexora_db
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *Note: If you leave `GEMINI_API_KEY` blank, Nexora's regex heuristics will automatically handle all scrapes and queries, making it fully operational.*

4. Launch the FastAPI server:
   ```bash
   python3 run.py
   ```
   The backend will boot up at `http://localhost:8000`. You can inspect the fully interactive Swagger documentation at `http://localhost:8000/docs`.

### 3. Frontend Setup
1. Open a new terminal tab and enter the frontend directory.
2. Initialize Vite + React (we will build this in Phase 4).
3. Run npm setup and boot the dev server:
   ```bash
   npm run dev
   ```
   The frontend UI dashboard will be accessible at `http://localhost:5173`.
