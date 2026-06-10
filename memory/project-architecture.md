---
name: project-architecture
description: Complete architecture of the Nexora project
metadata:
  type: reference
  category: documentation
---

# Nexora Project Architecture

## Overview
Nexora is a full-stack web application that serves as an AI-powered opportunity discovery platform for fellowships, scholarships, grants, and other educational/career opportunities. It consists of a React frontend and FastAPI backend with PostgreSQL database.

## Frontend (React)
- **Framework**: React with Vite
- **Styling**: CSS with custom properties
- **Main Component**: App.jsx - Contains the core application logic and UI
- **Key Features**:
  - Landing page with multiple design variants (Kombai)
  - Opportunity discovery and search
  - Application tracking dashboard
  - Profile management
  - Scraper console
  - Calendar view for deadlines

### Key Frontend Components
1. **App.jsx** - Main application component with routing and state management
2. **OpportunityDetails.jsx** - Detailed view of opportunities
3. **ProfileSettings.jsx** - User profile management
4. **ScraperConsole.jsx** - Scraper management and monitoring
5. **LandingPage.jsx** - Entry point with search functionality

## Backend (FastAPI)
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Key Dependencies**: 
  - SQLAlchemy (ORM)
  - psycopg2 (PostgreSQL driver)
  - Google Generative AI (Gemini)
  - Groq
  - Playwright (web scraping)
  - BeautifulSoup4 (HTML parsing)

### Backend Structure
```
backend/
├── app/
│   ├── main.py          # FastAPI app and routing
│   ├── models.py         # Database models
│   ├── schemas.py        # Pydantic schemas
│   ├── database.py         # Database configuration
│   ├── config.py          # Configuration management
│   ├── crud.py           # Database operations
│   ├── ai_service.py      # AI integration
│   ├── scraper.py         # Web scraping logic
│   ├── search.py          # Search functionality
│   └── routes/          # API route handlers
│       ├── opportunities.py
│       ├── applications.py
│       ├── profile.py
│       └── scraper.py
├── requirements.txt        # Python dependencies
└── .env                 # Environment variables
```

### API Endpoints
- **Opportunities**: `/api/opportunities/`
  - GET `/` - List opportunities with pagination and filters
  - POST `/search` - AI-powered search
  - GET `/stats` - Dashboard statistics
  - GET `/recommendations` - Personalized recommendations
  - GET `/{opportunity_id}` - Get specific opportunity

- **Applications**: `/api/applications/`
  - GET `/` - Get all applications
  - POST `/` - Create new application
  - PUT `/{application_id}` - Update application
  - DELETE `/{application_id}` - Delete application

- **Profile**: `/api/profile/`
  - GET `/` - Get user profile
  - PUT `/` - Update user profile

- **Scraper**: `/api/scraper/`
  - GET `/sources` - Get scraper sources
  - GET `/run` - Run scraper (SSE streaming)

### Database Models
1. **Opportunity** - Represents opportunities (fellowships, scholarships, etc.)
2. **ScrapedSource** - Sources for web scraping
3. **Application** - User's applications to opportunities
4. **UserProfile** - User profile information

### AI Services
- **Gemini AI** - Used for opportunity extraction and search query parsing
- **Groq** - Alternative AI provider
- **Local Fallbacks** - Heuristic parsing when AI is unavailable

### Web Scraping
- **Playwright** - Headless browser for JavaScript-heavy sites
- **BeautifulSoup** - HTML parsing
- **Smart Fallbacks** - Mock data generation for testing

## Deployment
- **Frontend**: Vite development server
- **Backend**: Uvicorn ASGI server
- **Database**: PostgreSQL

## Key Features
1. **AI-Powered Discovery** - Intelligent opportunity matching based on user profile
2. **Web Scraping** - Automated collection of opportunities from various sources
3. **Application Tracking** - Kanban-style application management
4. **Personalized Recommendations** - Profile-based opportunity suggestions
5. **Natural Language Search** - AI-enhanced search capabilities
6. **Multi-variant UI** - Different design systems for different user experiences