---
kind: dependency_management
name: Python and Node.js dependency manifests with per-project virtual environments
category: dependency_management
scope:
    - '**'
source_files:
    - backend/requirements.txt
    - backend/.venv/pyvenv.cfg
    - frontend/package.json
    - frontend/package-lock.json
---

This monorepo manages dependencies for two independent subprojects — a FastAPI backend and a React/Vite frontend — using each language's native package manager. There is no shared lockfile or vendoring strategy across the repo.

**Backend (Python / FastAPI)**
- Dependencies are declared in `backend/requirements.txt` using pip-style version specifiers with minimum versions (`>=`). The file lists six runtime packages: fastapi, uvicorn[standard], httpx, python-dotenv, pydantic.
- A local Python virtual environment lives at `backend/.venv`, created against CPython 3.14.6 with `include-system-site-packages = false`. No `pyproject.toml`, `Pipfile`, or `poetry.lock` is present; `pip install -r requirements.txt` is the installation surface.
- No private PyPI index, `--index-url`, `PIP_INDEX_URL`, or `GOPRIVATE`-style configuration was found anywhere in the repository, so all packages resolve from the public PyPI registry.
- No vendored third-party code exists under `backend/`; only application source under `app/`.

**Frontend (Node.js / Vite + TypeScript)**
- Dependencies are declared in `frontend/package.json` split into `dependencies` (react, react-dom, react-router-dom, axios, @tanstack/react-query, recharts) and `devDependencies` (typescript, vite, @vitejs/plugin-react, oxlint, type definitions).
- A `frontend/package-lock.json` is committed to the repository, pinning exact transitive resolutions for reproducible installs via npm.
- Build scripts expose `dev`, `build`, `lint`, and `preview` commands; there is no custom postinstall hook that would vendor or prebuild assets.
- No `.npmrc` or private registry configuration is present, so packages resolve from the default npm registry.

**Conventions and constraints**
- Each subproject owns its own manifest; there is no top-level `package.json` or `go.mod` tying them together.
- Backend uses open-ended minimum-version pins (`>=`) rather than a lockfile, which means builds can drift unless developers also commit their generated `requirements.txt` after pinning.
- Frontend enforces deterministic installs by committing `package-lock.json`.
- No vendoring, no private registries, and no dependency-update automation (e.g., Dependabot, Renovate) were detected.