# Pina 🦐

> Small pina, big swarm.
> Tiny pi-based autonomous coding agent — kecil, cepat, ringan, no Docker, no GitHub dependency.

Pina = **Pina** (udang/krill: kecil, lincah, bergerombol/swarm) + **Pi** (base agent-nya).
Dia agent otonom kayak krill/claw (Claude Code) tapi di atas `pi` — ringan, cepat, dan jalan tanpa Docker.

---

## 1. Apa itu Pina?

Pina adalah **coding agent otonom** yang dibangun di atas **OMP (oh-my-pi)** —
fork dari Pi coding agent. Filosofinya: agent kecil yang bisa nyuruh banyak sub-agent
(swarm/krill) buat kerjaan besar, tapi sendiri tetap ringan dan tanpa beban infra.

Posisi di spektrum:
```
Claude Code (claw) ≈ OpenCode ≈ Pina  → coding agent otonom
                                      ▲
                          (Pina + Kanban + 5-agent pipeline + memory)
Hermes Agent → super-agent (coding + browser + cron + messaging + vision + computer_use)
```
Pina = OpenCode yang sudah dikasih otak Kanban + memory + research + evaluate.
Workflow-nya 60% mirip Hermes, tapi tool-surface-nya masih coding-agent (bukan super-agent).
Naik ke level Hermes via MCP ada di fase 2 (lihat ARCHITECTURE.md).

---

## 2. Bedah: Cheasee-Pi vs OMP (dari kode asli)

Keduanya di-clone ke `~/agents/` untuk riset.

### Cheasee-Pi (`~/agents/cheasee-pi`)
- Binary **Go** (`go.mod`, `cmd/cheasee-pi/`) yang membungkus pi.
- **HARDCODE dependency eksternal:**
  - **Docker**: `cmd/cheasee-pi/containers.go` + `embedded/docker/Dockerfile` (Debian 12-slim).
    `cheasee-pi start` = docker compose up → exec pi di container.
  - **GitHub OAuth** device-flow login (`github.go`, `cli/oauth`).
  - **GitHub Project v2 board** sebagai Kanban (`supervisor` extension: fetch issue,
    pindah card antar kolom, post comment, bikin PR).
- Punya 17 extension TS (caveman, ponytail, supervisor, agent-harness, context-info,
  lsp-auditor, ripgrep, structural-analyzer, ask-user, dll) import
  `@earendil-works/pi-coding-agent`.
- `APPEND_SYSTEM.md` = global instructions (tool-routing matrix, prohibited ops, execution protocols).

### OMP / oh-my-pi (`~/agents/omp-base`)
- Fork pi sendiri (**Bun/TypeScript**), ~240MB.
- **SUDAH punya pengganti Docker & GitHub bawaan:**
  - `crates/pi-iso` = **isolasi native** (btrfs snapshot Linux, APFS clonefile macOS, overlayfs)
    — sandbox tanpa container daemon.
  - `packages/mnemopi` = **memory** bawaan.
  - `--plan` = **plan mode** bawaan.
  - subagent / job-manager bawaan.
  - hashline edits bawaan.
- Extension API SAMA (`api.registerTool`, `pi.on`) → extension Cheasee bisa diport 1:1
  (ganti import ke `@oh-my-pi/pi-coding-agent`).

**Kesimpulan:** Cheasee bagus tapi bergantung Docker + GitHub. Untuk "no Docker, no GitHub"
kita pakai OMP sebagai base, lalu tambah capability dari pi.dev (lebih terawat dari
port manual Cheasee).

---

## 3. Docker & GitHub → diganti apa?

| Dependency Cheasee | Pengganti di Pina |
|---|---|
| Docker (container) | `crates/pi-iso` (OMP native) atau `bwrap` (bubblewrap, lihat `@trim21/personal-pi-extensions`). No daemon. |
| GitHub OAuth login | API key lokal (OMP support 60+ provider via key/env). |
| GitHub Project (Kanban) | Board lokal (SQLite/markdown) atau package `pi-task` / `pi-goal-list-loop-audit` dari pi.dev. |
| Git worktree sandbox | `pi-dynamic-workflows` (git-worktree isolation bawaan) atau `git worktree` native. |

