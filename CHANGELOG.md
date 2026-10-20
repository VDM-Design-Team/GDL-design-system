# Changelog

## 0.1.0 — unreleased

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
