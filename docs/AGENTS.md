# GoNow - Agent Instructions

## Project Summary

GoNow is a Go player tracking web app. Python 3.14 FastAPI backend proxies the European Go Database GraphQL API. React + Vite + TypeScript frontend with player search, rating charts, favorites, and an agentic AI chat assistant that uses OpenRouter tool calling to look up real player data.

## Running the Project

### Quick Start (Makefile)
```bash
make install     # First time: create venv + install all deps
make dev         # Start both BE (:8000) and FE (:5173)
make stop        # Kill both servers
make help        # See all commands
```

### Backend (manual)
```bash
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### Frontend (manual)
```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:8000`.

### Configuration
Backend config is in `backend/.env`:
- `EGD_API_TOKEN` - EGD API bearer token
- `OPENROUTER_API_KEY` - OpenRouter API key for chat
- `CHAT_MODEL` - OpenRouter model ID (default: `google/gemini-2.0-flash-001`)
- `CHAT_MAX_ITERATIONS` - Max tool-calling iterations (default: 3)

## Code Conventions

### Backend (Python)
- Use `async/await` for all I/O operations
- Pydantic models for request/response validation
- httpx async client for EGD API calls
- Environment variables via python-dotenv (`.env` file)
- Type hints everywhere

### Frontend (TypeScript/React)
- Functional components with hooks only
- TanStack Query (`@tanstack/react-query`) for data fetching
- React Router v6 for routing
- Recharts for charts
- Go-themed CSS via custom properties (see `index.css`)
- API calls go through `src/api/client.ts`

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app, CORS, router mounting |
| `backend/app/services/egd_client.py` | EGD GraphQL API wrapper with caching |
| `backend/app/services/egd_tools.py` | EGD operations as OpenAI tool schemas + executor |
| `backend/app/services/chat_agent.py` | Agent loop with OpenRouter tool calling |
| `backend/app/routers/players.py` | Player search/profile routes |
| `backend/app/routers/chat.py` | Agentic chat route (delegates to chat_agent) |
| `frontend/src/App.tsx` | Root component, routing |
| `frontend/src/api/client.ts` | Axios instance + API functions + TypeScript types |
| `frontend/src/pages/SearchPage.tsx` | Player search UI (Go-themed) |
| `frontend/src/pages/ProfilePage.tsx` | Player profile + rating chart + photo |
| `frontend/src/pages/FavoritesPage.tsx` | Favorites management |
| `frontend/src/components/ChatWidget.tsx` | Floating AI chat with tool indicators |
| `frontend/src/index.css` | Go theme: CSS variables, stone styles, grid patterns |
| `docs/AGENT_DESIGN.md` | Chat agent design decisions & research |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=<query>` | Search players by name or PIN |
| GET | `/api/player/<pin>` | Get player details + rating history |
| GET | `/api/player/<pin>/games` | Get player game history |
| GET | `/api/player/<pin>/tournaments` | Get tournament history |
| POST | `/api/chat` | Agentic AI chat (tool calling) |

## External APIs

- **EGD API:** `https://europeangodatabase.eu/api/v2026.02/graphql` (Bearer token auth)
- **OpenRouter:** `https://openrouter.ai/api/v1/chat/completions` (tool calling)

## Important Notes

- EGD API token is stored in `backend/.env` as `EGD_API_TOKEN`
- OpenRouter key stored as `OPENROUTER_API_KEY` in `backend/.env`
- Chat model is configurable via `CHAT_MODEL` env var
- Favorites are persisted in browser localStorage only (no backend DB)
- The `scripts/` folder contains Python exploration scripts for API testing
- See `docs/AGENT_DESIGN.md` for chat agent architecture decisions
