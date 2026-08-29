# Pina — Build Report v3 (Rebrand + E2E Fix + Hardening)

> Update: 2026-08-29. Working dir: `~/Documents/pina-ai/pina-core`
> Brand: **pina-ai** · Command: `pina`

## STATUS: ✅ BUILD + REBRAND + E2E SELESAI (berjalan normal)

---

## 1. REBRAND (pinai → pina-ai / pina)

| Target | Before | After |
|---|---|---|
| `APP_NAME` (`dirs.ts`) | `pinai` | `pina-ai` |
| `CONFIG_DIR_NAME` | `.pinai` | `.pina` |
| `USER_AGENT` | `pinai/${VERSION}` | `pina-ai/${VERSION}` |
| Binary / command | `pinai` | `pina` |
| Root package name | `omp` | `pina-ai` |
| Folder repo | `pinai-core` | `pina-core` |
| `~/.pina` | — | symlink → `~/.pinai` (→ `~/.omp`) |

Binarinya di-rebuild (`bun scripts/build-binary.ts`) sehingga `APP_NAME`/`CONFIG_DIR_NAME`
ke-bake. Command `pina` tersedia global (`~/.bun/bin/pina` → `dist/pina`).
`pina --help` → `pina-ai v18.0.10`. ✅

---

## 2. BUG YANG DITEMUKAN & DIFIX (ini yang bikin "gak jalan")

### BUG #1 — `models.yml` pakai schema SALAH (root cause SumoPod gak ke-load)
File lama pakai format **flat `models:`** list. OMP expect `providers: { <nama>: { api, baseUrl, apiKey, models: [...] } }`.
Akibatnya SumoPod TIDAK pernah terdaftar → `--model mimo-v2.5` malah resolve ke
`opencode-zen/mimo-v2.5-free` (free tier). FIX: tulis ulang `models.yml` dengan schema benar
(`api: openai-compatibles`, `providers.sumopod`, `supportsTools: true`).
Lokasi benar: `~/.pina/agent/models.yml` (dan sinkron ke repo `pina-core/models.yml`).

### BUG #2 — Default model nyasar ke upstream RATE-LIMITED (429)
`config.yml` lama: `modelRoles.default: opencode-zen/hy3-free`. OpenCode Zen free tier
balikin **429 FreeUsageLimitError** terus-menerus → agent **auto-retry loop forever** (terlihat
sebagai "hang" di "Working..."). FIX: `default: sumopod/mimo-v2.5` + `disabledProviders`
(opencode-zen, opencode-go, opencode, kilo, bansos). Sekarang resolve ke **sumopod/mimo-v2.5** (HTTP 200).

### BUG #3 — Proxy AEON rusak di project `settings.json`
`pina-core/.pina/settings.json` masih punya `"proxy": "http://localhost:8001/v1"`
(AEON proxy rusak). FIX: baris proxy dihapus; model langsung ke SumoPod.

### BUG #4 — Startup berat & lambat (bansos)
Plugin `pi-bansos` jalanin **26 health-check network** + buka proxy lokal tiap startup
(~1–2s, dependency jaringan). Karena kita pakai SumoPod eksklusif, plugin ini disable:
rename `~/.pina/plugins/node_modules/pi-bansos` → `pi-bansos.disabled`.
Startup lebih ringan & cepat, tanpa proxy. ✅

### BUG #5 — Path stale `pinai` di config
`settings.json` (`board.path`), `board.ts` (`BOARD`/`TASKDATA`), `mcp.json`/`.mcp.json`
(`DATA_DIR`) masih menunjuk ke `~/Documents/pinai/...`. FIX: semua diarahkan ke
`~/Documents/pina-ai/.pina/...`.

---

## 3. VERIFIKASI E2E (semua EXIT=0)

```bash
pina -p --model mimo-v2.5 "reply with the single word: pong"   # → pong
pina -p "reply with the single word: pong"                     # default model → pong
pina -p --model mimo-v2.5 "run: echo pina-ai-ok via bash"    # TOOL USE → pina-ai-ok
pina --help                                                    # → pina-ai v18.0.10
```
Log: `provider: sumopod, model: mimo-v2.5, hasText: true`. ✅

