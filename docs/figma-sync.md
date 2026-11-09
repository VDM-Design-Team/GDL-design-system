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

## Type metrics

Each type tier's line height and letter spacing are variables in the
Typography collection: `font/line-height/<tier>` and
`font/letter-spacing/<tier>` (added 9 Nov 2026; until then they were kept by
hand in `figma-export/type-metrics.json`). Brand text styles bind them. GDL's
own text styles still use AUTO line height and 0% letter spacing.

Figma applies a bound number variable in **px only**, so code reads each
variable's modes to decide its form:

| In Figma | In code | Tiers today |
|---|---|---|
| The same value in every mode | px (`24px`, `0.25px`) | title, body, label, caption |
| The same multiple of `font/size/<tier>` in every mode | relative: unitless line height (`1.1`), em letter spacing (`-0.02em`) | display, heading |

So display-xl's line height is 70.4 in Mobile (64 × 1.1) and 99 in Desktop
(90 × 1.1), and code ships `1.1`. When you change a size or a metric, change
every mode so the rule still holds: the importer stops on a metric that is
neither. Each relative variable's description gives its ratio.

The importer writes them as `font.line-height.*` and `font.letter-spacing.*`
and uses the same values in the type ramp (`type.*`). A letter spacing of 0
is left out of the ramp, so the style inherits it.

## Snapshot format

`gdl-variables.json`:

```json
{ "collections": [ { "name": "Primitives", "modes": ["Mode 1"],
    "variables": [ { "n": "colors/slate/500", "t": "C", "v": ["#64748b"], "d": "…", "s": [] } ] } ] }
```

`n` name · `t` type (C colour, F float, S string) · `v` one value per mode ·
`d` description · `s` scopes (omitted when ALL_SCOPES) · `h` 1 when the
variable is hidden from publishing (omitted otherwise).

Floats are rounded to 4 decimal places. Figma stores 32-bit floats, so 70.4
reads back as 70.4000015…

## Hidden from publishing → reference only

A colour primitive hidden from publishing in Figma never reaches a brand
library, so it must not reach a brand build either. The importer writes such
families to `themes/reference/primitives.json` (GDL's own build, reference
theme and Storybook) instead of `tokens/core/color.json` (shipped to every
brand). Today that is the brand slot, `primary` (pink), and `secondary`.

To ship or withdraw a colour family, change its **Hide from publishing**
setting in the GDL Figma file, refresh the snapshot and import. Hide or
publish a whole family: the importer refuses a half-hidden ramp.

## CI guard

CI runs `npm run import:figma` and fails if `tokens/` or
`themes/reference/primitives.json` changes, so they can only move together
with the snapshot.
