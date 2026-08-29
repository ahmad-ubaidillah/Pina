# 🍍 Pina — Pi Native Agent

> Coding agent yang **lebih kecil, lebih ringan, lebih cepat** + guardrail + pipeline Kanban multi-agent.
> Fork dari [OMP / oh-my-pi](https://github.com/oh-my-pi) yang dilanjutkan dari Hermes, dengan teknik hemat-token di-port sebagai extension, [mcp-shrimp-task-manager](https://github.com/0xshellming/mcp-shrimp-task-manager) dicolok sebagai plugin MCP, dan **OMNI** dibundle sebagai token-saver.

---

## Kenapa Pina?

- **Hemat token** — OMNI (Apache 2.0) dibundle *di dalam* Pina, jadi gak perlu `omni init --pi`. Cross-turn ledger memotong konteks berulang ("folded 99%" terbukti di sesi nyata).
- **Guardrail** — task manager + kanban states (TODO → RESEARCHING → PLANNING → WORKING → EVALUATING → DONE) + undo/transition log.
- **Multi-agent** — swarm plugin bawaan: spawn worker paralel, autonomous loop, goal-driven.
- **Visual Kanban** — board UI ringan (1 file `server.ts` + `index.html`, zero-dep Bun, 44KB). Lebih ringan dari pi-web (Next.js + React).
- **Single binary** — core udah standalone executable (Bun-compile). Gak butuh `node_modules` saat runtime.

---

## Struktur

```
pina/
├── pina-core/            # fork OMP (nested git, di-ignore dari repo ini)
├── pina-board/           # 🍍 Kanban board UI (Bun + HTML, zero-dep)
│   ├── server.ts
│   ├── index.html
│   ├── pina-board.sh
│   └── SWARM.md
├── .pina/                # config dir (symlink ~/.omp) — swarm-state.json, experiments.json
├── pina-install.sh       # installer (bikin symlink pina + back-compat shrimp)
├── BUILD_REPORT.md       # laporan build lengkap + §11 improvements
├── AGENTS.md
└── README.md
```

Plugin swarm: `~/.omp/plugins/node_modules/@quintinshaw/swarm/index.ts`
(tools: `spawn_worker`, `list_workers`, `set_goal`, `set_autonomous`, `refine`, `run_experiment`)

---

## Install

```bash
# 1. clone core (OMP fork) ke ~/Documents/pina/pina-core  (lihat pina-install.sh)
# 2. symlink binary pina (back-compat: shrimp tetap jalan)
bash pina-install.sh

# 3. pastikan bun ada di PATH
export PATH="$HOME/.bun/bin:$PATH"
```

Binary:
- `pina`  → coding agent (Pi Native Agent)
- `pina-board` → jalanin Kanban UI di http://127.0.0.1:8787
- `pina-omni-clean` → bersihin cache OMNI

---

## Cara pakai

### Manual / one-shot
```bash
pina -p "tulis fungsi quicksort di sort.ts"
```

### Swarm — spawn worker paralel
```bash
pina -p "use spawn_worker to build the login form"
pina -p "use spawn_worker to build the signup form"
```

### Autonomous loop
```bash
pina -p "set goal to 'ship the auth module'"
pina -p "set autonomous on"
# Pina akan spawn worker paralel sampai goal kelar, lalu clear goal
```

### Board UI (Kanban + live OMNI + Launch + Spawn + Undo)
```bash
pina-board
# buka http://127.0.0.1:8787
```
Fitur board:
- 6-state kanban (drag/update via API)
- **Live OMNI** — lihat session status + token savings real-time
- **Launch Agent** — kirim prompt ke agent dari UI
- **Spawn worker** — tombol per card → swarm
- **Undo** — rollback transisi terakhir
- **Swarm panel** — set goal / toggle autonomous / run refine

---

## Refine / Self-improve

`refine` tool mencerna OMNI `engram` (subtask selesai) + `patterns` (error berulang) jadi lesson lokal di `~/.pina/swarm-state.json`.

`run_experiment` tool (pola dari `davebcn87/pi-autoresearch`):
```bash
pina -p "use run_experiment to run 'npm test' and capture METRIC passed=N"
# hasil: keep/discard + metric tersimpan di ~/.pina/experiments.json
```

---

## Tech stack

- **Bun** (TypeScript) — core udah Bun-compiled standalone. Board UI juga Bun, zero-dep.
- **OMNI** (Apache 2.0) — token-saver, dibundle di dalam Pina.
- **mcp-shrimp-task-manager** — guardrail / task manager (plugin MCP).
- **@quintinshaw/swarm** — plugin swarm (runtime, gak rebuild core).
- **@quintinshaw/pi-dynamic-workflows** — engine swarm (WorkflowAgent).

Tidak dipakai: pi-web (Next.js, terlalu berat), RustClaw/prime-agent sebagai core (cuma dipelajari polanya).

---

## Improvements (2026-08-29) — lihat BUILD_REPORT §11

| Item | Status | Catatan |
|------|--------|---------|
| B — Extension cache hash-keyed | ✅ | auto-invalid saat edit, startup tetap cepat |
| H — run_experiment tool | ✅ | port pola pi-autoresearch, ~60 line |
| G — Single binary | ✅ | udah standalone (179MB, no node_modules at runtime) |
| A — Minify | ⏭️ | butuh patch build-chain, gain kecil (native blob dominan) |
| F — node_modules dedupe | ❌ | dev-only, gak di-shipping |
| Tech-stack migrate Node→Deno | ❌ | udah Bun, Deno gak compatible |

---

## Rujukan (dipelajari, tidak di-fork)

- `agegr/pi-web` — web UI session (kita bikin board sendiri yang lebih ringan)
- `davebcn87/pi-autoresearch` — autonomous experiment loop (pola `run_experiment`)
- `prime-agent` — RLM + Continual Harness (capai via pi-dynamic-workflows)
- `RustyClaw` — swarm + security (port pola, gak fork)

---

## License

Rujukan utama: **OMP / oh-my-pi** + **Cheasee-Pi**. OMNI (token-saver) berlisensi **Apache 2.0**.
Config mesin user **tidak** dimasukkan ke repo ini (local-only).