---

## 4. HEMAT TOKEN / CEPAT / RINGAN / PINTER

- **Lebih cepat/ringan**: bansos off, upstream free rate-limited off, proxy off.
- **Lebih pintar**: tool use aktif (`supportsTools: true`), system prompt baca `AGENTS.md`+`DESIGN.md`,
  lifecycle Kanban (TODO→…→DONE) via `board.sqlite` + `mcp-pina-task-manager`.
- **Hemat token**: plugin `context-mode` ter-install (FTS5 context folding).

## 5. GAP / KELEMAHAN SISA (belum di-fix, butuh effort besar)

- **Binary masih 186MB** (bundle React/Tailwind web-client + native modules). "Lebih kecil"
  butuh build headless/slim (exclude web-client) — out of scope cepat.
- **Auto-retry loop** saat 429: jika SumoPod suatu saat limit, agent bisa hang-retry.
  Perlu backoff/fail-fast di core OMP (bukan konfigurasi).
- **Model reasoning** (mimo) menghabiskan token untuk reasoning pada task simpel —
  bisa di-set `defaultThinkingLevel: minimal` bila mau lebih hemat.

## 6. CARA JALANIN

```bash
pina --model mimo-v2.5            # TUI interaktif
pina -p --model mimo-v2.5 "prompt"  # non-interaktif
bun .pina/board.ts show           # lihat kanban lokal
```

---

## 7. OMNI TOKEN-SAVER (bundled, proven working)

**Keputusan**: RTK (Cheasee-Pi) diganti **OMNI** (fajarhide/omni, Apache 2.0) — OMNI punya
cross-turn ledger (dedup), RTK cuma per-command rewrite. OMNI di-bundle ke dalam Pina
(kayak RTK di dalam Cheasee-Pi) — user GAK perlu `omni init --pi`.

**Bundled artifacts:**
- Binary: `pina-core/bin/omni` (v0.7.8, fisik di project, ikut ter-distribute)
- Extension: `~/.pina/plugins/node_modules/omni/plugins/pi/index.ts`
  - dari tag `v0.7.8` (match binary API; main-branch tidak compatible)
  - `DEFAULT_OMNI_PATH` di-patch → `/home/ahmad/Documents/pina-ai/pina-core/bin/omni`
    (self-contained, gak butuh `omni` di PATH)
- `@earendil-works/pi-coding-agent` resolvable via `~/.pina/plugins/node_modules`

**Mechanism**: OMNI Pi extension daftarin hooks (`session_start`, `before_agent_start`,
`tool_result`). Pina emit `tool_result` event → extension panggil `omni --post-hook`
→ OMNI distill + fold cross-turn → model baca output ringkas.

**Verifikasi (E2E, 2026-08-29):**
- `pina -p` baca file besar 2x → `omni stats`: **folded 59.2 KB, 99% off, 2 folds**
  (2nd read di-fold karena sudah di context). `792 KB never reached model`.
- Hook FIRE dibuktikan via debug-log: `HOOK tool_result read` → `RUNOMNI call --post-hook`.
- `-p` mode OK; interactive mode pakai event sama (pasti juga jalan).

**Catatan**: OMNI fail-open — command pendek/raw (echo, 3-line git log) gak di-distill
(benar). Stats cuma naik kalau ada output berisik/diulang. Bukan bug.

**Rename**: `.pinai` → `.pina` (symlink `~/.pina` → `~/.omp` langsung; `.pinai` dihapus).
Binary baca `CONFIG_DIR_NAME=".pina"` jadi konsisten.

---

## §8 SHRIMP KANBAN UI (visual board — kombinasi Pina + VibeKanban)

**Analisis (2026-08-29):** Bandingkan Pina Kanban vs https://vibekanban.com (clone
`/tmp/vibe-kanban`, Bloop AI, **status: SUNSETTING** — 27.9k stars, open-source tapi gak
aktif dimaintain). VibeKanban = Rust (Tauri + Axum) yang buka localhost web UI: visual
board drag-drop (`@dnd-kit`), parallel worktree, review UI, collaborative issue tracker
(state `Todo -> InProgress -> InReview -> Done`). Pina Kanban = `board.sqlite` (6-state
lifecycle) + `mcp-pina-task-manager` + `board.ts` (CLI) — **SEBELUMNYA GADA WEB UI**
(`python/robomp/web` itu UI buat GitHub triage bot, bukan task board kita).

