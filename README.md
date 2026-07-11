# GoNow

A full-stack web application for tracking European Go players' progress over time. Search players from the European Go Database (EGD), manage favorites, visualize grade and rating evolution, and get AI-powered insights through an agentic chat assistant that can look up real player data on the fly.

## Features

- **Player Search** — Search European Go players by name or EGD PIN (typo-tolerant)
- **Player Profiles** — Detailed player info with photo, grade, rating, and tournament history
- **Rating Evolution Charts** — Interactive Recharts graphs showing rating over time
- **Favorites** — Save and manage favorite players (stored locally in browser)
- **Agentic AI Chat** — Floating chat assistant that calls EGD tools autonomously to look up players, compare stats, and answer Go questions with real data
- **Go/围棋 Themed UI** — Warm wood tones, stone badges for dan/kyu grades, Go board grid textures

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Frontend    | React 19, TypeScript, Vite, React Router, Recharts, TanStack Query |
| Backend     | Python 3.14, FastAPI, httpx, Pydantic            |
| Data Source | [EGD GraphQL API](https://europeangodatabase.eu) v2026.02 |
| AI          | OpenRouter API with **tool calling** (agentic)   |
| Theme       | Custom CSS with Go-inspired design tokens        |

## Architecture

```
┌─────────────┐     HTTP      ┌──────────────┐     GraphQL     ┌─────────────────┐
│   Frontend   │──────────────>│   Backend     │───────────────>│  EGD GraphQL API │
│  React+Vite  │<──────────────│  FastAPI      │<───────────────│  europeangodatabase.eu
│  :5173       │              │  :8000        │               └─────────────────┘
└─────────────┘              └──────┬───────┘
                                    │
                           POST /api/chat
                                    │
                                    v
                           ┌──────────────────┐
                           │   Chat Agent      │
                           │  (tool calling    │
                           │   loop, max 3     │
                           │   iterations)     │
                           └────────┬─────────┘
                                    │
                     ┌──────────────┼──────────────┐
                     v              v              v
              search_player  get_player_details  compare_players ...
                     │              │              │
                     └──────────────┼──────────────┘
                                    v
                           ┌──────────────────┐
                           │   OpenRouter API   │
                           │  (gemini-2.0-flash)│
                           └──────────────────┘
```

The backend proxies all EGD API calls to keep the API token server-side. The chat agent uses OpenRouter's native **tool calling** — the LLM decides when to call EGD tools, we execute them server-side, and feed results back until the LLM produces a final answer.

## Project Structure

```
GoNow/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry, CORS, router mounting
│   │   ├── routers/
│   │   │   ├── players.py       # /api/search, /api/player/{pin}
│   │   │   └── chat.py          # /api/chat (agentic chat route)
│   │   ├── services/
│   │   │   ├── egd_client.py    # EGD GraphQL API client with caching
│   │   │   ├── egd_tools.py     # EGD operations as OpenAI tool schemas
│   │   │   └── chat_agent.py    # Agent loop (tool calling via OpenRouter)
│   │   └── models/
│   │       ├── player.py        # Pydantic response models
│   │       └── chat.py          # Chat request/response models
│   ├── .venv/                   # Python virtual environment
│   ├── requirements.txt
│   └── .env                     # API keys + model config
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # Axios API client + TypeScript types
│   │   ├── components/          # Navbar, ChatWidget (Go-themed)
│   │   ├── pages/               # SearchPage, ProfilePage, FavoritesPage
│   │   ├── hooks/               # useFavorites (localStorage)
│   │   ├── index.css            # Go theme: CSS variables, stone styles
│   │   └── App.tsx              # Root component with routing
│   └── package.json
├── scripts/                     # API exploration utilities
├── docs/                        # Architecture, API docs, agent design
├── Makefile                     # Dev orchestration
└── .gitignore
```

## Getting Started

### Prerequisites

- **Python 3.14+**
- **Node.js 18+** and npm
- **GNU Make** (comes with Git Bash on Windows)
- An EGD API token (set in `backend/.env`)

### Quick Start (Makefile)

```bash
make install     # Create venv + install all deps (BE & FE)
make dev         # Start both backend (:8000) and frontend (:5173)
make stop        # Kill both servers
```

### All Make Commands

| Command          | Description                                     |
|------------------|-------------------------------------------------|
| `make help`      | Show all available commands                     |
| `make install`   | Install backend (venv) + frontend (npm) deps    |
| `make install-be`| Create venv and install backend dependencies    |
| `make install-fe`| Install frontend npm dependencies               |
| `make dev`       | Start both BE + FE in separate windows          |
| `make dev-be`    | Start backend only (foreground)                 |
| `make dev-fe`    | Start frontend only (foreground)                |
| `make stop`      | Kill all GoNow dev servers                      |
| `make build`     | Build frontend for production                   |
| `make clean`     | Remove venv, node_modules, dist                 |

### Manual Setup (without Make)

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Environment Variables

All config lives in `backend/.env`:

| Variable              | Description                                      | Default                        |
|-----------------------|--------------------------------------------------|--------------------------------|
| `EGD_API_TOKEN`       | EGD GraphQL API bearer token                     | *(required)*                   |
| `OPENROUTER_API_KEY`  | OpenRouter API key for AI chat                   | *(optional, chat disabled if empty)* |
| `CHAT_MODEL`          | OpenRouter model ID for chat                     | `google/gemini-2.0-flash-001`  |
| `CHAT_MAX_ITERATIONS` | Max tool-calling iterations per chat turn        | `3`                            |

**Model options** (set via `CHAT_MODEL`):
- `google/gemini-2.0-flash-001` — Fast, cheap, supports tool calling (default)
- `openai/gpt-4o-mini` — Good balance of speed and quality
- `anthropic/claude-3.5-sonnet` — Higher quality, slower/more expensive

## Agentic Chat: Orchestration & Sandbox Research

See [docs/AGENT_DESIGN.md](docs/AGENT_DESIGN.md) for the full research document.

### How It Works

The chat uses OpenRouter's native **tool calling** (function calling). No separate orchestration framework is needed.

**Flow:**
1. User sends a message → Backend sends it to OpenRouter with EGD tool schemas defined
2. LLM decides to call a tool (e.g., `search_player("Zhan Shi")`)
3. Backend executes the tool via `egd_client.py` (trusted code, calls EGD API)
4. Result is fed back to the LLM as a `tool` role message
5. LLM either calls more tools or produces a final text answer
6. Loop repeats up to `CHAT_MAX_ITERATIONS` (default 3)

### Orchestration Alternatives Considered

| Approach | Verdict |
|----------|---------|
| **Native tool calling** (what we use) | Best fit. Built into the model, no extra framework. LLM handles "when to call" natively. |
| **DeepAgent / LangGraph** | Overkill. State-machine orchestration is for multi-step branching workflows with human-in-the-loop. We only call one external API. |
| **ReAct pattern** | Already implemented implicitly — our agent loop is Reason → Act → Observe → Respond. No library needed. |

### Sandbox Research

We don't use a sandbox because the LLM never executes arbitrary code — it only triggers our predefined tool functions which call the EGD API (trusted, read-only).

If you later want users to write custom analysis code, here are the options ranked by weight:

| Option | Size | Notes |
|--------|------|-------|
| **Pyodide** (WebAssembly) | ~10MB | Runs Python in the browser. No server needed. Best for user-facing code execution. |
| **langchain-sandbox** | ~2MB | LangChain wrapper around Pyodide. WASM-based, no Docker. Lightest server-side option. |
| **E2B** | Cloud | Hosted sandboxes. Fast spin-up (~150ms). Costs per execution. |
| **Docker** | ~100MB+ | Full isolation. Heavy, needs Docker daemon. Overkill for API proxying. |

**Recommendation:** For custom user code execution, **Pyodide via langchain-sandbox** is the lightest local option — runs in WebAssembly, no Docker required.

## Available API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=<query>` | Search players by name or PIN |
| GET | `/api/player/<pin>` | Get player details + rating history |
| GET | `/api/player/<pin>/games` | Get player game history |
| GET | `/api/player/<pin>/tournaments` | Get tournament history |
| POST | `/api/chat` | Agentic AI chat (tool calling) |
