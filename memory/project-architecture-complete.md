---
name: project-architecture-complete
description: Complete architecture documentation for the Nexora project
metadata:
  type: reference
---

# Nexora Complete Architecture Documentation

## System Overview

Nexora is a full-stack web application built with a React frontend and FastAPI backend. The system is designed to help users discover and track educational and career opportunities through AI-powered matching and web scraping capabilities.

## Frontend Architecture (React)

### Core Components
1. **App Component** (`App.jsx`)
   - Main application component that handles routing and state management
   - Contains the core logic for the application's main views:
     - Discovery & Search
     - Dashboard analytics
     - Application tracker (Kanban board)
     - Profile settings
     - Calendar view
     - Scraper console

2. **Feature Components**:
   - `OpportunityDetails.jsx` - Detailed view of opportunities
   - `ProfileSettings.jsx` - User profile management
   - `ScraperConsole.jsx` - Scraper management and monitoring
   - `LandingPage.jsx` - Entry point with search functionality

3. **Design System**:
   - Multiple HTML variants in the public directory for different design approaches (Kombai system)
   - Responsive design with modern UI patterns

### Key Features
- Opportunity discovery through AI matching
- Application tracking with Kanban-style interface
- Profile management for personalized recommendations
- Scraper monitoring and control
- Calendar view for deadline tracking

## Backend Architecture (FastAPI)

### Core Structure
```
backend/
├── app/
│   ├── main.py          # FastAPI app initialization and routing
│   ├── models.py        # Database models (Opportunity, ScrapedSource, Application, UserProfile)
│   ├── schemas.py        # Pydantic schemas for data validation
│   ├── database.py        # Database configuration
│   ├── config.py         # Configuration management
│   ├── crud.py          # Database operations
│   ├── ai_service.py    # AI integration services
│   ├── scraper.py        # Web scraping logic
│   ├── search.py         # Search functionality
│   └── routes/        # API route handlers
│       ├── opportunities.py
│       ├── applications.py
│       ├── profile.py
│       └── scraper.py
├── requirements.txt       # Python dependencies
└── .env              # Environment variables
```

### API Endpoints
- Opportunities: `/api/opportunities/`
- Applications: `/api/applications/`
- Profile: `/api/profile/`
- Scraper: `/api/scraper/`

### Database Models
1. **Opportunity** - Represents opportunities with fields for title, organization, description, funding, deadlines, etc.
2. **ScrapedSource** - Sources for web scraping
3. **Application** - User's applications to opportunities
4. **UserProfile** - User profile information for personalized matching

### Key Services
1. **AI Service** (`ai_service.py`)
   - Opportunity extraction from scraped content
   - Search query parsing
   - Local fallbacks for when AI is unavailable

2. **Web Scraping** (`scraper.py`)
   - Playwright for JavaScript-heavy sites
   - BeautifulSoup for HTML parsing
   - Smart fallbacks with mock data generation

3. **Search** (`search.py`)
   - Hybrid AI-powered search combining LLM intent extraction with database filtering

## Data Flow

1. **Scraping Pipeline**:
   - Sources are scraped using Playwright/BeautifulSoup
   - Content is processed by AI services for extraction
   - Data is stored in PostgreSQL database

2. **Opportunity Discovery**:
   - User searches are processed by AI for intent extraction
   - Dynamic SQL queries filter opportunities based on parsed intent
   - Results are scored using user profile data for personalized matching

3. **User Interaction**:
   - Users can track applications through Kanban board
   - Profile settings enable personalized recommendations
   - Scraper console provides real-time feedback on scraping operations

## Deployment Architecture

### Development
- Frontend: Vite development server
- Backend: Uvicorn ASGI server
- Database: PostgreSQL

### Infrastructure
- The system is designed for cloud deployment with separate scaling for frontend and backend
- PostgreSQL can be replaced with managed database services
- Environment variables for API keys and database connections

## Security Considerations
- API keys are managed through environment variables
- CORS is configured for development but should be restricted in production
- Database connections use environment-specific URLs

## Scalability
- Separation of concerns between frontend and backend allows independent scaling
- Database queries are optimized with indexing
- Caching can be implemented for AI responses and search results