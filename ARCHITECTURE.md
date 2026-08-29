# Pina — Architecture

> Desain teknis agent otonom berbasis OMP, tanpa Docker & GitHub.

## 1. Prinsip desain

1. **Kecil & ringan** — base OMP (single binary Bun/TS), no container, no cloud-lock.
2. **Autonomous** — pipeline research → plan → task → working → evaluate → done, berjalan tanpa intervensi.
3. **Paham konteks** — memory persisten (mnemopi / pi-hermes-memory) + context folding.
4. **Kanban** — board lokal (SQLite) sebagai single source of truth, bukan GitHub Project.
5. **Think-before-do** — plan mode wajib sebelum eksekusi; guardrails blokir destructive.
6. **Clean code** — token-saving (context-mode, caveman-style) + LSP/audit gates.
7. **Hemat token** — hashline edits, context folding, prompt terpusat.

## 2. Runtime & sandbox

```
┌─────────────────────────────────────────────┐
│  Pina (OMP fork)  — main agent process    │
│  - plan mode (--plan)                         │
│  - subagent orchestration                     │
│  - memory (mnemopi + pi-hermes-memory)        │
└───────────────┬─────────────────────────────┘
                │ spawns
   ┌────────────┴───────────────┐
   │  Sub-agents (per task)      │
   │  - dijalankan di sandbox:   │
   │    • pi-iso (btrfs/APFS)    │  ← pengganti Docker
   │    • atau bwrap per-issue   │
   │  - git worktree terisolasi  │
   └────────────────────────────┘
```

**Sandbox = pi-iso (native) atau bwrap.** Tidak ada Docker Engine, tidak ada image build.
Isolasi filesystem O(1) (btrfs snapshot / APFS clonefile), cleanup = recursive remove.

## 3. Task lifecycle (Kanban)

Board disimpan di `~/Documents/pina-ai/board.sqlite` (atau `.pina/board.json`):

```
TODO → RESEARCHING → PLANNING → WORKING → EVALUATING → DONE
                                    │              │
                                    └── reject ────┘ (max retries)
```

- `pi-task` (`@mjasnikovs/pi-task`) = motor deterministik: /task pipeline dengan
  verify/enforce gates + crash-safe state.
- `pi-goal-list-loop-audit` = auditor loop: re-verify tiap completion dengan raw evidence.
- Setiap transisi status = 1 baris di board (audit trail).

## 4. Multi-agent pipeline (pengganti supervisor Cheasee)

`pi-dynamic-workflows` (`@quintinshaw/pi-dynamic-workflows`):
- Fan task ke 100s subagents, model routing, token/cost accounting, resume.
- **Git-worktree isolation** bawaan (pengganti worktree-sandbox Cheasee).
- `/deep-research` bawaan (pengganti web-crawl Cheasee).

Pipeline 5-peran (Researcher → Architect → TestDesigner → Developer → Auditor)
didefinisikan sebagai agent-markdown di `.pina/agents/`, diorkestrasi oleh
dynamic-workflows, status disinkron ke board lokal.

## 5. Memory

- **mnemopi** (OMP bawaan): hindsight memory, recall apa yang berhasil/gagal.
- **pi-hermes-memory** (pi.dev, ported dari Hermes): persistent memory + session search
  + secret scanning, SQLite FTS5, token-aware, auto-consolidation.
- Dua lapis: operasional (mnemopi, sesi) + jangka-panjang (pi-hermes-memory, lintas sesi).

## 6. Tool surface (fase 1 — coding agent)

| Kebutuhan | Package |
|---|---|
| Kanban/Task | `@mjasnikovs/pi-task`, `pi-goal-list-loop-audit` |
| Subagent | `@quintinshaw/pi-dynamic-workflows` |
| Memory | `pi-hermes-memory`, `mnemopi` |
| Research | `pi-web-access` (+ /deep-research) |
| Sandbox | `crates/pi-iso` / `@trim21/personal-pi-extensions` (bwrap) |
| Token | `context-mode`, `pi-hashline-edit-pro` |
| Safety | `@gotgenes/pi-permission-system`, `cc-safety-net` |
| Plan | `--plan` OMP / `@narumitw/pi-plan-mode` |
| Anti-slop / UI-UX | `@blackbelt-technology/anti-slop-frontend`, `@bacnh85/pi-ux`, `@firstpick/pi-skill-unslop` |
| Code quality | `@firstpick/pi-skill-code-quality`, `@fyeeme/pi-review`, `@estebanforge/pi-ts-review` |

### 6a. Anti-AI-Slop & UI/UX discipline (wajib kalau bikin frontend)

Supaya Pina tidak menghasilkan AI slop (centered card, gradient milky, emoji
decor, spacing tidak konsisten), pasang guardrail desain:

- **`@bacnh85/pi-ux`** — anchor lintable `DESIGN.md` di repo, jalankan deterministic
  design review tiap selesai bikin UI. Ini kontrak visual (palette, spacing, typography).
- **`@blackbelt-technology/anti-slop-frontend`** — checklist mekanis & terukur untuk
  nangkap pola slop frontend.
- **`@firstpick/pi-skill-unslop`** — cegah slop di prose (README, docs, copy).
- **`@firstpick/pi-skill-code-quality`** + **`@fyeeme/pi-review`** — self-review /
  simplify otomatis sebelum task di-mark DONE.
- **`@estebanforge/pi-ts-review`** — kalau stack frontend TS/React, grade diff terhadap
  TS+React rubric.

Alur: working → `@fyeeme/pi-review` (simplify) → `@bacnh85/pi-ux` (design review) →
baru evaluate → done.

## 7. Fase 2 — naik ke level Hermes (optional, via MCP)

Supaya Pina jadi super-agent (bukan cuma coding agent), wiring tool eksternal
lewat `pi-mcp-adapter` (MCP Model Context Protocol adapter untuk pi):

- **Browser** → camofox / playwright MCP
- **Cron / scheduled** → systemd / cron MCP
- **Messaging** → telegram MCP (atau bot @Hi_aeon_bot yg sudah ada)
- **Computer use** → CDP/MCP (desktop control, screenshot, mouse)
- **Vision** → vision_analyze MCP

Catatan: fase 2 menambah bobot — bertentangan dikit dengan "kecil, ringan".
Eksekusi fase 1 dulu, fase 2 kalau butuh.

## 8. Struktur folder target (setelah build)

```
~/Documents/pina-ai/
├── pina-core/          # fork OMP (git submodule atau fork)
├── extensions/            # pi.dev packages ter-install
├── .pina/
│   ├── agents/            # definisi peran (Researcher, Architect, ...)
│   ├── board.json         # Kanban state
│   └── settings.json      # config (provider, model, token budget)
├── board.sqlite           # (opsi) board persisten
└── docs/                  # README, ARCHITECTURE, STACK, CRAWL_REPORT
```

## 9. Keamanan & guardrails

- Destructive commands (rm -rf, dd, mkfs, git push --force) → diblokir `cc-safety-net`
  + `@gotgenes/pi-permission-system`.
- Secret file access → `pi-hermes-memory` secret scanning.
- Main branch lock: agent tidak commit langsung ke main (worktree + PR, merge by user).
- Error recovery: stop & change approach, jangan retry argumen sama (dari APPEND_SYSTEM Cheasee).
