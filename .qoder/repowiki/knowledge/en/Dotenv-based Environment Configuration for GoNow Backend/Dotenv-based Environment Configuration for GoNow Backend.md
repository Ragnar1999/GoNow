---
kind: configuration_system
name: Dotenv-based Environment Configuration for GoNow Backend
category: configuration_system
scope:
    - '**'
source_files:
    - backend/.env
    - backend/app/main.py
    - backend/app/services/egd_client.py
    - backend/app/services/chat_agent.py
---

GoNow uses a minimal, flat configuration system built around python-dotenv with environment variables. There is no centralized settings module or typed config loader — configuration is loaded once at application startup and consumed directly via os.environ.get() throughout the codebase.

How it works:
- backend/.env is the single source of truth for all runtime configuration (API keys, model selection, feature toggles).
- backend/app/main.py calls load_dotenv(Path(__file__).parent.parent / ".env") early in startup so that every subsequent os.environ.get(...) call picks up values from the file.
- Each service reads its own variables inline:
  - EGDClient.__init__ reads EGD_API_TOKEN to authenticate against the European Go Database GraphQL API.
  - chat_agent.py reads OPENROUTER_API_KEY, CHAT_MODEL, and CHAT_MAX_ITERATIONS to configure the OpenRouter-powered agentic chat loop.
  - Routers fall back to a friendly error message when OPENROUTER_API_KEY is missing.

Configured variables:
- EGD_API_TOKEN: Bearer token for EGD GraphQL API (required, no default)
- OPENROUTER_API_KEY: Key for OpenRouter LLM access (empty disables chat)
- CHAT_MODEL: OpenRouter model ID (default google/gemini-2.0-flash-001)
- CHAT_MAX_ITERATIONS: Max tool-calling iterations per turn (default 3)

Frontend configuration: The React/Vite frontend has no equivalent .env usage; Vite build-time env vars are not referenced in the scanned files, so the frontend appears to be configured entirely through Vite defaults and hard-coded URLs.

Conventions and constraints:
- All secrets live exclusively in backend/.env; this path is gitignored (*.env*, .env.local).
- No schema validation, type hints, or default-value documentation beyond inline comments in .env.
- Hardcoded fallbacks exist only for optional features (chat model, max iterations); critical dependencies like EGD_API_TOKEN have no default and will silently produce empty headers if absent.
- The pattern is intentionally simple: one file, one load call, direct os.environ.get reads — there is no layered config (dev/prod overrides), no secret manager integration, and no hot-reloading.