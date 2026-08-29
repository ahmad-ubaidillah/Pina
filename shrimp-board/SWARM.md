# Shrimp Swarm — Autonomous + Swarm Plugin

Plugin runtime (tanpa rebuild binary 186MB) yang bikin Shrimp jadi autonomous agent
+ swarm orchestrator. Dibangun di atas `pi-dynamic-workflows` (WorkflowAgent) yang
sudah terinstall di Shrimp.

## Install (sudah dilakukan)
- Plugin: `~/.shrimp/plugins/node_modules/@shrimp/swarm/` (symlink ke `~/.omp/plugins/...`)
- Terdaftar di `~/.omp/plugins/package.json` + `omp-plugins.lock.json` (enabled:true)
- Tidak perlu rebuild `dist/shrimp`.

## Tools
| Tool | Fungsi |
|------|--------|
| `spawn_worker({prompt, model?, cwd?, label?})` | Spawn 1 child agent (isolated cwd/worktree). Bounded recursion: worker tdk bisa spawn worker lain. |
| `list_workers()` | List worker aktif. |

## Commands
| Command | Fungsi |
|---------|--------|
| `/autonomous [on|off|budget <n>]` | Toggle autonomous loop mode + set turn budget. |
| `/goal <text>` (atau `/goal clear`) | Set/clear persistent objective (disimpan `~/.shrimp/swarm-state.json`). |

## Cara kerja
- `spawn_worker` -> `new WorkflowAgent({cwd, modelRegistry}).run({prompt})`.
  Child jalan di `cwd` terisolasi (git worktree saat disediakan) -> aman, gak sentuh main.
- Recursion guard: `DEFAULT_EXCLUDED_SUBAGENT_TOOLS` dari pi-dynamic-workflows
  (worker gak punya `spawn_worker` -> fan-out 1 level, bounded).
- `/goal` + `/autonomous` diinjeksi ke system prompt tiap turn via `pi.hooks.onSystemPrompt`.
  Shrimp akan decompose goal -> spawn_worker tiap subtask parallel -> berhenti saat goal met
  atau budget habis.

## Bukti (2026-08-29)
- Spawn 1 worker: `/tmp/swarm-test.txt` = "shrimp swarm works" (verified by subagent).
- Isolation: `/tmp/swarm-isolate/proof.txt` = "isolated worker ok" (cwd beda).
- Full autonomous: goal 2 file -> 2 worker parallel ~18s -> "Goal achieved".

## Relevansi dgn riset (prime-agent / RustyClaw / ClawCodex)
- `prime-agent` (fork pi, sama base Shrimp) punya `rlm()` subagent + `/autonomous`.
  Kita capai efek sama via `pi-dynamic-workflows` (tanpa Python REPL kernel).
- `RustyClaw` punya swarm native (Rust). Kita pakai TS/pi (PNP, rujukan OMP/Cheasee).
- `ClawCodex` (Python) punya agent loop + swarm. Kita di TS, no language switch.

## File
- `dist/index.js` — plugin entry (`extension(pi)` default export)
- `package.json` — pi plugin manifest
- State: `~/.shrimp/swarm-state.json`