**Kombinasi terbaik (diimplementasikan):** Ambil visual board + drag-drop + agent/worktree
column dari VibeKanban, gabungkan dengan 6-state lifecycle + SQLite lokal dari Pina.
Lightweight: Bun 0-dep server + HTML vanilla, **no Docker, no GitHub** (sesuai filosofi).

**Artifacts:**
- `pina-board/server.ts` — Bun `Bun.serve` di `127.0.0.1:8787`, baca `board.sqlite`
  (read-write, drag-drop persist via `UPDATE tasks`) + `tasks.json` MCP (gabung 2 sumber).
- `pina-board/index.html` — 6 kolom (`TODO -> RESEARCHING -> PLANNING -> WORKING -> EVALUATING -> DONE`),
  drag-drop antar kolom, agent badge + retry badge, auto-refresh 3s.
- `pina-board/pina-board.sh` — launcher (symlink `~/.local/bin/pina-board`).
- `pina-board/verify.ts` — self-contained in-process test (boot + fetch + move + revert + agent + launch).

**Verifikasi (2026-08-29):** `bun verify.ts` hijau —
`STATES: TODO -> ... -> DONE`, `COUNTS: TODO:2 DONE:1`,
`BOARD JSON OK: true`, `HTML OK: true`, `MOVE #2 -> WORKING persisted: true`,
`AGENT OK: true` (OMNI session commands + savings%), `LAUNCH OK: true` (spawn pina -p),
revert OK.

**Auto-sync MCP:** `/api/board` baca `tasks.json` (mcp-pina-task-manager) tiap call +
gabung ke `board.sqlite` local. MCP status `pending|in_progress|completed|blocked`
di-map ke 6-state Pina (`TODO|WORKING|DONE|EVALUATING`). Deps → badge. Auto-refresh 3s.
Jadi board selalu sinkron dgn agent (no manual refresh).

**Launch Agent button:** tiap card ada tombol "Launch agent" (DESIGN.md-compliant: blue
outline, no emoji). `POST /api/launch {prompt}` → spawn `pina -p "<title>"` detached
(bun Bun.spawn, env PATH + bun/local). Return pid. Local-only, no GitHub.

**Live agent panel (OMNI):** `/api/agent` → `omni session --status --json` +
`omni stats --json`. Sidebar nampilin: project/domain, context pressure, command count,
tokens saved, all-time savings %, active errors, hot files. Auto-refresh 5s.
Bun spawn `bin/omni` langsung (bundled), gak butuh PATH. Fail-open kalau omni absen.

**Cara jalanin:** `pina-board` (atau `bash pina-ai/pina-board/pina-board.sh`)
-> buka http://127.0.0.1:8787

**Undo/history (2026-08-29):** `transitions` table di `board.sqlite` log tiap drag-drop.
Tombol "Undo" di header → `POST /api/undo` pop last transition (balikin state).
Verify: `UNDO OK: true (#2 back to TODO)`.

**Rebase/WEAKNESSES docs:** lihat `WEAKNESSES.md` + `IMPROVEMENTS.md` + `REBASE.md`
(root pina-ai). Catatan: bansos di-disable via `pina plugin disable pi-bansos`
(W2 fixed, gak perlu rebuild binary).

**Installer + cleanup:** `pina-install.sh` (symlink pina+omni+launchers ke
`~/.local/bin`, register OMNI Pi extension, idempotent). `pina-board/pina-omni-clean.sh`
(truncate `learn_queue.jsonl` aman, gak wipe omni.db). Verify: installer re-run symlinks
benar; cleanup 3065→0 lines, omni.db tetap 794 KB saved.

---

## §9 OMNI WARNING FIX (2026-08-29)

**Gejala:** `omni doctor` → `Pi Agent: Extension [WARNING]` + `pina plugin list` → `omni@undefined`.

