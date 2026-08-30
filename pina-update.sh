#!/usr/bin/env bash
# pina-update — pull upstream OMP changes into Pina, rebuild, rebrand.
#
# Strategy (per Ahmad): Pina is a fork of OMP (oh-my-pi, MIT). We keep Pina's
# own config (~/.pina, independent from ~/.omp) and own branding (dist/pina),
# but pull engine updates from the OMP upstream so we never fall behind.
#
# What it does:
#   1. git pull latest OMP into pina-core (origin = github.com/can1357/oh-my-pi)
#   2. rebuild the coding-agent binary (bun run build -> dist/shrimp)
#   3. rebrand: dist/shrimp -> dist/pina
#   4. relink ~/.local/bin/pina
#
# NOTE: startup.checkUpdate is disabled in ~/.pina/settings.json so Pina never
# shows the "omp update available" banner — this script IS the update path.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
CORE="$ROOT/pina-core"
BIN="$HOME/.local/bin"

echo "🍍 Pina update (pull OMP upstream + rebuild)"

# 1. pull upstream
cd "$CORE"
echo "  git pull origin main (oh-my-pi)..."
git stash >/dev/null 2>&1 || true
git pull origin main --ff-only

# 2. rebuild
echo "  building coding-agent (bun run build)..."
cd "$CORE/packages/coding-agent"
bun run build

# 3. rebrand
if [ -f "dist/shrimp" ]; then
  mv -f dist/shrimp dist/pina
  echo "  rebranded dist/shrimp -> dist/pina"
fi

# 4. relink
ln -sf "$CORE/packages/coding-agent/dist/pina" "$BIN/pina"
echo "  linked pina -> $BIN"

echo "✓ Pina updated. Restart any running Pina session to use the new build."
