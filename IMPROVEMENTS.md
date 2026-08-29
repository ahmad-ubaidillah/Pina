# IMPROVEMENTS.md — Pina AI

> Rencana perbaikan, terurut by priority. Setiap item ada status + evidence.
> Tanggal: 2026-08-29.

## ✅ DONE

### I1. OMNI Pi Extension WARNING — DONE
- **Issue:** `omni doctor` → `Pi Agent: Extension [WARNING]` + `pina plugin list` → `omni@undefined`.
- **Fix:** bikin `~/.pi/agent/settings.json` (ref "omni") + patch `version` di 2 `package.json`.
- **Verify:** `omni doctor` → `✓ ALL OK`; `pina plugin list` → `● omni@0.7.8`.

### I2. Visual Kanban Board + Live OMNI Panel — DONE
- **Issue:** Pina Kanban cuma CLI (`board.ts`), gak ada web UI.
- **Fix:** `pina-board/` (Bun server :8787 + HTML drag-drop 6-state + OMNI sidebar).
- **Verify:** `bun verify.ts` hijau (board + agent + launch).

### I3. Auto-sync MCP + Launch Agent button — DONE
- **Issue:** board gak sinkron dgn `mcp-pina-task-manager`; gak ada cara launch dari UI.
- **Fix:** `/api/board` gabung `tasks.json` + map status MCP→6-state; `/api/launch` spawn `pina -p`.
- **Verify:** `LAUNCH OK: true pid: 150835`.

### I4. Disable bansos network probe — DONE
- **Issue:** `pina -p` selalu probe 7 opencode model (network dependency, lambat).
- **Fix:** `pina plugin disable pi-bansos`.
- **Verify:** test run gak ada log `[bansos] checking`.

### I5. Docs vs reality drift (W7) — DONE (verified)
- **Task:** rename `pinai` → `pina-ai` di README/ARCHITECTURE/STACK.md.
- **Verify:** `grep -rc pinai README.md ARCHITECTURE.md STACK.md` = 0.
  Sisa: `research/` (crawler mentah, gak kritis) masih sebut pinai — biarkan.

### I9. Board undo / history visual (W4) — DONE
- **Issue:** drag-drop gak bisa di-undo; gak ada transition log.
- **Fix:** `transitions` table di `board.sqlite` + `/api/undo` (pop last transition) +
  tombol "Undo" di header UI.
- **Verify:** `bun verify.ts` → `UNDO OK: true (#2 back to TODO)`.

### I6. Rebase strategy dari OMP upstream (W1) — DONE (docs)
- **Issue:** fork drift risk; gak ada panduan sync.
- **Fix:** `REBASE.md` — fork state verified (HEAD `33cc6b9`, tracking `origin/main`,
  overlay di luar git history), procedure `git pull --ff-only` + re-apply `bin/omni` +
  `extensions/omni`, risk notes, NEVER push --force.
- **Verify:** `git branch -vv` → `main 33cc6b9 [origin/main]`; overlay terinventarisir.

### I7. OMNI learn_queue cleanup (W5) — DONE
- **Issue:** `~/.omni/learn_queue.jsonl` 3065 baris / 4.8 MB (PII risk, disk).
- **Fix:** `pina-board/pina-omni-clean.sh` — truncate file in place (bukan `omni reset`
  yang wipe everything). omni.db + config untouched.
- **Verify:** truncate 3065→0 lines, `omni stats` tetap 794 KB saved.

### I8. One-line installer (W6) — DONE
- **Issue:** dist 186 MB, gak ada installer (vs Cheasee-Pi curl|bash).
- **Fix:** `pina-install.sh` — symlink pina+omni+launchers ke `~/.local/bin`, ensure
  `~/.pina`, register OMNI Pi extension di `~/.pi/agent/settings.json`. Idempotent.
- **Verify:** re-run → semua symlink benar, pi settings skipped (sudah ada).

### I10. AEON proxy bypass (W3 sisa) — DONE
- **Task:** `proxy-mimo.py` sudah fix generator; `sumopod/mimo-v2.5` stabil tanpa bansos.
- **Ref:** BUILD_REPORT §4.

## ALL DONE ✅
Semua item perbaikan (I1–I10) selesai & terverifikasi. Sisa = out-of-scope (AEON rule).

## Tidak diambil (AEON / filosofi)
- Collaborative multi-user, Docker, GitHub OAuth, built-in browser QA (kayak VibeKanban).
- Pina pakai `pi-dynamic-workflows` subagent + local worktree sendiri.
