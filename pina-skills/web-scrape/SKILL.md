---
name: Web Scrape
id: web-scrape
desc: Extract clean article text from any URL via obscura headless browser.
tags: [browser]
backend: obscura
enabled: true
---

# Web Scrape

Return clean, readable text from a web page. Uses the bundled `obscura` headless
browser for JS-rendered pages; falls back to plain fetch. Use `bsk` backend when the
page needs login/cookies (real browser).

## Usage
Call `browser_action` with:
- `action: "fetch_url"`, `url: "<target>"`, `backend: "obscura"` (default)

Or run the reusable Browser Action script:
- `action: "script"`, `script: "web_scrape"`, `params: { "url": "<target>" }`

## Notes
- Truncates to ~8k chars to stay token-friendly (OMNI will compress further).
- For authenticated sites, set `backend: "bsk"` after installing BrowserSkill.
