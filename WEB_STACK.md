# Pina Web Stack — Research & Decision

## Requirement (from Ahmad)
- Lightweight browser + crawler for the agent, no heavy 3rd-party (no Firecrawl).
- Prefer 1 tool all-in-one if possible; else minimal Rust-native combo.
- Must NOT require separate manual install by the user (bundle into Pina core, like OMNI).

## Research findings (GitHub, 2026-08-29)

### Browser agents (interactive / CDP)
| Tool | ⭐ | Lang | License | Notes |
|---|---|---|---|---|
| browser-use | 111k | Py | MIT | most popular but Python (heavy for Bun/TS) |
| stagehand | 24k | TS | MIT | SDK browser agent, needs Playwright/Chromium |
| **obscura** | 22k | **Rust** | **Apache-2.0** | headless browser for AI agents, anti-detect, CDP/Playwright/Puppeteer API |
| lightpanda | — | Zig | — | agent-focused headless browser (data N/A) |

### Crawlers / scrapers (HTTP-based, no browser)
| Tool | ⭐ | Lang | License | Notes |
|---|---|---|---|---|
| crawl4ai | 80k | Py | Apache-2.0 | LLM-friendly crawler (Python) |
| **spider-rs** | 2.7k | **Rust** | **MIT** | fastest web crawler/scraper, HTTP-based |
| us/crw (fastcrw) | 868 | Rust | AGPL-3.0 | one engine: search+scrape+map+crawl+extract |

### npm availability (for bundling into Bun/TS core)
- `obscura` → npm v1.0.0 ✅
- `@spider-rs/spider-rs` → npm v0.0.163 ✅
- `crw` → npm v0.0.0 ✅

## Decision
- **No single all-in-one tool exists** that covers interactive browser + HTTP crawl in one
  lightweight binary. Best minimal combo (both Rust, both npm-bundlable):
  - **obscura** (Apache-2.0) → browser backend (replaces camofox; Rust, anti-detect, agent-built).
  - **spider-rs** (MIT) → crawl/scrape backend (HTTP-only, no browser needed).
- **camofox is removed** — Pina already has a native browser path (`browser-relay` → Chrome
  via CDP); obscura is the new dedicated headless browser for agents.
- **Both bundled into Pina core** (npm deps + `bun build-binary.ts`), so users get them via
  `pina-install.sh` with NO separate install. Mirrors how OMNI is bundled.
- `crw` kept as optional third option (AGPL — acceptable since Pina will be open-sourced).

## Status (2026-08-29)
- ✅ **obscura** v0.2.1 prebuilt downloaded → `pina-core/bin/obscura/` (linux x86_64, 105MB binary + 95MB worker).
- ✅ `pina-install.sh` auto-downloads per-OS prebuilt (linux/mac, windows) if missing.
- ✅ Plugin `browser_action` now uses `obscura fetch <url>` (replaces camofox/cua-driver).
  - `fetch_url` → `obscura fetch <url>` (JS-rendered pages OK), fallback to plain fetch.
  - `scrape`/`cua`/`screenshot` → routed to `obscura fetch` with fallback (full CDP/scrape pending).
- ✅ Verified: `obscura --version` = 0.2.1; `obscura fetch https://example.com` returns page HTML.
- ⏳ **spider-rs** (crawl backend): not yet bundled (no prebuilt release; needs cargo/npm install).
  Next step: add `@spider-rs/spider-rs` npm dep OR `cargo install spider_cli`, wire a `crawl` tool.

## obscura CLI (reference)
- `obscura fetch <url>` — fetch rendered page (markdown/text)
- `obscura scrape <url>` — structured scrape
- `obscura serve` — headless CDP server (port 9222)
- `obscura mcp` — run as MCP server (can plug into Pina as MCP)
- `--stealth` — anti-detect fingerprint + tracker blocking
- `--proxy <url>` — route through proxy

## Integration plan
1. ✅ Add `obscura` prebuilt to `pina-core/bin/obscura/` + install.sh downloader.
2. ✅ Plugin `browser_action` → `obscura fetch`.
3. ⏳ Add spider-rs (crawl) — next.
4. ⏳ Optional: run `obscura mcp` as a bundled MCP server for richer browser control.