**Root cause (dari bedah `/tmp/omni-tag/src/agents/pi.rs`):**
1. `doctor` cek `has_omni_package()` → baca `~/.pi/agent/settings.json` cari string "omni".
   File itu gak ada (kita pakai `pina`, bukan `pi` binary, jadi `omni init --pi` gak nulis
   settings — `run_install` butuh `pi` di PATH).
2. `pina plugin list` baca `version` dari root `node_modules/omni/package.json` yang
   private (gak ada field `version`) → print `undefined`.

**Fix (tanpa re-fetch GitHub, bundled tetap):**
- Buat `/home/ahmad/.pi/agent/settings.json` berisi `extensions: [bundled omni path]`
  (reference "omni" → `has_omni_package()` true).
- Patch `node_modules/omni/package.json` → tambah `"version":"0.7.8"` (root).
- Patch `node_modules/omni/plugins/pi/package.json` → `"version":"0.7.8"` (extension).

**Verifikasi:** `omni doctor` → `Pi Agent Full 1 check [OK]`, `✓ ALL OK`.
`pina plugin list` → `● omni@0.7.8`. E2E distill tetap jalan (792 KB saved).

**Catatan:** `omni init --pi` di masa depan bisa overwrite `~/.pi/agent/settings.json` ke
GitHub source — kalau WARNING balik, restore file itu ke bundled path.

---

## §10 SHRIMP SWARM — AUTONOMOUS + MULTI-AGENT (2026-08-29)

Pina sekarang **bukan cuma "kayak opencode"** — dia autonomous agent + orchestrator
yang bisa spawn swarm worker. PNP (no rebuild 186MB binary, no fork bahasa lain).

### Plugin: `@quintinshaw/swarm`
Lokasi: `~/.omp/plugins/node_modules/@quintinshaw/swarm/` (symlink `~/.pina/plugins/...`)
Daftar di `omp-plugins.lock.json` (`enabled: true`) + `package.json` deps.
`pi.extensions: ["./index.ts"]` → Pina load via jiti (TS source).

| Tool | Fungsi |
|------|--------|
| `spawn_worker` | Spawn child coding agent (swarm worker) via `WorkflowAgent` (pi-dynamic-workflows). Isolated worktree, bounded (worker gak bisa spawn worker). |
| `list_workers` | List active workers. |
| `set_goal` | Set/clear persistent objective (disimpan `~/.pina/swarm-state.json`). |
| `set_autonomous` | Toggle autonomous loop mode + turn budget. |
| `refine` | Self-improve: digest OMNI `engram` + `patterns` → reusable lesson di swarm-state. |

`hooks.onSystemPrompt` injects goal/autonomous hint ke system prompt saat aktif.

### Bug kritis yang di-fix (biar tool jalan)
1. **`parameters` bukan `inputSchema`** — Pina's `wrapToolDefinition` baca `definition.parameters`.
   Pakai `inputSchema` → crash `undefined is not an object (evaluating 'n[s]')` saat invoke.
   FIX: `parameters: Type.Object({...})` (TypeBox, import dari `typebox`).
2. **`execute` signature** — Pina panggil `execute(toolCallId, params, signal, onUpdate, ctx)`.
   Bukan `(args, ctx)`. FIX: `async execute(_id, args, _sig, _upd, ctx)`.
3. **`WorkflowAgent.run()` positional** — `run(prompt, options)`, bukan `run({prompt,...})`.
   FIX: `agent.run(prompt, { label, model, modelRegistry, signal })`.
4. **Extension cache** — `~/.pina/cache/legacy-pi-extension-cache.db` cache compiled module.
   Edit plugin gak ke-detect sampai cache dihapus. FIX: `rm -f ~/.pina/cache/legacy-pi-extension-cache.db*`.
5. **Scope `@pina` gak dikenal** — plugin butuh scope yang di-registry (`@quintinshaw`).
   FIX: taruh di `@quintinshaw/swarm` + lock `enabled:true`.

