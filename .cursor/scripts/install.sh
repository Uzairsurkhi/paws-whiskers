#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

python3 -m pip install --disable-pip-version-check --no-input -r "$ROOT/backend/requirements.txt"

cd "$ROOT/frontend"
yarn install --frozen-lockfile
