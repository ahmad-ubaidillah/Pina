# Pina Patches

These patches apply Pina's rebrand + build tweaks on top of a fresh
[OMP / oh-my-pi](https://github.com/oh-my-pi) fork (the `pina-core/` directory).

They are kept out of the main repo because `pina-core/` is a large nested fork and
is intentionally git-ignored from this repo (local-only, per the AEON rule).

## Apply to a fresh OMP fork

```bash
cd pina-core            # your OMP fork checkout
git apply ../patches/tui-rebrand.patch     # pine-tree logo + green moodboard gradient
git apply ../patches/build-minify.patch     # full minify in the binary build
```

Or apply both at once:

```bash
git apply ../patches/tui-rebrand.patch ../patches/build-minify.patch ../patches/autoresearch-always-on.patch ../patches/division-agents.patch
```

## What each patch does

### `tui-rebrand.patch`
- `src/modes/components/welcome.ts`: replaces the π block logo (`PI_LOGO`) with a
  bold ASCII **pine tree**, and recolors the diagonal moodboard gradient from
  pink→purple→cyan to **pine/forest green** (`[22,92,48]→[46,160,67]→[120,220,140]`),
  plus a green 256-color fallback ramp.
- `src/modes/theme/dark.json`: `accent` `#febc38` (amber) → `#3fb950` (pine green).

### `division-agents.patch`
- `src/prompts/agents/{fe,be,qa,pm,ba,devops,cybersec}.md`: 7 per-divisi skill agents
  (Frontend, Backend, QA, PM, BA, DevOps, CyberSec) with role-specialized system prompts.
- `src/task/agents.ts`: registers the 7 agents into the bundled agent set (appears in `/agents` hub).
- Also: the swarm plugin (`@quintinshaw/swarm`) `spawn_worker` accepts a `role` argument
  (`fe|be|qa|pm|ba|devops|cybersec`) that injects the matching role prompt into the worker.

### `autoresearch-always-on.patch`
- `src/autoresearch/index.ts`: `run_experiment` (and the other experiment tools) are now always
  in the active tool set, so they are callable in `-p`/pipe mode without toggling autoresearch first.

## Note on `run_experiment`
Pina relies on OMP's **native** `autoresearch` extension for `run_experiment`
(`packages/coding-agent/src/autoresearch/`). With `autoresearch-always-on.patch` it is
exposed by default (no `/autoresearch` toggle needed). The swarm plugin does NOT ship its own
`run_experiment` (it collided with the core tool).
