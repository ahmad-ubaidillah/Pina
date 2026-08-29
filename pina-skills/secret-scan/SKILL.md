---
name: Secret Scanner
id: secret-scan
desc: Scan a repo for leaked secrets (API keys, tokens, .env, private keys).
tags: [security]
backend: shell
enabled: true
---

# Secret Scanner

Scan a repository for accidentally committed secrets. Safe: only reports locations,
never prints the secret value.

## Usage
Call `use_skill` with `skill: "secret-scan"`, `params: { "path": "<repo root>" }`.
Defaults to current working dir.

## Patterns checked
- `.env` / `.env.*` files
- High-entropy strings assigned to key-like names (`API_KEY`, `SECRET`, `TOKEN`, `PASSWORD`)
- Private key headers (`-----BEGIN ... PRIVATE KEY-----`)
- Common provider tokens: `ghp_`, `sk-`, `AKIA`, `xox[baprs]-`, `AIza`

## Safety
- Reports `file:line` only. Redacts the matched value.
- Does NOT modify files; suggests rotation + `.gitignore` + `git filter-repo`.
