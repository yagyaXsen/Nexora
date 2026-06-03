# Walkthrough: Phase 2 — AI Recommendations & Bento Profile Hub

I have successfully designed and executed **Phase 2 — AI Recommendations Engine** for Nexora. This upgrade elevates Nexora from a passive aggregator into an **Opportunity Intelligence Platform** using persistent profile schemas, weighted matching heuristics, dynamic match feedback, and an ultra-premium frosted glass Bento Grid panel.

Below is a detailed summary of the architectural changes, UI additions, and backend algorithms.

---

## 🚀 Architectural Accomplishments & Feature Details

### 1. Database User Profile Persistence
* **Model**: Designed the `UserProfile` table inside [models.py](file:///Users/alokkumar/Nexora/backend/app/models.py). It stores standard details alongside flexible parameters (JSON fields for preferred regions and research interest tag lists).
* **Pydantic Validation**: Declared complete schemas (`UserProfileBase`, `UserProfileCreate`, `UserProfileUpdate`, `UserProfile`, and `OpportunityWithMatch`) inside [schemas.py](file:///Users/alokkumar/Nexora/backend/app/schemas.py).
* **Auto-Seeding**: Configured the backend startup event in [main.py](file:///Users/alokkumar/Nexora/backend/app/main.py) to seed a default profile (**Dr. Julian Sterling**, Postdoc at **ETH Zürich**) if the profiles table is empty, ensuring recommendation scoring is fully operational immediately.

### 2. Weighted AI Recommendations Heuristics (70% - 99%)
* **Scoring Endpoint**: Added the `GET /api/opportunities/recommendations` router endpoint in [opportunities.py](file:///Users/alokkumar/Nexora/backend/app/routes/opportunities.py) which pulls opportunities, calculates matching score matrix intersections against the user's active profile, and returns the top 12 matches.
* **Weighted Matching Engine**:
  - **Academic Overlap (30% weight)**: Parses descriptions, eligibility strings, and categories against the user's academic status (e.g. matching "student" keywords for undergraduates, "PhD/Fellowship/Postdoc" keywords for postdoctoral researchers).
  - **Research Interest Tag Overlap (40% weight)**: Intersects custom profile tags against opportunity keywords and titles, scaling scores higher with more intersections.
  - **Geographic Prefs (30% weight)**: Evaluates match coordinates against base cities, global status, and relocation parameters, awarding default offsets to global listings.
  - **Strict Bounding (70% - 99%)**: Scales the final match score using the formula `70 + (29.0 * raw_score / 100)` to ensure all returned scoring matches strictly lie in the premium **70% to 99%** threshold.

### 3. Glassmorphic Bento Profile Settings Grid
* **UX Redesign**: Built a beautiful bento dashboard panel in [App.jsx](file:///Users/alokkumar/Nexora/frontend/src/App.jsx) for the **Profile Settings** tab containing 4 frosted glass boxes:
  - **Box 1: Identity & Bio (Bento Col 8)**: Personal fields alongside a dynamic **Profile Strength Tracker (completeness progress bar)**.
  - **Box 2: Academic Matrix (Bento Col 4)**: Dropdowns for academic statuses, university affiliations, and a verified ID checker badge.
  - **Box 3: Skills & Research Tags (Bento Col 6)**: Clicking or pressing enter adds/removes custom tag badges with smooth transition effects.
  - **Box 4: Relocation & Reach (Bento Col 6)**: Base city inputs, relocation toggles, and preferred region filters.
* **Save Pulse Animation**: Implemented a save button that uses an animated shining lens flare swipe to save changes to the DB and recalculate opportunities match scores.

### 4. Interactive "Matched For You" Ingestion
* **Discovery Toggles**: Designed a navigation switch (`All Discoveries` vs `Matched For You`) in [App.jsx](file:///Users/alokkumar/Nexora/frontend/src/App.jsx).
* **Feedback Feeds**:
  - `All Discoveries` displays the standard, paginated search view.
  - `Matched For You` requests recommended opportunities from the scoring engine and shows the top 12 highly curated cards marked with true match scoring badges calculated from the backend.

---

## 💻 Manual Verification Instructions
1. Connect to **`http://localhost:5175/`** in your browser.
2. Observe the new **Profile Settings** option in your sidebar:
   - Click it to view the frosted **Bento Grid settings dashboard** pre-populated with **Dr. Julian Sterling**.
   - Note the **Profile Strength progress bar** tracking input completeness.
   - Click the close icon on tag badges to delete tags, type a new interest, and press **Enter** to instantly add interest tags.
   - Click **Save & Recalculate AI Match Scores**. Watch the glowing pulse save button swipe its light flare.
3. Switch back to **Search & Explore**:
   - Toggle to **Matched For You (Top 12)**.
   - Watch the frosted glass loading spinner recalculating vectors.
   - Observe the 12 highly curated opportunities sorted descending with match scores between **70% and 99%**.