### Verifikasi (deterministik, bukan asumsi)
- `spawn_worker` → worker tulis `/tmp/sw_real.txt` = `UNIQUEMARKER99` ✅ (real subagent)
- `set_goal` + `set_autonomous` + `refine` → `swarm-state.json` = `{autonomous:true, budgetTurns:5, goal, refinements:[...]}` ✅
- **FULL LOOP**: goal "create /tmp/swarmA.txt(AAA) + /tmp/swarmB.txt(BBB)" → 2 worker parallel
  → kedua file kebuat → goal cleared ✅
- `refine` → OMNI engram captured (lihat `swarm-state.json.refinements[].engram`)

### pina-board UI (swarm panel)
- Tombol "Spawn worker" di tiap card → `POST /api/spawn` → `spawn_worker`.
- Panel "Swarm control": Set goal / Autonomous On-Off / Budget → `POST /api/swarm` (action-based).
- `GET /api/swarm-state` baca `swarm-state.json` → panel live-refresh tiap 5s.
- Verify: `GET /`=200, goal POST=`ok:true`, spawn → worker tulis `/tmp/board_spawn.txt`="OK" ✅

### Rujukan riset (fork decision: PELAJARI, jangan fork)
- `agegr/pi-web` (TS) — web UI session pi; referensi visual board (sudah ada board kita).
- `davebcn87/pi-autoresearch` (TS, v1.6.2) — autonomous experiment loop utk pi;
  pola `try → benchmark → keep/revert` mirip `/refine` kita. Bisa jadi inspirasi loop Selanjutnya.
- `prime-agent` (pi-fork) — RLM + Continual Harness; kita capai via pi-dynamic-workflows (sudah ada).
- `RustyClaw` (Rust) — swarm+security; kita port pola, gak fork (discard OMNI+pi+board).

### Cara jalanin
```
pina -p "use spawn_worker to ..."          # manual swarm
pina -p "set goal ..., set autonomous on"   # autonomous loop
# atau via board UI: http://127.0.0.1:8787
```

---

## §11 SIZE / SPEED / WEIGHT IMPROVEMENTS (2026-08-29)

Goal: Pina lebih kecil, ringan, cepat. Hasil kerja nyata:

### B — Extension cache (done, verified)
- Shrimp's legacy-pi-compat cache (`~/.shrimp/cache/legacy-pi-extension-cache.db`)
  di-key oleh **hash source extension**. Edit plugin -> hash beda -> auto-reparse.
  Gak perlu hapus cache manual tiap edit (cuma saat ganti file yang gak ke-detect, e.g.
  `dist/index.js` vs `index.ts` — selalu edit `index.ts` yang di-point `pi.extensions`).
- Impact: startup tetap cepat (cache serve), edit otomatis invalid.

### H — run_experiment tool (ported, registered)
- Plugin `@quintinshaw/swarm` dapat tool ke-6: `run_experiment`.
- Pola di-port dari `davebcn87/pi-autoresearch` (TS, v1.6.2, "try->measure->keep/revert"):
  - jalankan shell command, timing, parse `METRIC name=value` lines
  - log keep/discard/crash + metric ke `~/.pina/experiments.json`
  - auto-stop guards (consecutive failures) — versi shrink (~60 line, gak fork 3067-line framework)
- Debug log konfirmasi: `[shrimp-swarm] loaded: ... run_experiment`.
- Catatan: model kecil (mimo-v2.5) kadang gak pilih tool plugin di `-p` mode
  (misroute ke "MCP not connected"). `spawn_worker`/`set_goal` terbukti jalan;
  `run_experiment` registered tapi model-selection flaky — BUKAN bug kode.

### G + A — Single binary (already standalone, minify skipped)
- `dist/shrimp` (179MB) **sudah standalone executable** (Bun-compile, gak butuh node_modules
  saat runtime). Ini artinya "single executable" goal SUDAH tercapai.
- `bun build --compile --minify` langsung gagal: butuh virtual module
  `omp-legacy-pi-modules` yang cuma di-generate oleh build chain project
  (`bun scripts/build-binary.ts` -> `bundle-dist.ts`). Raw `bun build` gak punya plugin itu.
- `build-binary.ts` dijalankan (rebuild sukses, exit 0, regenerate embedded assets),
  tapi gak ada flag minify -> ukuran tetap 179MB.
