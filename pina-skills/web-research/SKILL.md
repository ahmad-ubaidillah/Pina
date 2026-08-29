---
name: Web Research
id: web-research
desc: Multi-source research digest using web_search + synthesis.
tags: [research]
backend: agent
enabled: true
---

# Web Research

Given a question, run several `web_search` queries, fetch the top sources, and produce
a concise cited digest with a confidence note.

## Usage
Call `use_skill` with `skill: "web-research"`, `params: { "query": "<question>", "depth": 3 }`.
`depth` = number of search rounds (default 3).

## Output
- Bullet findings, each with source URL.
- A short "what's still uncertain" section.
- Token-aware: OMNI compresses before return.

## Notes
- Use for reconnaissance, competitor watch, or tech spikes.
- Never cite a source you didn't actually fetch.
