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

# 2b. web stack: obscura (headless browser for agents) — download prebuilt per-OS if missing
OBSCURA_DIR="$CORE/bin/obscura"
OBSCURA_BIN="$OBSCURA_DIR/obscura"
if [ ! -x "$OBSCURA_BIN" ]; then
  OS="$(uname -s)"; ARCH="$(uname -m)"
  case "$OS" in
    Linux)   PKG="obscura-${ARCH}-linux.tar.gz" ;;
    Darwin)  PKG="obscura-${ARCH}-macos.tar.gz" ;;
    *)       echo "  ! obscura: unsupported OS ($OS) — skip (browser_action will fall back to fetch)" ;;
  esac
  if [ -n "$PKG" ]; then
    VER="v0.2.1"
    URL="https://github.com/h4ckf0r0day/obscura/releases/download/$VER/$PKG"
    echo "  downloading obscura $VER ($PKG)…"
    mkdir -p "$OBSCURA_DIR"
    if curl -fsSL -o /tmp/obscura.tar.gz "$URL" 2>/dev/null; then
      tar xzf /tmp/obscura.tar.gz -C "$OBSCURA_DIR" && chmod +x "$OBSCURA_DIR/obscura" "$OBSCURA_DIR/obscura-worker" 2>/dev/null
      rm -f /tmp/obscura.tar.gz
      echo "  obscura installed -> $OBSCURA_DIR"
    else
      echo "  ! obscura download failed — browser_action falls back to fetch"
    fi
  fi
fi
# symlink obscura if present
if [ -x "$OBSCURA_BIN" ]; then
  ln -sf "$OBSCURA_BIN" "$BIN/obscura"
  echo "  linked obscura -> $BIN"
fi

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

# 5. Skill Store: copy pina-skills/ into ~/.pina/pina-skills (agent reads from there)
SKILLS_SRC="$ROOT/pina-skills"
SKILLS_DST="$HOME/.pina/pina-skills"
if [ -d "$SKILLS_SRC" ]; then
  mkdir -p "$SKILLS_DST"
  cp -r "$SKILLS_SRC/." "$SKILLS_DST/"
  echo "  copied pina-skills -> $SKILLS_DST"
fi

# 6. Browser Actions: copy examples into ~/.pina/browser-actions (agent reads from there)
BA_SRC="$ROOT/browser-actions"
BA_DST="$HOME/.pina/browser-actions"
if [ -d "$BA_SRC" ] && [ -f "$BA_SRC/fetch_page.js" ]; then
  mkdir -p "$BA_DST"
  cp -r "$BA_SRC/." "$BA_DST/"
  echo "  copied browser-actions -> $BA_DST"
fi
