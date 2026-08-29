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
- **Web stack bundled** — `obscura` (headless browser) + `spider-rs` (crawler) + native
  `web_search` + reusable Browser Actions. No Firecrawl, no cloud.
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
| `obscura` | headless browser (Apache-2.0) |
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

Pina ships a lightweight, local-first web layer (no third-party crawl service):

| Need | Tool | License |
|------|------|--------|
| Headless browser | `obscura` | Apache-2.0 |
| Real logged-in browser | BrowserSkill (`bsk`) | — (optional) |
| Crawl / scrape / map | `spider-rs` (`spider`) | MIT |
| Search | native `web_search` | — |
| Reusable scripts | Browser Actions | — |

Available tools (via the swarm plugin):

- **`web_search`** — query the web (native provider).
- **`browser_action`** — `action: fetch_url | script`, `backend: obscura | bsk | node`.
  - `fetch_url` → `obscura fetch <url>` (JS-rendered pages).
  - `script` → run a reusable `.js` Browser Action from `~/.pina/browser-actions`
    (Halo-style: the AI decides *what/when*, the script owns *how*).
- **`crawl`** — `mode: scrape | crawl | map | search`.
  - `scrape` → `spider -u <url> scrape` (markdown).
  - `crawl` → `spider -u <url> crawl` (follow links).
  - `map` → list discovered URLs.
  - `search` → falls back to `web_search` (spider CLI has no local search).

### Browser Actions
Put a `.js` file in `~/.pina/browser-actions/`. The script exports an async function:

```js
// ~/.pina/browser-actions/fetch_page.js
module.exports = async (params, ctx) => {
  const url = String(params?.url ?? "").trim();
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Pina-Agent)" } });
  const html = await r.text();
  return { success: true, title: (html.match(/<title>([^<]*)<\/title>/i) || [])[1] };
};
```

Invoke it:
```bash
pina -p "use browser_action action=script script=fetch_page params={'url':'https://example.com'}"
```

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
