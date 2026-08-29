# Crawl Report — pi.dev/packages

**Tanggal:** 2026-08-29
**Sumber:** https://pi.dev/packages
**Tujuan:** Cari extension/package pi.dev yang menunjang Shrimpi (agent otonom, no Docker, no GitHub).

## Metodologi

1. Halaman paginasi: `?page=N`, 50 item/halaman, total 5373 package → 108 halaman.
2. Crawler: `data/crawl_pi_packages.py` (Python, urllib, strip HTML → extract
   name / desc / author / popularity / age / type / install command).
3. Cleaning: drop junk (footer "Package Catalog", `npm:<package>` placeholder),
   dedupe by install command → **5373 unik** (`data/pi_packages_clean.json`).
4. Klasifikasi: 14 kategori via regex keyword di (name+desc+type).
   Script: `data/analyze_packages.py`. Output: `data/pi_packages_by_cat.json`
   (top-25 per kategori).

## Jumlah per kategori (dari 5373)

| Kategori | Jumlah | Relevansi Shrimpi |
|---|---|---|
| subagent | 646 | Inti (orchestration) |
| token_ctx | 468 | Hemat token |
| observability | 371 | Tracing/metrics |
| voice_ui | 306 | TUI/chat/telegram |
| safety | 301 | Guardrails |
| research | 293 | Web/research |
| git | 336 | Version control |
| memory | 243 | Memory |
| autonomous_loop | 213 | Loop/background |
| sandbox | 182 | Isolasi (ganti Docker) |
| lsp_quality | 183 | Code quality |
| kanban_task | 152 | Kanban/board |
| mcp | 180 | Fase 2 (Hermes-level) |
| plan | 95 | Plan mode |

## Temuan kunci

- **Kanban/Task**: `@mjasnikovs/pi-task` (deterministik, verify gates), `pi-goal-list-loop-audit`
  (auditor loop), `@juicesharp/rpiv-todo` (overlay todo).
- **Subagent**: `@quintinshaw/pi-dynamic-workflows` (git-worktree isolation, /deep-research),
  `pi-subagents`, `@tintinweb/pi-subagents`.
- **Memory**: `pi-hermes-memory` (ported dari Hermes!), `pi-memory`, `@remnic/plugin-pi`.
- **Research**: `pi-web-access`, `@companion-ai/feynman`, `pi-web-search`.
- **Sandbox (ganti Docker)**: `@trim21/personal-pi-extensions` (bwrap), `pi-landstrip`,
  `pi-crew` (worktree). OMP juga punya `pi-iso` native.
- **Token**: `context-mode` (save 98%), `pi-hashline-edit-pro`, `pi-rtk-optimizer`.
- **Safety**: `@gotgenes/pi-permission-system`, `cc-safety-net`, `@piagent/platform`.
- **MCP (fase 2)**: `pi-mcp-adapter` (hubungkan browser/cron/telegram ke level Hermes).

## Rekomendasi akhir (lihat STACK.md)

Base OMP + 12 package pi.dev: pi-task, pi-goal-list-loop-audit, pi-dynamic-workflows,
pi-hermes-memory, pi-web-access, context-mode, pi-hashline-edit-pro,
@gotgenes/pi-permission-system, cc-safety-net, @trim21/personal-pi-extensions,
(+ opsional pi-plan-mode, pi-mcp-adapter).

## File hasil

- `data/pi_packages.json` — 7665 raw
- `data/pi_packages_clean.json` — 5373 unik
- `data/pi_packages_by_cat.json` — 14 kategori, top-25
- `data/crawl_pi_packages.py` — crawler
- `data/analyze_packages.py` — klasifikasi
