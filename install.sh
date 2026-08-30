#!/usr/bin/env bash
# Pina installer (release) — one command:
#   curl -fsSL https://pina.sh/install | bash
# Downloads the prebuilt Pina bundle for this OS/arch, extracts to ~/.pina/dist,
# symlinks binaries to ~/.local/bin, and copies skills + board.
set -e

REPO="ahmad-ubaidillah/Pina"
VER="${PINA_VERSION:-latest}"
BIN="$HOME/.local/bin"
DIST="$HOME/.pina/dist"
mkdir -p "$BIN" "$DIST"

OS="$(uname -s)"; ARCH="$(uname -m)"
case "$OS" in
  Linux)  OSN="linux" ;;
  Darwin) OSN="macos" ;;
  *) echo "! unsupported OS: $OS"; exit 1 ;;
esac
case "$ARCH" in
  x86_64|amd64) ARCHN="x64" ;;
  arm64|aarch64) ARCHN="arm64" ;;
  *) echo "! unsupported arch: $ARCH"; exit 1 ;;
esac
PKG="pina-${OSN}-${ARCHN}.tar.gz"

echo "🍍 Pina installer (Pi Native Agent)"
echo "  target: $PKG"

# resolve download URL (latest = newest release asset)
if [ "$VER" = "latest" ]; then
  URL="$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep -oE "https://github.com/$REPO/releases/download/[^\"]+/$(printf '%s' "$PKG" | sed 's/[.]/\\./g')" | head -1)"
else
  URL="https://github.com/$REPO/releases/download/$VER/$PKG"
fi
[ -n "$URL" ] || { echo "! could not find release asset $PKG"; exit 1; }
echo "  downloading $URL"

TMP="$(mktemp -d)"
curl -fsSL -o "$TMP/$PKG" "$URL"
tar xzf "$TMP/$PKG" -C "$DIST"
rm -rf "$TMP"

# symlink binaries
# Note: `pina-web` is the Rust (rust-headless-chrome) fetch/crawl engine.
# `spider` is the crawler. `obscura` was removed — pina-web replaces it.
for b in pina omni spider pina-web pina-board; do
  [ -e "$DIST/bin/$b" ] && ln -sf "$DIST/bin/$b" "$BIN/$b"
done
# back-compat
ln -sf "$DIST/bin/pina" "$BIN/shrimp" 2>/dev/null || true
# pina-board launcher needs to point at extracted server
ln -sf "$DIST/pina-board/server.ts" "$BIN/pina-board" 2>/dev/null || true

# copy skills + browser-actions into ~/.pina (agent reads from there)
mkdir -p "$HOME/.pina/pina-skills" "$HOME/.pina/browser-actions"
cp -r "$DIST/pina-skills/." "$HOME/.pina/pina-skills/" 2>/dev/null || true
cp -r "$DIST/browser-actions/." "$HOME/.pina/browser-actions/" 2>/dev/null || true

# optional: BrowserSkill (real logged-in Chrome) — download prebuilt bsk CLI only.
# The Chrome/Edge extension + connection is interactive (user must do it once).
BSK_VER="v0.1.11"
BSK_TGZ="bsk-${BSK_VER}-${ARCHN}-unknown-linux-musl.tar.gz"
BSK_URL="https://github.com/Tencent/BrowserSkill/releases/download/cli-${BSK_VER}/$BSK_TGZ"
if [ "$OSN" = "macos" ]; then
  BSK_TGZ="bsk-${BSK_VER}-${ARCHN}-apple-darwin.tar.gz"
  BSK_URL="https://github.com/Tencent/BrowserSkill/releases/download/cli-${BSK_VER}/$BSK_TGZ"
