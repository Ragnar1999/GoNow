# GoNow - Agent Instructions

## Project Summary

GoNow is a Go player tracking web app. Python 3.14 FastAPI backend proxies the European Go Database GraphQL API. React + Vite + TypeScript frontend with player search, rating charts, favorites, and an AI chat assistant.

## Running the Project

### Quick Start (both together)
```bash
# From project root - starts BE + FE in separate windows
start.bat

# To stop both servers
stop.bat
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
- CSS Modules or inline styles (no Tailwind for now)
- API calls go through `src/api/` module

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app, CORS, router mounting |
| `backend/app/services/egd_client.py` | EGD GraphQL API wrapper |
| `backend/app/routers/players.py` | Player search/profile routes |
| `backend/app/routers/chat.py` | Agentic chat route (tool calling) |
| `backend/app/services/chat_agent.py` | Agent loop with OpenRouter tool calling |
| `backend/app/services/egd_tools.py` | EGD operations as tool schemas + executor |
| `frontend/src/App.tsx` | Root component, routing |
| `frontend/src/api/client.ts` | Axios instance + API functions |
| `frontend/src/pages/SearchPage.tsx` | Player search UI |
| `frontend/src/pages/ProfilePage.tsx` | Player profile + rating chart |
| `frontend/src/pages/FavoritesPage.tsx` | Favorites management |
| `frontend/src/components/ChatWidget.tsx` | Floating AI chat |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=<query>` | Search players by name or PIN |
| GET | `/api/player/<pin>` | Get player details + rating history |
| GET | `/api/player/<pin>/games` | Get player game history |
| GET | `/api/player/<pin>/tournaments` | Get tournament history |
| POST | `/api/chat` | AI chat (OpenRouter proxy) |

## External APIs

- **EGD API:** `https://europeangodatabase.eu/api/v2026.02/graphql` (Bearer token auth)
- **OpenRouter:** `https://openrouter.ai/api/v1/chat/completions` (key TBD)

## Important Notes

- EGD API token is stored in `backend/.env` as `EGD_API_TOKEN`
- OpenRouter key stored as `OPENROUTER_API_KEY` in `backend/.env`
- Favorites are persisted in browser localStorage only (no backend DB)
- The `scripts/` folder contains Python exploration scripts for API testing
