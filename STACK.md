# Pina — Stack (package pi.dev final)

> 12 package inti dari crawl pi.dev/packages (5373 package, diklasifikasi 14 kategori).
> Dipilih untuk kriteria: kecil, ringan, autonomous, no Docker, no GitHub.

## Task engine (rekomendasi — includes pina-named repo)

| # | Package / Repo | Sumber | Fungsi | Alasan |
|---|---|---|---|---|
| 1 | `mcp-pina-task-manager` | GitHub cjo4m06 (2.1k⭐) | MCP task tool: chain-of-thought + reflection + dependency DAG + iterative refinement + cross-session context | **PALING cocok buat Kanban Pina.** Dipasang sbg MCP server, dipanggil OMP via pi-mcp-adapter. No Docker/no GitHub. |
| 2 | `@mjasnikovs/pi-task` | pi.dev | Motor task lifecycle deterministik (verify/enforce gates) | Fallback/determanistik kalau butuh crash-safe pipeline. |
| 3 | `pi-goal-list-loop-audit` | pi.dev | Auditor loop: re-verify tiap completion dgn raw evidence | Tahap "evaluate/done" otonom. |
| 3 | `@quintinshaw/pi-dynamic-workflows` | subagent | Multi-agent orchestration + git-worktree isolation + /deep-research | Fan ke 100s subagents, token accounting, resume. Ganti supervisor 5-agent Cheasee + worktree-sandbox sekaligus. |
| 4 | `pi-hermes-memory` | memory | Persistent memory + session search + secret scan | **Ported dari Hermes Agent!** SQLite FTS5, token-aware, 732 tests. Engine memory kita sendiri. |
| 5 | `pi-web-access` | research | Web search, URL fetch, PDF, YouTube | Ganti web-crawl Cheasee. Pluggable providers (Tavily, Firecrawl, Brave, dll). |

## Pendukung (direkomendasikan)

| # | Package | Kategori | Fungsi | Alasan |
|---|---|---|---|---|
| 6 | `context-mode` | token_ctx | Save 98% context window, FTS5 KB, sandboxed exec | Hemat token ekstrem; bisa dipakai barebone di luar pi juga. |
| 7 | `pi-hashline-edit-pro` | token_ctx | Hash-anchored read/replace/insert, undo persist | Edit presisi stabil (OMP udah ada hashline, ini versi pro). |
| 8 | `@gotgenes/pi-permission-system` | safety | Permission enforcement | Guardrails mirip prohibited_ops Cheasee. |
| 9 | `cc-safety-net` | safety | Block destructive commands + secret access | Lapisan ke-2 keamanan (rm -rf, dll). |
| 10 | `@trim21/personal-pi-extensions` | sandbox | bwrap sandbox + workspace guard | Pengganti Docker per-issue (fallback dari pi-iso). |

## Anti-AI-Slop & UI/UX Design (WAJIB kalau bikin frontend/UI)

| # | Package | Kategori | Fungsi | Alasan |
|---|---|---|---|---|
| 11 | `@blackbelt-technology/anti-slop-frontend` | anti_slop | Mechanical, countable anti-slop checklist untuk AI-generated frontend | Nangkap pola slop frontend (centered card, gradient milky, emoji decor, dll) secara terukur. |
| 12 | `@bacnh85/pi-ux` | design_uiux | Anti-slop UI/UX design discipline — anchor lintable `DESIGN.md`, jalankan deterministic design review | Ini yang kamu mau: UI/UX bagus + ga slop, pakai DESIGN.md sebagai kontrak. |
| 13 | `@firstpick/pi-skill-unslop` | anti_slop | Skill tiap nulis/edit prose untuk manusia (README, docs, copy) | Cegah slop di tulisan, bukan cuma kode. |
| 14 | `@firstpick/pi-skill-code-quality` | review | Code review, lint/format setup, maintainability check | Gate kualitas kode sebelum done. |
| 15 | `@fyeeme/pi-review` | review | `/code-review` + `/code-simplify` commands + gentler refactor | Self-review otomatis tiap selesai task. |
| 16 | `@estebanforge/pi-ts-review` | review | TypeScript/React diff graded against TS+React rubric | Khusus kalau stack frontend TS/React. |

## Opsional

| # | Package | Kategori | Kapan dipakai |
|---|---|---|---|
| 17 | `@narumitw/pi-plan-mode` | plan | Kalau mau plan mode ala Codex (read-only) selain `--plan` OMP. |
| 18 | `@companion-ai/feynman` | research | Research-first CLI terpisah kalau butuh deep research mandiri. |
| 19 | `pi-background-tasks` | autonomous_loop | Durable background shell kalau perlu task jalan di luar session. |
| 20 | `pi-mcp-adapter` | mcp | Fase 2: wiring tool eksternal (browser/cron/telegram) ke level Hermes. |

## Yang SENGAJA TIDAK dipakai

- **Cheasee-Pi langsung** — hardcode Docker + GitHub. Kita ambil konsepnya, bukan binarinya.
- **GitHub Project / GitHub OAuth** — diganti board lokal + API key lokal.
- **Docker** — diganti pi-iso / bwrap.

## Cara install

```bash
cd ~/Documents/pina-ai/pina-core
pi install npm:@mjasnikovs/pi-task
pi install npm:pi-goal-list-loop-audit
pi install npm:@quintinshaw/pi-dynamic-workflows
pi install npm:pi-hermes-memory
pi install npm:pi-web-access
pi install npm:context-mode
pi install npm:pi-hashline-edit-pro
pi install npm:@gotgenes/pi-permission-system
pi install npm:cc-safety-net
pi install npm:@trim21/personal-pi-extensions
# opsional:
pi install npm:@narumitw/pi-plan-mode
pi install npm:pi-mcp-adapter
```

> Catatan: OMP punya command `pi install` sendiri (bukan `npm i`). Perintah di atas
> asumsi OMP kompatibel dengan registry pi.dev. Kalau OMP pakai mekanisme berbeda,
> install via `bun add` / symlink ke `~/.pi/extensions/`.
