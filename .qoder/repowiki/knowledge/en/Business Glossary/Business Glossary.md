---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### EGD PIN
- Definition：The unique integer identifier assigned to each player in the European Go Database. Used as the primary key for lookups across all EGD GraphQL endpoints (player details, games, tournaments) and as the parameter for the `get_player_details`, `get_player_games`, and `compare_players` tools exposed by the chat agent.
- Aliases：PIN、player PIN

### GoR rating
- Definition：The Go (Weiqi/Baduk) rating maintained by the European Go Federation and stored in the EGD. Displayed on player profiles and used for the rating-evolution chart; distinct from dan/kyu grade which represents skill level rather than numerical strength.
- Aliases：rating、GoR

### dan/kyu grade
- Definition：The traditional Go ranking system shown on player profiles and search results. Kyu ranks (e.g., '5k') denote beginner-to-intermediate levels, while dan ranks (e.g., '3d', '11d') denote expert levels; displayed as stone badges in the Go-themed UI.
- Aliases：grade、rank

### favorites
- Definition：A user-curated list of saved players persisted in the browser's localStorage (not server-side). Managed via the `useFavorites` hook and rendered on the FavoritesPage; survives across sessions within the same browser.
- Aliases：saved players

### agentic chat
- Definition：The floating chat assistant that uses OpenRouter's native tool calling to autonomously decide when to query the EGD database. The agent loops Reason → Act (call tool) → Observe (read result) → Respond until it produces a final answer, capped at `CHAT_MAX_ITERATIONS` turns.
- Aliases：chat agent、agent chat
