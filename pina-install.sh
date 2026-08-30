#!/usr/bin/env bash
# pina-install — one-line installer for Pina (Pi Native Agent).
# Local-only, no Docker, no GitHub. (AEON rule: never push to GitHub without permission.)
#
# What it does:
#   1. Ensure ~/.pina config dir (symlink to ~/.omp if present, like the dev setup).
#   2. Symlink `pina` binary + `omni` (bundled) into ~/.local/bin (on PATH).
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

# 2. binaries
ln -sf "$CORE/packages/coding-agent/dist/shrimp" "$BIN/pina"
ln -sf "$CORE/bin/omni" "$BIN/omni"
echo "  linked pina + omni -> $BIN"

# 2b. web stack: pina-web (Rust / rust-headless-chrome fetch+crawl engine)
PW_BIN="$CORE/bin/pina-web"
if [ -x "$PW_BIN" ]; then
  ln -sf "$PW_BIN" "$BIN/pina-web"
  echo "  linked pina-web -> $BIN"
else
  echo "  ! pina-web binary not found in repo (pina-core/bin/pina-web)."
  echo "    Build it: 'cargo build --release' in the pina-web crate, copy to pina-core/bin/pina-web."
  echo "    Requires Chromium/Chrome on PATH (set PINA_CHROMIUM to override)."
fi
# 2b2. real-browser driver: bsk (BrowserSkill) — download prebuilt if missing
BSK_BIN="$BIN/bsk"
if [ ! -x "$BSK_BIN" ]; then
  OS="$(uname -s)"; ARCH="$(uname -m)"
  case "$OS" in
    Linux)  BSK_TGZ="bsk-v0.1.11-${ARCH}-unknown-linux-musl.tar.gz" ;;
    Darwin) BSK_TGZ="bsk-v0.1.11-${ARCH}-apple-darwin.tar.gz" ;;
    *)      BSK_TGZ="" ;;
  esac
  if [ -n "$BSK_TGZ" ]; then
    URL="https://github.com/Tencent/BrowserSkill/releases/download/cli-v0.1.11/$BSK_TGZ"
    echo "  downloading bsk (real-browser driver)…"
    TMPB="$(mktemp -d)"
    if curl -fsSL -o "$TMPB/$BSK_TGZ" "$URL" 2>/dev/null; then
      tar xzf "$TMPB/$BSK_TGZ" -C "$TMPB"
      BSK_FOUND="$(find "$TMPB" -type f -name bsk | head -1)"
      [ -n "$BSK_FOUND" ] && cp "$BSK_FOUND" "$BSK_BIN" && chmod +x "$BSK_BIN" && echo "  bsk installed -> $BSK_BIN"
    else
      echo "  ! bsk download failed — real-browser tasks fall back to pina-web"
    fi
    rm -rf "$TMPB"
  fi
fi
# 2c. crawl backend: spider-rs (Rust CLI, MIT) — symlink if present, else offer cargo install
SPIDER_BIN="$CORE/bin/spider"
if [ -x "$SPIDER_BIN" ]; then
  ln -sf "$SPIDER_BIN" "$BIN/spider"
  echo "  linked spider -> $BIN"
else
  echo "  ! spider-rs binary not found in repo (pina-core/bin/spider)."
  echo "    To enable crawl: 'cargo install spider_cli' then re-run, or it stays absent (crawl tool falls back to web_search)."
fi

# 3. launchers
ln -sf "$ROOT/pina-board/pina-board.sh" "$BIN/pina-board"
ln -sf "$ROOT/pina-board/pina-omni-clean.sh" "$BIN/pina-omni-clean"
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
