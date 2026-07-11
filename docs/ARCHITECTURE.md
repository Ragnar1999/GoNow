# GoNow - Architecture

## Overview

GoNow is a full-stack web application for tracking European Go players' progress, managing favorites, and getting AI-powered insights.

```
┌─────────────┐     HTTP      ┌──────────────┐     GraphQL     ┌─────────────────┐
│   Frontend   │──────────────>│   Backend     │───────────────>│  EGD GraphQL API │
│  React+Vite  │<──────────────│  FastAPI      │<───────────────│  v2026.02        │
│  :5173       │              │  :8000        │               │  europeangodatabase.eu
└─────────────┘              └──────────────┘               └─────────────────┘
                                      │
                                      │  POST /api/chat
                                      v
                               ┌──────────────┐
                               │  OpenRouter   │
                               │  AI API       │
                               └──────────────┘
```

## Tech Stack

- **Backend:** Python 3.14, FastAPI, httpx (async HTTP client for EGD GraphQL calls)
- **Frontend:** React 19, TypeScript, Vite, React Router, Recharts, TanStack Query
- **AI:** OpenRouter API (chat completions endpoint)
- **Data Source:** EGD GraphQL API v2026.02

## Project Structure

```
GoNow/
  backend/
    app/
      main.py              # FastAPI app entry, CORS, router mounting
      routers/
        players.py         # /api/search, /api/player/{pin}, etc.
        chat.py            # /api/chat (OpenRouter proxy)
      services/
        egd_client.py      # EGD GraphQL API client (httpx-based)
        chat_service.py    # OpenRouter chat proxy
      models/
        player.py          # Pydantic response models
        chat.py            # Chat request/response models
    requirements.txt
    .env
  frontend/
    src/
      api/                 # API client functions (axios)
      components/          # Reusable UI components
      pages/               # Route pages (Search, Profile, Favorites)
      hooks/               # Custom React hooks
      App.tsx              # Root component with routing
      main.tsx             # Entry point
  scripts/
    explore_api.py         # API exploration script
    explore_player.py      # Player data exploration
  docs/
    EGD_API.md             # EGD API reference
    ARCHITECTURE.md        # This file
    AGENTS.md              # Agent instructions
```

## Data Flow

1. **Player Search:** Frontend -> Backend `/api/search?q=...` -> EGD `playersSearch` query -> results
2. **Player Profile:** Frontend -> Backend `/api/player/{pin}` -> EGD `player(pin)` query with placements -> profile data
3. **Rating Chart:** Backend extracts placement/rating data from EGD response -> Frontend renders with Recharts
4. **AI Chat:** Frontend -> Backend `/api/chat` -> OpenRouter API -> streaming response

## Key Design Decisions

- Backend proxies all EGD API calls (keeps token server-side, avoids CORS issues)
- Favorites stored in localStorage (no backend persistence needed for MVP)
- In-memory caching in backend to reduce EGD API calls
- OpenRouter chat is sketched - key to be provided later
