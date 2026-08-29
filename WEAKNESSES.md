# WEAKNESSES.md — Shrimp AI

> Daftar kelemahan Shrimp AI **berbasis evidence** (diverifikasi via tool, bukan asumsi).
> Tanggal audit: 2026-08-29. Update tiap ada perbaikan (lihat IMPROVEMENTS.md).

## W1. Upstream OMP fork drift risk — MEDIUM
- **Evidence:** `shrimp-ai-core` fork dari `github.com/can1357/oh-my-pi` (origin remote aktif).
  HEAD `33cc6b9` — OMP upstream terus bergerak (Stencil Labs, MIT, ~80k LOC).
- **Dampak:** rebase/merge conflict tiap sync; fitur kita (OMNI bundle, board UI) bisa bentrok.
- **Mitigasi saat ini:** patch minimal ke `dist/shrimp` + extension di `~/.shrimp`, gak fork
  kode inti. Belum ada strategy rebase terjadwal.

## W2. Startup network dependency (bansos probe) — FIXED 2026-08-29
- **Evidence (sebelum fix):** `shrimp -p` jalanin `pi-bansos` extension → "checking 7 opencode
  model(s)" + network probe ke gateway free-tier (log `[bansos] ... is alive`).
- **Fix:** `shrimp plugin disable pi-bansos` → `⦸ pi-bansos@0.4.8`. Test run: bansos gak fired.
- **Sisa risiko:** kalau `shrimp plugin enable pi-bansos` balik, probe nyala lagi.

## W3. MCP marketplace fragil — LOW (mitigasi ada)
- **Evidence:** 8 built-in OMP MCP server crash (butuh binary/token eksternal):
  `omx_state, omx_memory, omx_code_intel, omx_trace, omx_wiki, testrail, glean, shortcut`.
- **Mitigasi:** `mcp.disabledServers` di `agent/config.yml` → 8 server di-disable.
- **Dampak:** fitur observability/memory OMP bawaan gak kepakai; kita pakai `mnemopi` +
  `pi-hermes-memory` sebagai gantinya.

## W4. Board UI baru — belum mature — LOW
- **Evidence:** `shrimp-board/` dibuat 2026-08-29 (Bun server + HTML). Belum ada:
  - auth / multi-user (local-only, single user — sesuai AEON rule)
  - persistence drag-drop masih pakai `board.sqlite` local (TODO/REJECT via CLI `board.ts`)
  - gak ada undo / history visual
- **Catatan:** fungsional (verify hijau), tapi belum selevel VibeKanban review UI.

## W5. OMNI learn_queue tumbuh — LOW (optional)
- **Evidence:** `~/.omni/learn_queue.jsonl` = 3065 baris / 4.8 MB (antrian "learning" OMNI).
- **Dampak:** disk kecil di mesin lokal; PII potensial (command history).
- **Mitigasi:** OMNI ada retention tier (self-cleaning). Bisa `omni reset` tp hapus config.
  **Tidak dihapus paksa** (data user). Biarkan / cleanup manual kalau perlu.

## W6. Binary build berat — LOW
- **Evidence:** `dist/shrimp` = 186 MB (Bun compile). Gak ada one-line installer
  (vs Cheasee-Pi `curl|bash` + Docker).
- **Dampak:** distribusi ke mesin lain ribet; gak ada CI/test untuk `shrimp-ai-core`.

## W7. Docs vs reality drift — LOW
- **Evidence:** `README/ARCHITECTURE/STACK.md` masih sebut `~/Documents/shrimpi` (sudah
  rename ke `shrimp-ai`); `board.ts` benar tapi docs lain belum. Binary baca
  `CONFIG_DIR_NAME=".shrimp"` (sudah konsisten).
- **Mitigasi:** BUILD_REPORT.md sudah update; README/ARCHITECTURE butuh pass.

## Out of scope (AEON rule — local-only, no GitHub)
- Collaborative team / PR-linkage (kayak VibeKanban) — gak akan diambil.
- Docker / GitHub OAuth — dilarang.
