# 🍍 Pina — Pi Native Agent

> A coding agent that is **smaller, lighter, faster** — with guardrails, a multi-agent
> Kanban pipeline, a bundled web stack, and a skill store.
>
> A fork of [OMP / oh-my-pi](https://github.com/oh-my-pi) continued from Hermes, with
> token-saving techniques ported as an extension, [mcp-shrimp-task-manager](https://github.com/0xshellming/mcp-shrimp-task-manager)
> plugged in as an MCP plugin, and **OMNI** bundled as the token-saver.

---

## Why Pina?

- **Token-efficient** — OMNI (Apache-2.0) is bundled *inside* Pina, so no `omni init --pi`.
  The cross-turn ledger compacts repeated context ("folded 99%" proven in real sessions).
- **Guardrails** — task manager + Kanban states (TODO → RESEARCHING → PLANNING → WORKING
  → EVALUATING → DONE) + undo / transition log.
- **Multi-agent** — built-in swarm plugin: spawn parallel workers, autonomous loop, goal-driven.
- **Web stack bundled** — `pina-web` (Rust/rust-headless-chrome fetch + crawl engine) +
  `spider-rs` (crawler) + native `web_search` + reusable Browser Actions + optional **bsk**
  (drive your real logged-in Chrome for form/login tasks). No Firecrawl, no cloud.
- **Skill store** — toggle skills on/off from the board UI (web-scrape, crawl, pr-review, …).
- **Visual Kanban** — a lightweight board UI (1 `server.ts` + `index.html`, zero-dep Bun).
- **Single binary** — core is a Bun-compiled standalone executable. No `node_modules` at runtime.

---

## Install (one command)

```bash
curl -fsSL https://raw.githubusercontent.com/ahmad-ubaidillah/Pina/main/install.sh | bash
```

This downloads the prebuilt bundle for your OS/arch, extracts to `~/.pina/dist`,
symlinks binaries to `~/.local/bin`, copies skills + browser-actions + the swarm plugin,
and wraps `pina` so plugins load automatically.

After install:

```bash
pina --help
pina-board            # Kanban UI at http://127.0.0.1:8787
```

> Requires `bun` on PATH (for the board UI). The agent binary itself is standalone.

### What gets installed

| Binary | Purpose |
|--------|---------|
| `pina` | the coding agent (Pi Native Agent) |
| `omni` | token-saver (bundled) |
| `spider` | crawler (spider-rs, MIT) |
| `pina-web` | fetch + crawl engine (Rust / rust-headless-chrome, MIT) |
| `bsk` | optional real-browser driver (Tencent BrowserSkill, for logged-in tasks) |
| `pina-board` | Kanban UI server |

---

## Usage

### One-shot
```bash
pina -p "write a quicksort function in sort.ts"
```

### Swarm — parallel workers
```bash
pina -p "use spawn_worker to build the login form"
pina -p "use spawn_worker to build the signup form"
```

### Autonomous loop
```bash
pina -p "set goal to 'ship the auth module'"
pina -p "set autonomous on"
# Pina spawns parallel workers until the goal is met, then clears it
```

### Board UI (Kanban + skills + swarm)
```bash
pina-board
# open http://127.0.0.1:8787
```
Features: 6-state Kanban, live OMNI status, Launch Agent, Spawn Worker per card,
Undo, Swarm panel (goal / autonomous / refine), and a **Skills** tab to toggle the
skill store.

---

## Web stack

Pina ships a lightweight, local-first web layer (no third-party crawl service). You
**don't pick a backend** — just tell Pina what you want and it routes automatically.

Use the **`web`** tool (or just describe it in chat):

```bash
pina -p "fill the login form on example.com"
pina -p "research AI agent tools on GitHub"
pina -p "open https://example.com and summarize it"
```

Routing (automatic):

| You say… | Pina uses | Why |
|----------|-----------|-----|
| "open", "read", "learn", "fetch <url>", "summarize <site>" | **pina-web** (Rust / rust-headless-chrome) | single page + JS rendering |
| "research", "crawl", "all pages on <site>" | **spider-rs** (crawler) | many pages / site-wide |
| "fill form", "login", "click in chrome" | **BrowserSkill** (real logged-in browser) | needs auth / DOM clicks |
| anything else | native **web_search** | lookup |

Under the hood: **pina-web** (Rust + [rust-headless-chrome](https://github.com/rust-headless-chrome/rust-headless-chrome), MIT)
for fetch/crawl, **spider-rs** (MIT) for crawling, native `web_search`, and reusable
**Browser Actions** (`~/.pina/browser-actions/*.js`). No Firecrawl, no cloud.

> `obscura` was removed — `pina-web` replaces it (lighter, pure-Rust, renders SPA/search
> that obscura could not).

### Real-browser backend (bsk) — install the extension

`bsk` (Tencent BrowserSkill) lets Pina drive **your real, logged-in Chrome/Edge** for
form-filling, login, and any task that needs your cookies/session. It is optional and
off by default. To enable it:

**1. Install the browser extension**

- **Chrome / Chromium:** <https://chromewebstore.google.com/detail/hhcmgoofomhgciiibhipgmgkgnoenaoi>
- **Edge:** <https://microsoftedge.microsoft.com/addons/detail/browserskill/jjgdbccjgkndkfobjcomodlmnehhjpic>

**2. Connect it**

Open the extension popup once and click **Connect**. The `bsk` daemon (installed by
`install.sh`) starts automatically and shows `1 browser(s) connected`. Verify:

```bash
bsk status          # browsers connected: 1
bsk doctor          # extension connected: ok
```

**3. Use it**

Any task that mentions a form, login, or "use my browser" routes to bsk automatically:

```bash
pina -p "fill the login form on app.qase.io and open the dashboard"
```

> Without bsk, those tasks fall back to `pina-web` (headless) — which works for public
> pages but cannot use your login session.

---

## Skill store

Skills live in `pina-skills/` (each folder = one `SKILL.md`). The board UI lists them
with an on/off toggle, persisted to `~/.pina/skills-enabled.json`. Disabled skills are
rejected by the `use_skill` tool.

Starter skills: `web-scrape`, `crawl`, `pr-review`, `issue-triage`, `changelog-gen`,
`secret-scan`, `web-research`.

Add a skill: drop a folder with `SKILL.md` into `pina-skills/` and add an entry to
`pina-skills/index.json`.

---

## Architecture

```
pina/
├── pina-core/            # OMP fork (nested git, ignored from this repo)
├── pina-board/           # Kanban board UI (Bun + HTML, zero-dep)
│   ├── server.ts
│   └── index.html
├── pina-skills/          # skill store (SKILL.md per skill)
├── browser-actions/      # reusable .js browser scripts
├── install.sh            # one-command installer (downloads release)
├── pina-install.sh       # dev installer (symlinks from pina-core)
└── README.md
```

The swarm plugin (`@quintinshaw/swarm`) is bundled into the release and loaded via
`--plugin-dir ~/.pina/plugins` — it does **not** require the full OMP install.

---

## Tech stack

- **Bun** (TypeScript) — core is Bun-compiled standalone; board UI is zero-dep Bun.
- **OMNI** (Apache-2.0) — token-saver, bundled inside Pina.
- **mcp-shrimp-task-manager** — guardrail / task manager (MCP plugin).
- **@quintinshaw/swarm** — swarm plugin (runtime, no core rebuild).
- **@quintinshaw/pi-dynamic-workflows** — swarm engine (WorkflowAgent).

---

## License

Primary references: **OMP / oh-my-pi** + **Cheasee-Pi**. OMNI (token-saver) is
**Apache-2.0**. User machine config is **not** included in this repo (local-only).

Pina is intended to be open-sourced; the `crw` crawler (AGPL-3.0) is acceptable under
that plan.