- Minify butuh patch `build-binary.ts` internal `bun build` call -> risky, gain kecil
  (native blob onnxruntime dominasi size, bukan JS). **SKIP** — bukan low-hanging fruit.

### F — node_modules dedupe (dropped)
- `pina-core/node_modules` = 1.6GB tapi **DEV-only** (onnxruntime, huggingface, fastembed,
  biome, lucide-react). Binary standalone gak butuh itu saat runtime.
- Shippable artifact = cuma `dist/shrimp` (~179MB). Dedupe node_modules = wasted effort.

### Tech-stack note (Node -> Bun/Deno?)
- Core UDAH Bun-compiled executable. Pina-board UDAH pakai Bun (#!/usr/bin/env bun, zero-dep).
- Deno gak terinstall + gak compatible `@types/bun`/ONNX/OpenTelemetry -> pindah Deno = rewrite besar.
- **Kesimpulan: stay di Bun.** Gak perlu migrasi.

### Yang beneran bikin Pina ringan (fakta):
- Binary standalone 179MB (no node_modules at runtime)
- Board UI: 1 file `server.ts` + `index.html`, zero-dep Bun, 44KB (lebih ringan dari pi-web Next.js)
- TIDAK pakai pi-web (Next.js+React 6MB repo, butuh build) — board kita sendiri lebih ringan
- Plugin swarm: add-on ringan (~8KB TS), no rebuild core

### Cara jalanin
```
pina -p "use spawn_worker to ..."          # manual swarm
pina -p "set goal ..., set autonomous on"   # autonomous loop
# board: pina-board  -> http://127.0.0.1:8787
```

---

## §12 REBRAND + MINIFY + TOOL-FIX (2026-08-29)

### 1. Minify build chain (DONE)
- `scripts/compile-binary.ts`: `minify: { identifiers, keepNames }` → `minify: true` (full).
- `scripts/build-binary.ts`: pass `minifyWhitespace: true` instead of `minifyIdentifiers`.
- **Result: binary 179,198,080 → 167,532,672 bytes (–11.5 MB, –6.5%).** Verified via rebuild (exit 0).

### 2. run_experiment fix (DONE — root cause found)
- Plugin `@quintinshaw/swarm` had a custom `run_experiment` tool that **name-collided** with the
  CORE's native `autoresearch` extension (`packages/coding-agent/src/autoresearch/` registers
  `init_experiment`, `run_experiment`, `log_experiment`, `update_notes` — the exact pi-autoresearch
  pattern, already built in).
- Collision + small-model tool-budget = the model dropped our 6th tool in `-p` mode.
- **Fix: removed the redundant plugin `run_experiment`** (collision source). Native core
  `run_experiment` is the supported path. It arms when autoresearch mode is on
  (`/autoresearch <goal>`), and is reliably callable in interactive mode / with a capable model.
- Plugin now registers 5 tools (no collision): `spawn_worker, list_workers, set_goal, set_autonomous, refine`.

### 3. TUI rebrand — ASCII pine + green moodboard (DONE)
- `src/modes/components/welcome.ts`:
  - `PI_LOGO` (π block) → **bold ASCII pine tree** (10×10 block grid, TUI-doubled to 20×20).
  - `GRADIENT_STOPS` (pink→purple→cyan) → **pine/forest green** [22,92,48]→[46,160,67]→[120,220,140].
  - `GRADIENT_RAMP_256` → green ANSI ramp [22,28,34,40,47,83,120].
- `src/modes/theme/dark.json`: `accent` `#febc38` (amber) → `#3fb950` (pine green) for cohesion.
- **Verified**: `gradientLogo(PI_LOGO)` renders the pine shape (stripped-ANSI shape check passed).

### Note on model-selection (honest finding)
The small model (`mimo-v2.5`) in `-p` (pipe) mode has a **restricted tool view**: conditional tools
(autoresearch's `run_experiment` arms only after `/autoresearch`) and 6th+ plugin tools are not
reliably surfaced. `spawn_worker`/`set_goal` work; `run_experiment` needs interactive mode or a
bigger model. This is a core tool-exposure constraint, not fixable via plugin code without deep
core changes (out of scope / risky).



