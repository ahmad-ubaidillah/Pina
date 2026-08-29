#!/usr/bin/env bash
# Pina Kanban launcher — opens the visual board at http://127.0.0.1:8787
# Lightweight: Bun + bun:sqlite, no Docker, no GitHub.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$HOME/.bun/bin:$PATH"
cd "$DIR"
echo "🍍 Pina Kanban → http://127.0.0.1:8787  (Ctrl+C to stop)"
exec bun server.ts
