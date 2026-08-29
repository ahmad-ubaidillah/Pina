# Pina Browser Actions

Reusable browser scripts — Halo-style "AI decides, script executes" pattern.
Put a `.js` file here; the AI calls `browser_action` with `action: "script"` and
`script: "<name>"` (no `.js`). The script does the *how*; the agent decides *what/when*.

## Backends
- `backend: "obscura"` (default) — headless, no login needed, good for public pages.
- `backend: "bsk"` — Tencent BrowserSkill: runs the script in YOUR real, logged-in
  Chrome/Edge via the `bsk` CLI + extension. Use for sites that need auth/cookies.
- `backend: "node"` — run the script as plain Node (no browser, pure fetch).

## Script contract
A Browser Action script is a CommonJS module exporting an async function:
```js
// browser-actions/example.js
module.exports = async (params, ctx) => {
  // ctx = { backend, log }
  const r = await fetch("https://api.example.com/x", { credentials: "include" });
  const data = await r.json();
  return { success: true, items: data.items ?? [] };
};
```
- `params` — args passed from the agent (`browser_action` `params` field).
- Return a plain JSON-serializable object; the agent reads it.

## Why
Halo proved that pre-written, platform-specific scripts are far more reliable than
letting the AI "click randomly". Pina adopts the same idea: agents stay in control of
*intent*, scripts own the *mechanics* (DOM, cookies, selectors).
