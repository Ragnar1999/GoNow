.PHONY: help install install-be install-fe dev dev-be dev-fe build stop clean

PYTHON ?= python
NPM := $(if $(filter Windows_NT,$(OS)),npm.cmd,npm)
VENV_PYTHON_BE := $(if $(wildcard .venv/Scripts/python.exe),.venv/Scripts/python.exe,$(if $(wildcard .venv/bin/python),.venv/bin/python,$(if $(wildcard .venv/Scripts/python),.venv/Scripts/python,$(if $(wildcard .venv/bin/python3),.venv/bin/python3,python))))

# ─── Help ───────────────────────────────────────────
help:  ## Show this help
	@echo "GoNow - Make commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ─── Install ────────────────────────────────────────
install: install-be install-fe  ## Install all dependencies

install-be:  ## Install backend deps into venv
	@echo "==> Creating venv..."
	$(PYTHON) -m venv backend/.venv
	@echo "==> Installing backend deps..."
	cd backend && $(VENV_PYTHON_BE) -m pip install -r requirements.txt
	@echo "==> Done."

install-fe:  ## Install frontend deps
	cd frontend && $(NPM) install

# ─── Dev Servers ────────────────────────────────────
dev:  ## Start both backend + frontend (background)
	@echo "Starting backend on :8000 ..."
ifeq ($(OS),Windows_NT)
	@start "GoNow-BE" cmd /k "cd backend && $(VENV_PYTHON_BE) -m uvicorn app.main:app --reload --port 8000"
	@timeout /t 2 /nobreak >nul
	@echo "Starting frontend on :5173 ..."
	@start "GoNow-FE" cmd /k "cd frontend && $(NPM) run dev"
else
	@cd backend && $(VENV_PYTHON_BE) -m uvicorn app.main:app --reload --port 8000 > /tmp/gonow-backend.log 2>&1 &
	@sleep 2
	@cd frontend && $(NPM) run dev > /tmp/gonow-frontend.log 2>&1 &
endif
	@echo ""
	@echo "Both servers running. Use 'make stop' to kill them."

dev-be:  ## Start backend only
	cd backend && $(VENV_PYTHON_BE) -m uvicorn app.main:app --reload --port 8000

dev-fe:  ## Start frontend only
	cd frontend && $(NPM) run dev

# ─── Stop ───────────────────────────────────────────
stop:  ## Kill all GoNow dev servers
	@echo "Stopping GoNow servers..."
ifeq ($(OS),Windows_NT)
	-taskkill /FI "WINDOWTITLE eq GoNow-BE*" /T /F >nul 2>&1
	-taskkill /FI "WINDOWTITLE eq GoNow-FE*" /T /F >nul 2>&1
else
	-pkill -f "uvicorn app.main:app" || true
	-pkill -f "vite" || true
endif
	@echo "Done."

# ─── Build ──────────────────────────────────────────
build:  ## Build frontend for production
	cd frontend && $(NPM) run build

# ─── Clean ──────────────────────────────────────────
clean:  ## Remove build artifacts + venv
	@echo "Cleaning..."
	-rm -rf frontend/dist frontend/node_modules backend/.venv
	@echo "Clean."
