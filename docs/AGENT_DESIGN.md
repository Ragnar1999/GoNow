# GoNow - Chat Agent Design & Research

This document captures the design decisions and research outcomes for the GoNow agentic chat system.

## 1. Architecture Overview

The chat system uses **OpenRouter's native tool calling** (function calling) to let the LLM autonomously decide when to query the European Go Database. No separate orchestration framework or sandbox is used.

### System Flow

```
User message
    │
    v
┌─────────────────────────────────────────────────────┐
│  Chat Agent (chat_agent.py)                          │
│                                                      │
│  1. Build messages: [system, ...history, user_msg]   │
│  2. Send to OpenRouter with EGD_TOOLS schemas        │
│  3. Check response:                                  │
│     - Has tool_calls? → Execute tools → Go to 2     │
│     - No tool_calls? → Return final answer           │
│  4. Max iterations: CHAT_MAX_ITERATIONS (default 3)  │
└─────────────────────────────────────────────────────┘
    │                    │
    v                    v
┌──────────┐     ┌──────────────┐
│ OpenRouter│     │ egd_tools.py │
│ (LLM API) │     │ (execute_tool│
│            │     │  dispatcher) │
└──────────┘     └──────┬───────┘
                         │
                         v
                  ┌──────────────┐
                  │ egd_client.py │
                  │ (EGD GraphQL) │
                  └──────────────┘
```

### Tool Definitions

Five tools are defined in `egd_tools.py`:

| Tool | Parameters | Description |
|------|-----------|-------------|
| `search_player` | `query: string` | Search by name or PIN |
| `get_player_details` | `pin: int` | Full profile with rating history |
| `get_player_rating_history` | `pin: int` | Rating evolution over time |
| `get_player_games` | `pin: int, limit?: int` | Recent game history |
| `compare_players` | `pin1: int, pin2: int` | Side-by-side comparison |

Each tool is defined as an OpenAI-compatible function schema and executed server-side through `execute_tool()`.

### Example Interaction

```
User: "Search for player Zhan Shi and tell me about his rating"

→ LLM calls: search_player(query="Zhan Shi")
→ Backend returns: [{pin: 12345, name: "Zhan Shi", grade: "3d", rating: 2245, ...}]

→ LLM calls: get_player_details(pin=12345)
→ Backend returns: {name: "Zhan Shi", grade: "3d", rating: 2245, rating_history: [...], ...}

→ LLM generates final answer:
  "Zhan Shi is a 3-dan player from China with a current GoR rating of 2245.
   His rating has been trending upward over the last 5 tournaments..."
```

## 2. Orchestration Research

### Approaches Evaluated

#### A. Native Tool Calling (Chosen)

**How it works:** The LLM receives tool schemas alongside the conversation. It decides autonomously when to invoke a tool, what arguments to pass, and when it has enough information to answer.

**Pros:**
- Zero extra dependencies
- Built into the model (Gemini, GPT-4o, Claude all support it)
- LLM handles the "when to call" decision natively
- Simple implementation: just a loop checking for tool_calls
- Fast — no orchestration overhead

**Cons:**
- Limited to sequential tool calls (one at a time per iteration)
- No parallel tool execution within a single turn
- Max iterations cap needed to prevent infinite loops

**Implementation:** `chat_agent.py` — ~150 lines of code.

#### B. DeepAgent / LangGraph (Rejected)

**How it works:** State-machine orchestration where nodes represent steps and edges represent transitions. Supports branching, parallel execution, human-in-the-loop.

**Pros:**
- Complex multi-step workflows with branching
- Parallel tool execution
- Human-in-the-loop checkpoints
- Built-in retry/fallback logic

**Cons:**
- Heavy dependency (LangGraph: ~50+ packages)
- Overkill for our use case (single API, sequential lookups)
- Adds abstraction layer that makes debugging harder
- State machine design is unnecessary when the LLM already handles flow

**Verdict:** Rejected. Our agent only calls one external API (EGD). The LLM's native tool calling handles the flow perfectly. LangGraph would be appropriate if we needed:
- Multiple independent data sources queried in parallel
- Human approval steps
- Complex retry/fallback logic across services

#### C. ReAct Pattern (Implicitly Used)

**How it works:** Reason → Act → Observe loop. The LLM reasons about what to do, takes an action (tool call), observes the result, and repeats until done.

**Our implementation:** This is exactly what `chat_agent.py` does:
1. **Reason:** LLM decides to call a tool (or answer directly)
2. **Act:** Backend executes the tool
3. **Observe:** Result fed back as `tool` message
4. **Repeat:** Until LLM produces final text answer

**Verdict:** Already implemented. No library needed — the tool calling loop IS ReAct.

