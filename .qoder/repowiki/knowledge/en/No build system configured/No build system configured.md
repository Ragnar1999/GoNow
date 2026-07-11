---
kind: build_system
name: No build system configured
category: build_system
scope:
    - '**'
source_files:
    - .gitignore
---

This repository does not contain any build, packaging, or deployment configuration. There are no Makefiles, Dockerfiles, CI pipeline definitions (GitHub Actions, GitLab CI, etc.), Python dependency manifests (requirements.txt, pyproject.toml, setup.py), Go module files (go.mod), Node package manifests (package.json), or build/deploy scripts. The only build-related artifact is a .gitignore that excludes common Python/Node build outputs (dist/, build/, node_modules/, __pycache__/) and IDE/OS metadata — but this is purely a source-control filter, not an actual build system. The backend/app directory contains only empty Python package stubs with no entry points or configuration. As such, the build_system category does not apply to this repository.