fi
if [ ! -e "$BIN/bsk" ]; then
  echo "  downloading optional BrowserSkill (bsk) CLI…"
  TMPB="$(mktemp -d)"
  if curl -fsSL -o "$TMPB/$BSK_TGZ" "$BSK_URL" 2>/dev/null; then
    tar xzf "$TMPB/$BSK_TGZ" -C "$TMPB"
    BSK_BIN="$(find "$TMPB" -type f -name bsk | head -1)"
    [ -n "$BSK_BIN" ] && cp "$BSK_BIN" "$BIN/bsk" && chmod +x "$BIN/bsk" && echo "  ✓ bsk installed (real-browser backend ready)"
  else
    echo "  ! bsk download skipped (offline). Form/login tasks fall back to pina-web (headless)."
  fi
  rm -rf "$TMPB"
fi

# pina-web (Rust fetch/crawl engine, rust-headless-chrome) — download prebuilt.
# Requires a Chromium/Chrome binary on PATH (set PINA_CHROMIUM to override).
PW_VER="v0.1.0"
PW_BIN="pina-web-${OSN}-${ARCHN}"
PW_URL="https://github.com/$REPO/releases/download/$PW_VER/$PW_BIN"
if [ ! -e "$BIN/pina-web" ]; then
  echo "  downloading pina-web (fetch/crawl engine)…"
  TMPW="$(mktemp -d)"
  if curl -fsSL -o "$TMPW/pina-web" "$PW_URL" 2>/dev/null; then
    cp "$TMPW/pina-web" "$BIN/pina-web" && chmod +x "$BIN/pina-web" && echo "  ✓ pina-web installed"
  else
    echo "  ! pina-web download skipped (offline). Web fetch/crawl unavailable until built."
  fi
  rm -rf "$TMPW"
fi

# plugins: swarm + pi-dynamic-workflows (loaded via --plugin-dir)
mkdir -p "$HOME/.pina/plugins/node_modules/@quintinshaw"
cp -r "$DIST/plugins/@quintinshaw/swarm" "$HOME/.pina/plugins/node_modules/@quintinshaw/swarm" 2>/dev/null || true
cp -r "$DIST/plugins/@quintinshaw/pi-dynamic-workflows" "$HOME/.pina/plugins/node_modules/@quintinshaw/pi-dynamic-workflows" 2>/dev/null || true
# node_modules hoist for plugin deps (acorn, typebox, etc.)
[ -d "$DIST/plugins/node_modules" ] && cp -rn "$DIST/plugins/node_modules/." "$HOME/.pina/plugins/node_modules/" 2>/dev/null || true

# pina wrapper: auto-inject --plugin-dir so plugins load without whole OMP
cat > "$BIN/pina" <<WRAP
#!/usr/bin/env bash
exec "$DIST/bin/pina" --plugin-dir "$HOME/.pina/plugins" "\$@"
WRAP
chmod +x "$BIN/pina"
ln -sf "$BIN/pina" "$BIN/shrimp" 2>/dev/null || true

echo ""
echo "✓ Pina installed."
echo "  Run: pina --help"
echo "  Board: pina-board  → http://127.0.0.1:8787"
echo "  Ensure \$HOME/.local/bin is on PATH."
echo ""
echo "Web engine: pina-web (Rust/rust-headless-chrome) is the default fetch/crawl backend."
echo "  Requires Chromium/Chrome on PATH. Override: export PINA_CHROMIUM=/path/to/chrome"
echo ""
echo "Optional — real-browser (form/login) backend (bsk):"
echo "  bsk is installed. To drive your real logged-in Chrome/Edge:"
echo "    1. Install the BrowserSkill extension:"
echo "         Chrome:  https://chromewebstore.google.com/detail/hhcmgoofomhgciiibhipgmgkgnoenaoi"
echo "         Edge:    https://microsoftedge.microsoft.com/addons/detail/browserskill/jjgdbccjgkndkfobjcomodlmnehhjpic"
echo "    2. Click the extension icon once to connect it to the local bsk daemon."
echo "    3. Then 'pina -p \"isi form login di …\"' uses YOUR browser (cookies, logged-in)."
echo ""