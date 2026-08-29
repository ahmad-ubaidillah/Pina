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
git apply ../patches/tui-rebrand.patch ../patches/build-minify.patch
```

## What each patch does

### `tui-rebrand.patch`
- `src/modes/components/welcome.ts`: replaces the π block logo (`PI_LOGO`) with a
  bold ASCII **pine tree**, and recolors the diagonal moodboard gradient from
  pink→purple→cyan to **pine/forest green** (`[22,92,48]→[46,160,67]→[120,220,140]`),
  plus a green 256-color fallback ramp.
- `src/modes/theme/dark.json`: `accent` `#febc38` (amber) → `#3fb950` (pine green).

### `build-minify.patch`
- `scripts/compile-binary.ts`: `minify: { identifiers, keepNames }` → `minify: true` (full).
- `scripts/build-binary.ts`: passes `minifyWhitespace: true`.
- Effect: binary ~179 MB → ~167 MB (≈6.5% smaller).

## Note on `run_experiment`
Pina relies on OMP's **native** `autoresearch` extension for `run_experiment`
(`packages/coding-agent/src/autoresearch/`). It arms when autoresearch mode is on
(`/autoresearch <goal>`); use it in interactive mode or with a capable model.
No plugin-side `run_experiment` is shipped (it collided with the core tool).
