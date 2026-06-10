---
name: development-environment
description: Development environment and setup instructions for Nexora
metadata:
  type: reference
---

# Development Environment

## Prerequisites
- Node.js (for frontend)
- Python 3.8+ (for backend)
- PostgreSQL (database)
- npm/yarn (package manager)

## Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Backend Setup

1. Install Python dependencies:
   ```
   pip install -r backend/requirements.txt
   ```

2. Set up environment variables in `backend/.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   DATABASE_URL=postgresql://localhost:5432/nexora_db
   ```

3. Run database migrations (if applicable):
   ```
   # Alembic commands if using migrations
   ```

4. Start the backend server:
   ```
   uvicorn backend.app.main:app --reload
   ```

## Database Setup

1. Install PostgreSQL
2. Create database:
   ```
   createdb nexora_db
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following:
```
GEMINI_API_KEY="your_gemini_api_key"
GROQ_API_KEY="your_groq_api_key"
DATABASE_URL="postgresql://localhost:5432/nexora_db"
```

## Running the Application

1. Start the backend:
   ```
   uvicorn backend.app.main:app --reload
   ```

2. Start the frontend:
   ```
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Backend API Docs: http://localhost:8000/docs