#!/usr/bin/env bash
# shrimp-install — one-line installer for Shrimp AI (local-only, no Docker, no GitHub).
#
# What it does:
#   1. Ensure ~/.shrimp config dir (symlink to ~/.omp if present, like the dev setup).
#   2. Symlink `shrimp` binary + `omni` (bundled) into ~/.local/bin (on PATH).
#   3. Symlink `shrimp-board` launcher + `shrimp-omni-clean`.
#   4. Register OMNI Pi extension in ~/.pi/agent/settings.json (fixes doctor warning).
#
# Usage:
#   curl -fsSL <this-script> | bash     # (when hosted)
#   bash shrimp-install.sh              # local run
#
# No network access required — everything is already in this repo.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE="$ROOT/shrimp-ai-core"
BIN="$HOME/.local/bin"
mkdir -p "$BIN"

echo "🦐 Shrimp AI installer"

# 1. config dir
if [ ! -e "$HOME/.shrimp" ]; then
  if [ -e "$HOME/.omp" ]; then
    ln -s "$HOME/.omp" "$HOME/.shrimp"
    echo "  linked ~/.shrimp -> ~/.omp"
  else
    mkdir -p "$HOME/.shrimp"
    echo "  created ~/.shrimp"
  fi
fi

# 2. binaries
ln -sf "$CORE/packages/coding-agent/dist/shrimp" "$BIN/shrimp"
ln -sf "$CORE/bin/omni" "$BIN/omni"
echo "  linked shrimp + omni -> $BIN"

# 3. launchers
ln -sf "$ROOT/shrimp-board/shrimp-board.sh" "$BIN/shrimp-board"
ln -sf "$ROOT/shrimp-board/shrimp-omni-clean.sh" "$BIN/shrimp-omni-clean"
echo "  linked shrimp-board + shrimp-omni-clean -> $BIN"

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
echo "✓ Shrimp AI installed."
echo "  Run: shrimp --help"
echo "  Board: shrimp-board  → http://127.0.0.1:8787"
echo "  OMNI cleanup: shrimp-omni-clean"
echo ""
echo "  Ensure \$HOME/.local/bin and \$HOME/.bun/bin are on PATH."
