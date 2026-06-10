---
name: project-tech-stack
description: Technology stack used in the Nexora project
metadata:
  type: reference
---

# Technology Stack

## Frontend
- **Framework**: React with Vite
- **Styling**: CSS with custom properties
- **UI Components**: 
  - Lucide React icons
  - Custom components for opportunity cards, application tracking, profile management
- **State Management**: React built-in state management (useState, useEffect, etc.)
- **Build Tool**: Vite

## Backend
- **Framework**: FastAPI (Python)
- **API Documentation**: Automatically generated OpenAPI/Swagger documentation
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Database Driver**: psycopg2-binary
- **Validation**: Pydantic (data validation and settings management)

## AI and Data Processing
- **Google Generative AI**: Gemini API for content extraction and processing
- **Groq**: Alternative AI provider for inference
- **Web Scraping**: 
  - Playwright (headless browser automation)
  - BeautifulSoup4 (HTML parsing)
  - Custom scraping logic with fallback mechanisms

## Data and Storage
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Environment**: The system uses environment variables for configuration management

## Development Tools
- **Frontend Build**: Vite
- **Backend Server**: Uvicorn ASGI server
- **Package Management**: npm for frontend, pip for backend

## Key Libraries and Frameworks
1. **Frontend Dependencies**:
   - React
   - Lucide React (icons)
   - Vite (build tool)

2. **Backend Dependencies**:
   - FastAPI (web framework)
   - SQLAlchemy (ORM)
   - Pydantic (data validation)
   - psycopg2-binary (PostgreSQL driver)
   - google-generativeai (AI integration)
   - httpx (HTTP client)
   - beautifulsoup4 (HTML parsing)
   - playwright (web scraping)
   - groq (AI inference)

## External Services
- **AI Services**: 
  - Google Gemini API
  - Groq API
- **Database**: PostgreSQL

## Development and Deployment
- **Frontend**: Node.js environment with npm
- **Backend**: Python 3.8+
- **Containerization**: Docker (potential for containerized deployment)