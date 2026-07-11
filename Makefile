.PHONY: help install install-be install-fe dev dev-be dev-fe build stop clean

# ─── Help ───────────────────────────────────────────
help:  ## Show this help
	@echo "GoNow - Make commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ─── Install ────────────────────────────────────────
install: install-be install-fe  ## Install all dependencies

install-be:  ## Install backend deps into venv
	@echo "==> Creating venv..."
	python -m venv backend/.venv
	@echo "==> Installing backend deps..."
	backend/.venv/Scripts/pip install -r backend/requirements.txt
	@echo "==> Done."

install-fe:  ## Install frontend deps
	cd frontend && npm install

# ─── Dev Servers ────────────────────────────────────
dev:  ## Start both backend + frontend (background)
	@echo "Starting backend on :8000 ..."
	@start "GoNow-BE" cmd /k "cd backend && .venv\\Scripts\\python -m uvicorn app.main:app --reload --port 8000"
	@timeout /t 2 /nobreak >nul
	@echo "Starting frontend on :5173 ..."
	@start "GoNow-FE" cmd /k "cd frontend && npm run dev"
	@echo ""
	@echo "Both servers running. Use 'make stop' to kill them."

dev-be:  ## Start backend only
	cd backend && .venv\\Scripts\\python -m uvicorn app.main:app --reload --port 8000

dev-fe:  ## Start frontend only
	cd frontend && npm run dev

# ─── Stop ───────────────────────────────────────────
stop:  ## Kill all GoNow dev servers
	@echo "Stopping GoNow servers..."
	-taskkill /FI "WINDOWTITLE eq GoNow-BE*" /T /F >nul 2>&1
	-taskkill /FI "WINDOWTITLE eq GoNow-FE*" /T /F >nul 2>&1
	@echo "Done."

# ─── Build ──────────────────────────────────────────
build:  ## Build frontend for production
	cd frontend && npm run build

# ─── Clean ──────────────────────────────────────────
clean:  ## Remove build artifacts + venv
	@echo "Cleaning..."
	-rm -rf frontend/dist frontend/node_modules backend/.venv
	@echo "Clean."
