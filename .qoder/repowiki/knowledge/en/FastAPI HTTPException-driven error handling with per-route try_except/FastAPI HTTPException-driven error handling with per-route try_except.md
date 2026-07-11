---
kind: error_handling
name: FastAPI HTTPException-driven error handling with per-route try/except
category: error_handling
scope:
    - '**'
source_files:
    - backend/app/main.py
    - backend/app/routers/players.py
    - backend/app/routers/chat.py
    - backend/app/services/egd_client.py
    - backend/app/services/egd_tools.py
    - backend/app/services/chat_agent.py
    - frontend/src/api/client.ts
---

The GoNow backend uses a straightforward, per-route error-handling pattern built on FastAPI's `HTTPException`. There is no centralized exception handler, custom error type hierarchy, or middleware-based error transformer — each route wraps its body in a `try/except Exception` block and re-raises as an `HTTPException(status_code=500, detail=str(e))`, while business-level not-found cases raise `HTTPException(status_code=404, ...)` directly. The chat router additionally returns a graceful fallback response when the OpenRouter API key is missing instead of raising.

**Backend layers**
- **Routers (`app/routers/*.py`)**: Every endpoint follows the same shape — call a service function inside `try`, catch `HTTPException` (re-raise), catch bare `Exception` and convert to 500. The `/player/{pin}` route explicitly re-raises `HTTPException` so 404s bubble through unchanged.
- **Services (`app/services/egd_client.py`)**: The EGD GraphQL client raises domain errors as plain Python exceptions — `ValueError` for GraphQL-level `errors` payloads and `httpx.HTTPError` for transport failures. These are caught by callers and surfaced as 500 responses.
- **Agent tool executor (`app/services/egd_tools.py`)**: Tool execution swallows all exceptions via a top-level `except Exception` and returns a structured `{success: False, error: str(e)}` dict so the LLM loop can continue rather than crashing the request.
- **Chat agent (`app/services/chat_agent.py`)**: Missing `OPENROUTER_API_KEY` is treated as a configuration state and returns a friendly reply string; network/tool-call failures propagate up to the router where they become 500s.
- **Frontend (`frontend/src/api/client.ts`)**: Axios calls return raw responses with no global error interceptor; callers must handle non-2xx status codes themselves.

**Conventions observed**
- No sentinel/custom error classes exist; all errors are plain `Exception` / `ValueError` / `httpx.HTTPError`.
- No `@app.exception_handler` overrides or custom middleware transform responses into a unified envelope.
- Client-side code does not normalize error shapes; it assumes success responses match the TypeScript interfaces defined in `client.ts`.
- The only structured error contract is the tool-executor return value `{success, data|error}`, used exclusively within the agentic loop.