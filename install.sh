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
for b in pina omni spider obscura obscura-worker pina-board; do
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
