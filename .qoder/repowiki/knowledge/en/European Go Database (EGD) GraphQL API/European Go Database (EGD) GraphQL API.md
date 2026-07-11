---
kind: external_dependency
name: European Go Database (EGD) GraphQL API
slug: european-go-database
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
source_files:
    - backend/app/services/egd_client.py
    - backend/app/services/egd_tools.py
    - docs/EGD_API.md
    - backend/.env
---

### Identity & Role
- Official data source for European Go player statistics, ratings, tournaments, and game records.
- Backend proxies all EGD calls to keep the bearer token server-side; frontend never contacts EGD directly.

### Integration Point
- `backend/app/services/egd_client.py` — HTTP client against `https://europeangodatabase.eu/api/v2026.02/graphql` with Bearer-token auth (`EGD_API_TOKEN` in `backend/.env`).
- Exposed as OpenAI-compatible tool schemas (`search_player`, `get_player_details`, `get_player_rating_history`, `get_player_games`, `compare_players`) consumed by the chat agent.

### Stable Usage Model
- All queries are read-only GraphQL POSTs; pagination uses `{ page, limit }` and responses carry `total / currentPage / hasMorePages`.
- Player detail, games, and tournament endpoints are accessed by the player's unique integer PIN.

### Client Constraint
- Requires an EGD developer token created from the EGD admin panel (scope `read`, name `dev`); without it the backend returns empty results.
- Versioned endpoint (`v2026.02`) — schema changes require updating `docs/EGD_API.md` and the tool schemas in `egd_tools.py`.