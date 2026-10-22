# Changelog

## 1.0.0 — 2026-10-22

### The brand slot stays in GDL: brands no longer receive the pink and teal ramps (October 2026)

GDL's Figma file hides `colors/primary/*` (the pink placeholder brand slot)
and `colors/secondary/*` (teal, origin unknown) from publishing, so brand
libraries never receive them. Brand builds still did: both ramps sat in
`tokens/core/color.json`, so every brand's `theme.css` carried unused
`--color-primary-*` and `--color-secondary-*` utilities, and `bg-primary-500`
rendered pink in VCP and CAF.

The importer now follows Figma's **Hide from publishing** setting. Hidden
colour families are written to `themes/reference/primitives.json`, which GDL's
own build, reference theme and Storybook use and which brands never include.
The snapshot records the flag as `h`. The two families' descriptions were
updated in Figma to match.

- `gdl-check-contract` now fails a brand semantic token that points at
  `{color.primary.*}` or `{color.secondary.*}`, with a message saying to use
  the brand's own ramp. It used to warn.
- `npm run lint:tokens` keeps a separate list of reference-only families and
  fails if a family is both shipped and reference-only.

Affects every brand's build output, not its tokens. VCP (PR #172 branch) and
CAF pass the new contract check unchanged, and neither uses the pink or teal
utilities.

Migration: if a brand's semantic tokens reference `{color.primary.*}` or
`{color.secondary.*}`, point them at the brand's own ramp (`vcp-blue`,
`caf-blue`, …). If its code uses `bg-primary-*`, `text-secondary-*` or similar
utilities, replace them with semantic utilities (`bg-action-primary-surface-default`,
`text-text-brand-medium`, …). VCP and CAF need no changes.

## 0.1.0 — 2026-10-20

### First release — tokens, contract and shared tooling (October 2026)

- **Tokens from the GDL Figma library** (`figma-export/` →
  `npm run import:figma`): 102 colours in 10 families (brand slot
  `color.primary`, neutral, slate, monochrome, green, red, yellow, blue,
  orange, and `secondary`, whose origin is still unconfirmed), px-named
  spacing (0–256), radius (0–64, full) and stroke widths, five font
  families with `font.family.sans` as the brand's slot, five weights,
  15 type sizes (Mobile; Desktop as opt-in overrides), elevation 1–7 in
  light and dark, and the 47-style type ramp.
- **The semantic colour contract** (`contract/semantic-color.json`): 247
  required names (shared by VCP's code and CAF's Figma), 2 recommended
  (`stroke.field`, `surface.track`), 9 known extensions.
- **Reference theme** on the brand slot, derived from VCP's production
  mapping.
- **Shared build** (`@vdm-design-team/gdl/build`): Style Dictionary formats
  for the Tailwind v4 theme, dark and desktop mode files, TS and JSON — the
  same output VCP's build produced, generalised for any brand.
- **`gdl-check-contract`**: the CLI brands run in CI.
- Verified against VCP: rebuilt on GDL, 495/502 semantic colours and 47/47
  type styles identical; the 7 differences are the `green.800` fix
  (`#008236` → `#016630`).
