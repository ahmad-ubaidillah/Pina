#!/usr/bin/env bash
# pina-update — pull upstream OMP changes into Pina, rebuild, rebrand.
#
# Strategy (per Ahmad): Pina is a fork of OMP (oh-my-pi, MIT). We keep Pina's
# own config (~/.pina, independent from ~/.omp) and own branding (dist/pina),
# but pull engine updates from the OMP upstream so we never fall behind.
#
# What it does:
#   1. git pull latest OMP into pina-core (origin = github.com/can1357/oh-my-pi)
#   2. ensure deps (bun install) + rebuild coding-agent (bun run build -> dist/shrimp)
#   3. rebrand: dist/shrimp -> dist/pina
#   4. relink ~/.local/bin/pina
#
# NOTE: startup.checkUpdate is disabled in ~/.pina/settings.json so Pina never
# shows the "omp update available" banner — this script IS the update path.
set -e

# make bun available (it lives outside default PATH)
export PATH="$HOME/.bun/bin:$PATH"
if ! command -v bun >/dev/null 2>&1; then
  echo "✗ bun not found. Install it: curl -fsSL https://bun.sh/install | bash" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")" && pwd)"
CORE="$ROOT/pina-core"
BIN="$HOME/.local/bin"

echo "🍍 Pina update (pull OMP upstream + rebuild)"

# 1. pull upstream (with progress so it never looks hung)
cd "$CORE"
echo "  git pull origin main (oh-my-pi)..."
git stash >/dev/null 2>&1 || true
git pull --progress origin main --ff-only 2>&1 | tail -5 || {
  echo "✗ git pull failed (network or conflict). Aborting." >&2
  exit 1
}

# 2. ensure deps + rebuild
echo "  ensuring deps (bun install)..."
cd "$CORE"
bun install 2>&1 | tail -3 || true
echo "  building coding-agent (bun run build)..."
cd "$CORE/packages/coding-agent"
bun run build 2>&1 | tail -15 || {
  echo "✗ build failed. See output above." >&2
  exit 1
}

# 3. rebrand — OMP builds to dist/omp, we rename to dist/pina
if [ -f "dist/omp" ]; then
  mv -f dist/omp dist/pina
  echo "  rebranded dist/omp -> dist/pina"
elif [ ! -f "dist/pina" ]; then
  echo "✗ no build output (dist/omp or dist/pina). Build may have failed." >&2
  exit 1
fi

# 4. relink
ln -sf "$CORE/packages/coding-agent/dist/pina" "$BIN/pina"
echo "  linked pina -> $BIN"

echo "✓ Pina updated. Restart any running Pina session to use the new build."
