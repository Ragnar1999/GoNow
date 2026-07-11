# GoNow

A full-stack web application for tracking European Go players' progress over time. Search players from the European Go Database (EGD), manage favorites, visualize grade and rating evolution, and get AI-powered insights through an integrated chat assistant.

## Features

- **Player Search** — Search European Go players by name or EGD PIN
- **Player Profiles** — View detailed player information including grade and rating history
- **Rating Evolution Charts** — Visualize how a player's rank changes over time with interactive Recharts graphs
- **Favorites** — Save and manage your favorite players (stored locally in the browser)
- **AI Chat Assistant** — Floating chat widget powered by OpenRouter for Go-related questions and insights

## Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Frontend    | React 19, TypeScript, Vite, React Router, Recharts, TanStack Query |
| Backend     | Python 3.14, FastAPI, httpx, Pydantic            |
| Data Source | [EGD GraphQL API](https://europeangodatabase.eu) v2026.02 |
| AI          | OpenRouter API (chat completions)                |

## Architecture

```
┌─────────────┐     HTTP      ┌──────────────┐     GraphQL     ┌─────────────────┐
│   Frontend   │──────────────>│   Backend     │───────────────>│  EGD GraphQL API │
│  React+Vite  │<──────────────│  FastAPI      │<───────────────│  europeangodatabase.eu
│  :5173       │              │  :8000        │               └─────────────────┘
└─────────────┘              └──────────────┘
                                      │
                                      │  POST /api/chat
                                      v
                               ┌──────────────┐
                               │  OpenRouter   │
                               └──────────────┘
```

The backend proxies all EGD API calls to keep the API token server-side and avoid CORS issues. Favorites are stored in `localStorage` — no backend persistence is needed for the MVP.

## Project Structure

```
GoNow/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry, CORS, router mounting
│   │   ├── routers/
│   │   │   ├── players.py       # /api/search, /api/player/{pin}
│   │   │   └── chat.py          # /api/chat (OpenRouter proxy)
│   │   ├── services/
│   │   │   └── egd_client.py    # EGD GraphQL API client
│   │   └── models/
│   │       ├── player.py        # Pydantic response models
│   │       └── chat.py          # Chat request/response models
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios API client
│   │   ├── components/          # Reusable UI components (Navbar, ChatWidget)
│   │   ├── pages/               # SearchPage, ProfilePage, FavoritesPage
│   │   ├── hooks/               # Custom hooks (useFavorites)
│   │   └── App.tsx              # Root component with routing
│   └── package.json
├── scripts/                     # API exploration utilities
└── docs/                        # Architecture and API docs
```

## Getting Started

### Prerequisites

- **Python 3.14+**
- **Node.js 18+** and npm
- An EGD API token (set in `backend/.env`)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Create a .env file with your EGD API token
# EGD_TOKEN=your_token_here

uvicorn app.main:app --reload
```

The backend will be available at [http://localhost:8000](http://localhost:8000). API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).

## Available Scripts

| Command                | Description                        |
|------------------------|------------------------------------|
| `cd backend && uvicorn app.main:app --reload` | Start backend dev server |
| `cd frontend && npm run dev`    | Start frontend dev server  |
| `cd frontend && npm run build`  | Build for production       |
| `cd frontend && npm run lint`   | Run OxLint linter          |

## Environment Variables

| Variable    | Location         | Description                  |
|-------------|------------------|------------------------------|
| `EGD_TOKEN` | `backend/.env`   | EGD GraphQL API bearer token |