### Orchestration Decision Matrix

| Criterion | Native Tool Calling | LangGraph | ReAct Library |
|-----------|:------------------:|:---------:|:-------------:|
| Dependencies | 0 | 50+ | 10+ |
| Code complexity | Low (~150 LOC) | Medium | Medium |
| Single API calls | Excellent | Overkill | Good |
| Multi-API parallel | Limited | Excellent | Limited |
| Debugging | Easy | Hard (state graph) | Medium |
| Model support | All major models | All major models | All major models |

## 3. Sandbox Research

### Why No Sandbox?

Our LLM never executes arbitrary code. It only triggers **predefined tool functions** that we control:
- `search_player()` → calls EGD API (read-only GraphQL)
- `get_player_details()` → calls EGD API (read-only GraphQL)
- etc.

All tool functions are trusted Python code that we wrote. There is no user-provided code execution, so no sandbox is needed.

### Sandbox Options (For Future Reference)

If the project evolves to let users write custom analysis code (e.g., "plot my rating against player X"), here are the options:

#### A. Pyodide (WebAssembly) — ~10MB

**What:** Full Python runtime compiled to WebAssembly, runs in the browser.

**Pros:**
- No server needed — runs entirely client-side
- ~10MB download (cached after first load)
- Full Python stdlib available
- Can use numpy, pandas, matplotlib

**Cons:**
- Limited to browser environment (no network calls without proxy)
- Slower than native Python (~2-5x)
- Can't use C extensions that aren't pre-compiled for WASM

**Use case:** User writes analysis code in chat → runs in their browser → results displayed.

#### B. langchain-sandbox — ~2MB

**What:** LangChain wrapper around Pyodide. Provides a sandboxed Python environment with controlled package access.

**Pros:**
- Lightest server-side option (~2MB)
- WASM-based, no Docker
- Built-in package allowlisting
- LangChain ecosystem integration

**Cons:**
- Still WASM performance limitations
- Requires LangChain dependency
- Limited to pure Python (no C extensions)

**Use case:** Server-side code execution with isolation. Lighter than Docker.

#### C. E2B — Cloud

**What:** Hosted sandbox service. Spin up isolated VMs/microVMs on demand.

**Pros:**
- Fast spin-up (~150ms)
- Full Linux environment
- Network access
- Managed infrastructure

**Cons:**
- Cloud-only (no local option)
- Per-execution cost
- External dependency

**Use case:** Production-grade code execution at scale.

#### D. Docker — ~100MB+

**What:** Full container isolation. Run user code in a disposable container.

**Pros:**
- Complete isolation
- Full OS + network control
- Can install any package
- Well-understood technology

**Cons:**
- Heavy (~100MB+ image)
- Needs Docker daemon
- Slow cold start (1-5s)
- Overkill for simple analysis

**Use case:** When you need full OS isolation and already run Docker.

### Sandbox Recommendation

For GoNow's potential future needs:

1. **Current (no sandbox):** LLM calls predefined tools → trusted code → EGD API. This is sufficient and secure.

2. **If users need custom analysis:** Use **Pyodide via langchain-sandbox** (~2MB server-side or ~10MB client-side). It's the lightest option and avoids Docker entirely.

3. **If production scale needed:** Use **E2B** for managed cloud sandboxes, or Docker if you already run containers.

## 4. Model Configuration

The chat model is configurable via `backend/.env`:

```env
CHAT_MODEL=google/gemini-2.0-flash-001
CHAT_MAX_ITERATIONS=3
```

### Model Comparison

| Model | Tool Calling | Speed | Cost | Quality |
|-------|:-----------:|:-----:|:----:|:-------:|
| `google/gemini-2.0-flash-001` | Yes | Fast | Very cheap | Good |
| `openai/gpt-4o-mini` | Yes | Fast | Cheap | Good |
| `openai/gpt-4o` | Yes | Medium | Moderate | Excellent |
| `anthropic/claude-3.5-sonnet` | Yes | Medium | Moderate | Excellent |

**Default:** `google/gemini-2.0-flash-001` — best speed/cost ratio with tool calling support.

## 5. Files & Implementation

| File | Lines | Purpose |
|------|-------|---------|
| `backend/app/services/egd_tools.py` | ~210 | Tool schemas + `execute_tool()` dispatcher |
| `backend/app/services/chat_agent.py` | ~155 | Agent loop (tool calling via OpenRouter) |
| `backend/app/routers/chat.py` | ~25 | FastAPI route (delegates to agent) |
| `backend/app/models/chat.py` | ~20 | Pydantic models (ChatRequest, ChatResponse) |
| `frontend/src/components/ChatWidget.tsx` | ~240 | Chat UI with tool call indicators |
