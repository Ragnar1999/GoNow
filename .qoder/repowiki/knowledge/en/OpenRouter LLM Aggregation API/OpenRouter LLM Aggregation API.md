---
kind: external_dependency
name: OpenRouter LLM Aggregation API
slug: openrouter
category: external_dependency
category_hints:
    - vendor_identity
    - auth_protocol
scope:
    - '**'
source_files:
    - backend/app/services/chat_agent.py
    - backend/.env
    - docs/AGENT_DESIGN.md
---

### Identity & Role
- Single entry point for multiple LLM providers (Google Gemini, OpenAI GPT-4o, Anthropic Claude). The project uses it exclusively for agentic chat with native tool calling.

### Integration Point
- `backend/app/services/chat_agent.py` posts to `https://openrouter.ai/api/v1/chat/completions` using the OpenAI-compatible chat-completions shape (messages + tools).
- Auth via `OPENROUTER_API_KEY` env var injected into the `Authorization: Bearer <key>` header.
- Model selected at runtime via `CHAT_MODEL` env var (default `google/gemini-2.0-flash-001`).

### Framework Behavior
- Tool calling is handled natively by the model: the agent loop sends `tools` alongside messages, checks `tool_calls` in the response, executes them server-side, appends `tool` role messages, and repeats up to `CHAT_MAX_ITERATIONS` (default 3).
- If iterations exhaust, one final call is made without `tools` to force a text summary.

### Auth Protocol
- Bearer token through `OPENROUTER_API_KEY`; chat is disabled entirely when the key is absent (returns a configured fallback reply).

### Direction
- Swappable models via `CHAT_MODEL` without code changes; adding a new provider means only registering its OpenRouter model ID.