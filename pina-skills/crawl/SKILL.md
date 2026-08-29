---
name: Web Crawl
id: crawl
desc: Crawl / scrape / map / search the web via spider-rs (bundled, MIT).
tags: [browser, research]
backend: spider
enabled: true
---

# Web Crawl

Pina's crawl backend, powered by the bundled `spider-rs` CLI (Rust, MIT — no
Firecrawl, no cloud). One engine covers four jobs:

- `scrape` — fetch a single page as clean JSON/markdown.
- `crawl` — follow links from a URL up to `limit` pages.
- `map` — list all URLs discovered on/under a site.
- `search` — run a web search (falls back to `web_search` if spider absent).

## Usage
Call `crawl` with:
- `mode: "scrape"`, `url: "<target>"`
- `mode: "crawl"`, `url: "<site>"`, `limit: 20`
- `mode: "map"`, `url: "<site>"`, `limit: 50`
- `mode: "search"`, `query: "<q>"`, `limit: 10`

## Notes
- Output truncated to ~8k chars; OMNI compresses before return.
- If `spider` is not installed, `search` mode falls back to the native `web_search`.
- For authenticated/JS-heavy single pages, prefer the `web-scrape` skill (obscura/bsk).
