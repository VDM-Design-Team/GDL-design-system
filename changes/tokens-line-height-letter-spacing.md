---
bump: minor
---
### `font.line-height.*` and `font.letter-spacing.*` — the type ramp's metrics as Figma variables (November 2026)

GDL's Figma Typography collection had sizes, weights and families but no line
heights or letter spacing, so brand text styles couldn't bind them: CAF's
Caption/md-medium types 16px / 0.3px by hand. It now has
`font/line-height/<tier>` and `font/letter-spacing/<tier>` for all 15 tiers,
with the values GDL's type ramp has always shipped. Figma applies a bound
number variable in px only, so a tier that scales with its size has a px
value per mode: display-xl's line height is 70.4 in Mobile and 99 in Desktop
(1.1 × the size).

In code they are new tokens, Mobile values in the ramp's own form: unitless
line heights and em letter spacing for display and heading, px for the rest.
They appear in `tokens.css` (`--font-line-height-body-md: 24px`), `tokens.json`
and `tokens.ts`. The importer now reads the ramp's metrics from these
variables, and `figma-export/type-metrics.json`, kept by hand until now, is
gone. The type ramp is unchanged: `tokens/semantic/type.json` and `theme.css`
are byte-identical, so no `text-*` utility changes. `docs/figma-sync.md` →
Type metrics has the px → code rule.

Also in the GDL Figma library: `Button_Normal`, `Button_Small` and
`Button_Big` have a **Label** text property, bound to each variant's existing
`Label` layer, so brand buttons built on them can expose their label. Label
overrides on existing instances are kept and become the property's value.

Affects every brand as new, unused tokens only. CAF asked for both (its
Figma clean-up, 3 Nov 2026): after bumping GDL it can bind Caption/md-medium
and later its whole ramp, and expose the label on Button / Big, Normal and
Small. VCP needs no changes.