Dependency tunggal yang dilepas: **Docker + GitHub**. Sisanya (git, ripgrep, tsc, LSP)
adalah tool lokal standar — tidak masalah.

---

## 4. Quick start (rencana, belum dieksekusi)

```bash
# 1. Fork/clone OMP sebagai base
git clone https://github.com/can1357/oh-my-pi ~/Documents/pina-ai/pina-core
cd ~/Documents/pina-ai/pina-core
bun install

# 2. Install extension pi.dev (lihat STACK.md)
pi install npm:@mjasnikovs/pi-task
pi install npm:@quintinshaw/pi-dynamic-workflows
pi install npm:pi-hermes-memory
pi install npm:pi-web-access
pi install npm:context-mode
pi install npm:@gotgenes/pi-permission-system
pi install npm:cc-safety-net

# 3. Tulis adapter board lokal (SQLite) yg sambungin pi-task ke lifecycle
# 4. Build + smoke-test
```

---

## 5. Struktur repo ini

```
~/Documents/pina-ai/
├── README.md              # ini
├── ARCHITECTURE.md        # desain lengkap + fase 2 (MCP)
├── STACK.md               # 12-15 package pi.dev final + alasan pilih
├── CRAWL_REPORT.md        # metodologi crawl + 14 kategori
├── data/
│   ├── pi_packages.json          # 7665 raw hasil crawl
│   ├── pi_packages_clean.json    # 5373 unik (bersih)
│   ├── pi_packages_by_cat.json   # 14 kategori, top-25 tiap kategori
│   ├── SUMMARY_FOR_TG.md         # ringkasan yg dikirim ke Telegram
│   ├── send_tg.sh                # script kirim ke TG (token dari ~/aeon/.env)
│   ├── crawl_pi_packages.py      # crawler
│   └── analyze_packages.py       # klasifikasi kategori
├── research/
│   ├── GH_ALTERNATIVES.md        # 8 repo GitHub ref
│   ├── GH_BROAD.md               # 233 repo dari 26 query GitHub search
│   ├── GH_SHRIMP.md              # 3 repo bernama "pina" (mcp-pina-task-manager, PinaCrab, pina-oracle)
│   ├── GH_SHRIMP_NAMES.md        # 208 repo dari crawl nama pina/krill/crab (krillclaw, crabfleet, crabml, CrabTrap, dll)
│   ├── crawl_pina_names.py     # crawler nama-based
│   ├── fetch_repos.sh            # crawler 8 repo
│   ├── extract_readmes.py        # extractor README 8 repo
│   ├── broad_search.py           # crawler 26 query
│   ├── fetch_pina.sh           # crawler 3 pina-repo
│   ├── extract_pina.py         # extractor README 3 pina-repo
│   ├── gh_alternatives/          # JSON mentah 8 repo + _combined.json
│   ├── gh_pina/                # JSON mentah 3 pina-repo + _combined.json
│   └── gh_broad.json             # 233 repo mentah
└── (data/ sudah ada di atas)
```

---

## 6. Status

- [x] Riset Cheasee-Pi vs OMP (bedah kode)
- [x] Crawl pi.dev/packages (5373 package, 14 kategori)
- [x] Keputusan stack (base OMP + package pi.dev)
- [x] Dokumentasi + pindah hasil crawl ke sini
- [x] Tambah stack anti-slop + UI/UX (`@bacnh85/pi-ux`, `@blackbelt-technology/anti-slop-frontend`, dll)
- [x] Crawl GitHub pina/krill/crab (208 repo) + 3 pina-named repo
- [x] Tulis DESIGN.md (kontrak anti-slop UI/UX) + AGENTS.md (instruksi operasional agent)
- [ ] BUILD: branch `ahmad-agent`, install package, adapter board, build+smoke-test
- [ ] ARSITEKTUR fase 2: MCP tools (browser/cron/messaging) → level Hermes

Lihat `STACK.md` untuk daftar package final, `ARCHITECTURE.md` untuk desain.
