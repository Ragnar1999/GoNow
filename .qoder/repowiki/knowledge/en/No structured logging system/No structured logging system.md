---
kind: logging_system
name: No structured logging system
category: logging_system
scope:
    - '**'
source_files:
    - backend/app/main.py
---

This repository does not implement a logging system. The FastAPI backend (backend/app) contains no logging framework imports (no `logging`, `structlog`, `loguru`, `sentry-sdk`, etc.) and no logger initialization in the application entry point (`main.py`). All request handling code uses bare `try/except` blocks that raise `HTTPException` on errors without emitting any log output. Development scripts under `scripts/` use plain `print()` statements for console output, which is appropriate for ad-hoc exploration but not for production logging. There are no log levels, structured fields, sinks, or centralized configuration anywhere in the codebase.