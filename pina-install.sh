#!/usr/bin/env bash
# pina-install — one-line installer for Pina (Pi Native Agent).
# Local-only, no Docker, no GitHub. (AEON rule: never push to GitHub without permission.)
#
# What it does:
#   1. Ensure ~/.pina config dir (symlink to ~/.omp if present, like the dev setup).
#      Also keeps ~/.shrimp -> ~/.omp as a back-compat alias.
#   2. Symlink `pina` binary + `omni` (bundled) into ~/.local/bin (on PATH).
#      Also keeps `shrimp` as a back-compat alias.
#   3. Symlink `pina-board` launcher + `pina-omni-clean`.
#   4. Register OMNI Pi extension in ~/.pi/agent/settings.json (fixes doctor warning).
#
# Usage:
#   bash pina-install.sh                 # local run
#
# No network access required — everything is already in this repo.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/pina-core"
BIN="$HOME/.local/bin"
mkdir -p "$BIN"

echo "🍍 Pina installer (Pi Native Agent)"

# 1. config dir
if [ ! -e "$HOME/.pina" ]; then
  if [ -e "$HOME/.omp" ]; then
    ln -s "$HOME/.omp" "$HOME/.pina"
    echo "  linked ~/.pina -> ~/.omp"
  else
    mkdir -p "$HOME/.pina"
    echo "  created ~/.pina"
  fi
fi
# back-compat alias
if [ ! -e "$HOME/.shrimp" ] && [ -e "$HOME/.omp" ]; then
  ln -s "$HOME/.omp" "$HOME/.shrimp"
  echo "  linked ~/.shrimp -> ~/.omp (back-compat)"
fi

# 2. binaries
ln -sf "$CORE/packages/coding-agent/dist/shrimp" "$BIN/pina"
ln -sf "$CORE/packages/coding-agent/dist/shrimp" "$BIN/shrimp"
ln -sf "$CORE/bin/omni" "$BIN/omni"
echo "  linked pina (+ shrimp back-compat) + omni -> $BIN"

# 3. launchers
ln -sf "$ROOT/pina-board/pina-board.sh" "$BIN/pina-board"
ln -sf "$ROOT/pina-board/shrimp-board.sh" "$BIN/shrimp-board"
ln -sf "$ROOT/pina-board/pina-omni-clean.sh" "$BIN/pina-omni-clean"
ln -sf "$ROOT/pina-board/shrimp-omni-clean.sh" "$BIN/shrimp-omni-clean"
echo "  linked pina-board + pina-omni-clean -> $BIN"

# 4. OMNI Pi extension registration (fixes `omni doctor` Pi warning)
PI_SETTINGS="$HOME/.pi/agent/settings.json"
mkdir -p "$(dirname "$PI_SETTINGS")"
if [ ! -f "$PI_SETTINGS" ] || ! grep -q "omni" "$PI_SETTINGS" 2>/dev/null; then
  cat > "$PI_SETTINGS" <<JSON
{
  "extensions": [
    "$CORE/extensions/omni/plugins/pi/index.ts"
  ]
}
JSON
  echo "  wrote $PI_SETTINGS (OMNI Pi extension registered)"
else
  echo "  $PI_SETTINGS already references omni — skipped"
fi

echo ""
echo "✓ Pina installed. (Pi Native Agent)"
echo "  Run: pina --help"
echo "  Board: pina-board  → http://127.0.0.1:8787"
echo "  OMNI cleanup: pina-omni-clean"
echo ""
echo "  Ensure \$HOME/.local/bin and \$HOME/.bun/bin are on PATH."
