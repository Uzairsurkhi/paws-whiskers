#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
bash "$ROOT/.cursor/scripts/setup-dev-env.sh"

# Fail fast if dependencies were not installed.
python3 -c "import fastapi, uvicorn" >/dev/null
test -d "$ROOT/frontend/node_modules"
