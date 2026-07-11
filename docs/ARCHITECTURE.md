# GoNow - Architecture

## Overview

GoNow is a full-stack web application for tracking European Go players' progress, managing favorites, and getting AI-powered insights through an agentic chat assistant.

```
┌─────────────┐     HTTP      ┌──────────────┐     GraphQL     ┌─────────────────┐
│   Frontend   │──────────────>│   Backend     │───────────────>│  EGD GraphQL API │
│  React+Vite  │<──────────────│  FastAPI      │<───────────────│  v2026.02        │
│  :5173       │              │  :8000        │               │  europeangodatabase.eu
└─────────────┘              └──────┬───────┘               └─────────────────┘
                                    │
                           POST /api/chat
                                    │
                                    v
                           ┌──────────────────┐
                           │   Chat Agent      │
                           │  (tool calling    │
                           │   loop)           │
                           └────────┬─────────┘
                                    │
                     ┌──────────────┼──────────────┐
                     v              v              v
              search_player  get_player_details  compare_players
                     │              │              │
                     └──────────────┼──────────────┘
                                    v
                           ┌──────────────────┐
                           │   OpenRouter API   │
                           │  (gemini-2.0-flash)│
                           └──────────────────┘
```

## Tech Stack

- **Backend:** Python 3.14, FastAPI, httpx (async HTTP client for EGD GraphQL calls)
- **Frontend:** React 19, TypeScript, Vite, React Router, Recharts, TanStack Query
- **AI:** OpenRouter API with native tool calling (agentic chat)
- **Data Source:** EGD GraphQL API v2026.02
- **Theme:** Custom CSS with Go-inspired design tokens (wood tones, stone badges)

## Project Structure

```
GoNow/
  backend/
    app/
      main.py              # FastAPI app entry, CORS, router mounting
      routers/
        players.py         # /api/search, /api/player/{pin}, etc.
        chat.py            # /api/chat (agentic chat route)
      services/
        egd_client.py      # EGD GraphQL API client (httpx-based, with caching)
        egd_tools.py       # EGD operations as OpenAI-compatible tool schemas
        chat_agent.py      # Agent loop: tool calling via OpenRouter
      models/
        player.py          # Pydantic response models
        chat.py            # Chat request/response models
    .venv/                 # Python virtual environment
    requirements.txt
    .env                   # API keys + model config (CHAT_MODEL, etc.)
  frontend/
    src/
      api/client.ts        # Axios API client + TypeScript types
      components/          # Navbar, ChatWidget (Go-themed)
      pages/               # SearchPage, ProfilePage, FavoritesPage
      hooks/               # useFavorites (localStorage persistence)
      index.css            # Go theme: CSS variables, stone styles, grid patterns
      App.tsx              # Root component with routing
      main.tsx             # Entry point
  scripts/
    explore_api.py         # API exploration script
    explore_player.py      # Player data exploration
  docs/
    EGD_API.md             # EGD API reference (from introspection)
    ARCHITECTURE.md        # This file
    AGENTS.md              # Agent/developer instructions
    AGENT_DESIGN.md        # Chat agent design & research
  Makefile                 # Dev orchestration (install/dev/stop/build)
```

## Data Flow

1. **Player Search:** Frontend → Backend `/api/search?q=...` → EGD `playersSearch` query → results
2. **Player Profile:** Frontend → Backend `/api/player/{pin}` → EGD `player(pin)` query with placements + biography → profile data with photo
3. **Rating Chart:** Backend extracts placement/rating data from EGD response → Frontend renders with Recharts
4. **Agentic Chat:** Frontend → Backend `/api/chat` → Chat Agent sends message + tool schemas to OpenRouter → LLM calls tools → Backend executes via `egd_client` → results fed back → LLM generates final answer

## Key Design Decisions

- **Backend proxies all EGD API calls** — keeps token server-side, avoids CORS issues
- **Favorites in localStorage** — no backend persistence needed for MVP
- **In-memory caching** in backend (5-min TTL) to reduce EGD API calls
- **Native tool calling** for chat — no orchestration framework needed, LLM decides when to call tools
- **No sandbox** — LLM only triggers predefined tool functions (trusted code), never executes arbitrary code
- **Configurable model** via `CHAT_MODEL` env var — default `google/gemini-2.0-flash-001`
- **Go-themed UI** — CSS custom properties for wood tones, stone gradients, grid patterns
