---
name: Issue Triage
id: issue-triage
desc: Classify, label, and draft a response for a GitHub issue.
tags: [dev]
backend: agent
enabled: true
---

# Issue Triage

Triage an incoming GitHub issue: classify type (bug/enhancement/question/docs),
estimate severity/priority, suggest labels, and draft a first-response comment.

## Usage
Call `use_skill` with `skill: "issue-triage"`, `params: { "repo": "<owner/name>", "issue": <number> }`.

The agent will:
1. Fetch the issue body + comments via `gh issue view <issue>`.
2. Classify type + severity + suggested labels.
3. Draft a concise, friendly first response (ask for reproduction steps if bug,
   clarify scope if enhancement).

## Notes
- Output is a draft — human posts it. Never auto-close issues.
