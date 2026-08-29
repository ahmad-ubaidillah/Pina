---
name: PR Review
id: pr-review
desc: Review a GitHub PR diff for bugs, security, and quality using CyberSec/QA roles.
tags: [dev, security]
backend: agent
enabled: true
---

# PR Review

Review an open GitHub pull request for correctness, security (OWASP: injection,
AuthN/AuthZ, SSRF, XSS, secret leak), and quality. Delegates to the CyberSec and QA
division agents.

## Usage
Call `use_skill` with `skill: "pr-review"`, `params: { "repo": "<owner/name>", "pr": <number> }`.

The agent will:
1. Fetch the PR diff via `gh pr diff <pr>`.
2. Spawn a `cybersec` worker to flag security issues with severity + concrete fix.
3. Spawn a `qa` worker to flag edge cases / regressions.
4. Return a consolidated review (severity, file:line, fix).

## Notes
- Requires `gh` authenticated (`gh auth status`).
- Never expose real secrets found — redact and report location only.
