# Syncing tokens from Figma

GDL's tokens are generated from the GDL Figma library
(`1rBM831Vs5ZS4OsRwIPH52`). Figma's REST variables API needs an Enterprise
plan, so the snapshot is taken through the Figma plugin API (Claude's Figma
connector) and committed as plain JSON.

## Refresh

1. Change the GDL Figma file and publish it.
2. Ask Claude, in this repo: *"Refresh figma-export from the GDL Figma file."*
   It rewrites:
   - `figma-export/gdl-variables.json` — every variable collection: names,
     modes, values (aliases kept as `{ "alias": "<name>" }`), descriptions,
     scopes.
   - `figma-export/gdl-styles.json` — text styles (name, family, style, size,
     bound size variable) and the Elevation effect styles.
3. `npm run import:figma` — regenerates `tokens/`.
4. `git diff` — every token change should be one you meant. Then `npm test`.
5. Commit snapshot + tokens together, add a `changes/` entry, open a PR.

`figma-export/type-metrics.json` is maintained by hand: Figma's text styles
use AUTO line height, so the explicit metrics live there.

## Snapshot format

`gdl-variables.json`:

```json
{ "collections": [ { "name": "Primitives", "modes": ["Mode 1"],
    "variables": [ { "n": "colors/slate/500", "t": "C", "v": ["#64748b"], "d": "…", "s": [] } ] } ] }
```

`n` name · `t` type (C colour, F float, S string) · `v` one value per mode ·
`d` description · `s` scopes (omitted when ALL_SCOPES).

## CI guard

CI runs `npm run import:figma` and fails if `tokens/` changes, so `tokens/`
can only move together with the snapshot.
