---
kind: build_system
name: Local Dev Orchestration via Makefile (No CI/Containerization)
category: build_system
scope:
    - '**'
source_files:
    - Makefile
    - backend/requirements.txt
    - frontend/package.json
---

The GoNow monorepo uses a single top-level `Makefile` as the primary build and development orchestration surface. There is no Docker, docker-compose, GitHub Actions, GitLab CI, or any other CI/container pipeline present in the repository.

**Backend (FastAPI)**
- Dependencies declared in `backend/requirements.txt` (fastapi, uvicorn[standard], httpx, python-dotenv, pydantic).
- A local Python venv is created at `backend/.venv`; the Makefile installs deps into it via `pip install -r backend/requirements.txt`.
- The dev server runs through Uvicorn: `uvicorn app.main:app --reload --port 8000`, launched from the `dev-be` target.

**Frontend (React + Vite)**
- Managed by npm; scripts are defined in `frontend/package.json`: `dev` (`vite`), `build` (`tsc -b && vite build`), `lint` (`oxlint`), `preview` (`vite preview`).
- The Makefile's `install-fe` target runs `npm install` inside `frontend/`, and `build` delegates to `npm run build`.

**Orchestration targets**
- `make install` — creates the backend venv and installs both backend and frontend dependencies.
- `make dev` — starts both servers on Windows using `start "GoNow-BE" cmd /k ...` and `start "GoNow-FE" cmd /k ...`, then waits briefly before launching the frontend.
- `make dev-be` / `make dev-fe` — start individual services.
- `make stop` — kills the two named windows via `taskkill /FI "WINDOWTITLE eq GoNow-*" /T /F`.
- `make build` — builds the frontend for production (`frontend/dist`).
- `make clean` — removes `frontend/dist`, `frontend/node_modules`, and `backend/.venv`.

**Conventions & constraints**
- All cross-cutting commands live in the root `Makefile`; each subproject only defines its own language-specific tooling (Python venv + pip, npm + Vite).
- The dev workflow is Windows-only: `Scripts/pip`, `cmd /k`, and `taskkill` with window-title filters are used throughout. This makes the Makefile non-portable to POSIX shells.
- No container image, release tarball, or artifact upload is produced; `make build` only emits static assets under `frontend/dist`.
- No CI configuration exists, so there is no automated lint/test/build/deploy gate beyond what developers invoke manually.