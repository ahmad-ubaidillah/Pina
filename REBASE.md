# REBASE.md — Pina AI ↔ OMP upstream sync strategy

> Cara menjaga fork Pina AI tetap selaras dengan upstream OMP
> (`github.com/can1357/oh-my-pi`) tanpa kehilangan modifikasi kita.
> Tanggal: 2026-08-29.

## Current state (verified)
- **Fork:** `pina-core` = checkout OMP `origin/main`.
- **HEAD:** `33cc6b9` (tracking `origin/main`, no local commits ahead).
- **Our additions:** SEMUA di luar git history OMP — kita gak commit patch ke
  `pina-core`. Jadi rebase = `git pull` + pastikan overlay kita tetap utuh.

### What we added (overlay, NOT in OMP git)
| Path | What | Re-apply after pull? |
|---|---|---|
| `bin/omni` | Bundled OMNI v0.7.8 binary (11 MB) | Ya (copy manual) |
| `extensions/omni/` | OMNI Pi extension (patched `DEFAULT_OMNI_PATH`) | Ya |
| `pina-board/` | Visual Kanban UI (Bun server + HTML) | Independent, gak terimbas |
| `pina-install.sh` | One-line installer | Independent |
| `~/.pina/` | Config dir (symlink → `~/.omp`) | User-level, gak di repo |
| `board.sqlite` | Local task board (root pina-ai) | Independent |

### OMP files we PATCHED (beware conflict on pull)
- `packages/coding-agent/dist/pina` — **prebuilt binary** (186 MB). Kita gak build ulang;
  kalau OMP rilis binary baru, kita download/rebuild dan symlink ulang.
- `packages/coding-agent/src/extensibility/...` — loader/skills (hanya dibaca, gak diubah).
- `agent/config.yml` — `disabledProviders` + `mcp.disabledServers` (8 server) + `disabledExtensions`.
  Ini di `~/.pina/agent/config.yml` (user-level), gak di repo OMP.

## Rebase procedure (run tiap ada OMP release baru)

### 1. Stash our overlay (safety)
```bash
cd ~/Documents/pina-ai/pina-core
# our untracked additions
git stash -u -m "pina-overlay" 2>/dev/null || true
git status --short   # harus clean (hanya untracked overlay)
```

### 2. Pull upstream
```bash
git fetch origin
git merge origin/main --ff-only   # fast-forward; kalau reject → rebase manual
# atau: git pull --ff-only origin main
```

### 3. Re-apply overlay
```bash
# OMNI binary + extension
cp /backup/omni-bin bin/omni
cp -r /backup/omni-ext extensions/omni
# (pina-board/ + pina-install.sh sudah di ~/Documents/pina-ai, gak ke-stash)
```

### 4. Verify
```bash
pina --version
pina -p "echo rebase-ok" 2>&1 | tail -2
omni doctor | grep -E "Pi Agent|ALL OK"
bun ~/Documents/pina-ai/pina-board/verify.ts
```

### 5. If binary changed (OMP rebuilt dist/pina)
```bash
# rebuild atau download dist/pina dari OMP release, lalu:
ln -sf ~/Documents/pina-ai/pina-core/packages/coding-agent/dist/pina ~/.bun/bin/pina
```

## Risk & notes
- **Low risk:** overlay kita di luar git history → `git pull --ff-only` gak bentrok.
- **Medium risk:** kalau OMP ubah `loader.ts`/`skills.ts` (extension loading) → behavior
  bansos/OMNI bisa berubah. Test: `pina plugin list` + `omni doctor`.
- **NEVER:** `git push --force` ke `origin/main` (AEON rule: local-only, gak fork ke GitHub
  tanpa izin). Kita fork di mesin lokal, gak di GitHub.
- **Bansos:** tetap disabled via `pina plugin disable pi-bansos` (user-level, persist
  di `~/.pina/agent/extensions` state, gak ilang saat pull).

## Cadence
- Cek OMP release: tiap bulan (atau kalau ada fitur kita butuh).
- Jangan rebase cuma karena ada commit baru — hanya kalau butuh fix/feature upstream.
