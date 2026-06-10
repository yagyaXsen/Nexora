---
name: project-overview
description: High-level overview of the Nexora project
metadata:
  type: reference
---

# Project Overview

Nexora is an AI-powered opportunity discovery platform designed to help users find and track fellowships, scholarships, grants, and other educational/career opportunities. The platform combines web scraping, AI-powered matching, and an intuitive UI to surface personalized opportunities for users.

## Key Components

### 1. Frontend (React/Vite)
The frontend is a React application with a modern, responsive design that includes:
- Multiple design variants (Kombai system) for different user experiences
- Opportunity discovery and search functionality
- Application tracking dashboard
- User profile management
- Scraper console for monitoring

### 2. Backend (FastAPI)
The backend is built with FastAPI and includes:
- PostgreSQL database for data storage
- AI integration with Google Gemini and Groq
- Web scraping capabilities using Playwright and BeautifulSoup
- Comprehensive API for frontend communication

### 3. Database Schema
- Opportunities (fellowships, scholarships, grants, etc.)
- User profiles with preferences
- Application tracking
- Scraper sources

### 4. Key Features
- AI-powered opportunity matching
- Web scraping and data extraction
- Personalized recommendations
- Application tracking system
- Natural language search capabilities