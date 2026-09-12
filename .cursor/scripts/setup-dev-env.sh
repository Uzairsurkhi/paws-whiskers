#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_ENV="$ROOT/backend/.env"
FRONTEND_ENV="$ROOT/frontend/.env"

if [[ ! -f "$BACKEND_ENV" ]]; then
  cat >"$BACKEND_ENV" <<'EOF'
JWT_SECRET=dev-jwt-secret-change-in-production
DB_NAME=paws_whiskers
ADMIN_EMAIL=admin@pawsandwhiskers.in
ADMIN_PASSWORD=PawsAdmin2026!
ALLOW_DEV_OTP=true
EOF
fi

if [[ ! -f "$FRONTEND_ENV" ]]; then
  cat >"$FRONTEND_ENV" <<'EOF'
REACT_APP_BACKEND_URL=http://localhost:8000
HOST=0.0.0.0
PORT=3000
BROWSER=none
WDS_SOCKET_PORT=0
EOF
fi
