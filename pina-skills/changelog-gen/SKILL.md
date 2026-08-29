---
name: Changelog Generator
id: changelog-gen
desc: Generate a changelog from git log since the last tag.
tags: [dev]
backend: shell
enabled: true
---

# Changelog Generator

Produce a grouped changelog (Features / Fixes / Chores) from `git log` since the last
tag (or a given ref range).

## Usage
Call `use_skill` with `skill: "changelog-gen"`, `params: { "range": "<from>..<to>" }`.
If `range` omitted, uses `$(git describe --tags --abbrev=0)..HEAD`.

## Logic
- Group commits by Conventional Commits prefix (`feat:`, `fix:`, `chore:`, `docs:`, ...).
- Strip the prefix, keep subject, link to commit SHA.
- Output Markdown.

## Example shell
```sh
FROM=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
git log ${FROM}..HEAD --pretty=format:"- %s (%h)"
```
