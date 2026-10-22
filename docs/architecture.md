# Architecture — GDL and the brands

## The family

```
GDL  (this repo · @vdm-design-team/gdl)
├─ tokens/core        shared colours (greys, status hues), spacing, radius, stroke, fonts, elevation
├─ tokens/modes       dark elevation, desktop type sizes
├─ tokens/semantic    the 47-style type ramp
├─ contract/          the semantic colour names every brand must define
├─ themes/reference   the brand slot (pink) + placeholder semantics on it (never shipped into a brand build)
└─ build/             Style Dictionary formats + Tailwind mapping every brand uses

VCP · CAF · BeyondFriends · WHU  (one repo each, depends on @vdm-design-team/gdl)
├─ tokens/core        brand ramps only (vcp-blue, caf-blue, …) + font.family.sans
├─ tokens/semantic    the contract's names → values, light and dark
└─ src/               brand components and patterns
```

## Figma ↔ GitHub

| Figma | GitHub |
|---|---|
| GDL library file | this repo |
| GDL publishes a library update | a GDL release (`@vdm-design-team/gdl@x.y.z`) |
| A brand file subscribes to GDL | the brand's `package.json` depends on `@vdm-design-team/gdl` |
| "Library updates available → Review" | a dependency-bump PR in the brand repo; the brand's CI and visual review show the effect |
| A brand's Semantics variable aliases a GDL primitive | the brand's `tokens/semantic/*.json` references `{color.slate.500}`, resolved from GDL |
| Brand-Primitives collection | the brand's `tokens/core/color.json` (its own ramps only) |
| A GDL variable hidden from publishing (the brand slot) | `themes/reference/primitives.json`: in GDL's own build only, never in a brand's |

**Colour, in one line:** GDL ships shared colours, each brand owns its brand
ramp, and brand colour reaches components only through the semantic names
(`action.primary`, `text.brand`, `surface.brand`, …). GDL's pink brand slot
is a placeholder for GDL's own reference theme and Storybook. It is hidden
from publishing in Figma, so neither brand libraries nor brand builds receive
it. (Up to GDL 0.1.0 it leaked: every brand's `theme.css` had unused pink
`--color-primary-*` and teal `--color-secondary-*` utilities.)

Figma's Pro plan has no extended collections, so in Figma each brand keeps
its own Semantics collection with the contract's names and nothing stops a
designer aliasing a sibling. The repos enforce what Figma can't:
`gdl-check-contract` fails a brand that misses a required name or points a
reference at anything that isn't GDL or the brand's own core.

## The contract

`contract/semantic-color.json` has three tiers:

- **required** — 247 names. Every brand defines each in light and dark.
  Origin: the names VCP's code and CAF's Figma both had in October 2026.
- **recommended** — `stroke.field` (a form control's resting border that
  meets 3:1, an accessibility finding from VCP) and `surface.track`.
- **extensions** — names one brand uses today (CAF's `accent.pending.*`,
  VCP's `text.logo`, …). Allowed and expected; promote to required when a
  second brand needs one.

Anything outside the three is allowed and reported, so it can be proposed.

## Decisions (October 2026)

- **One repo per design system**, mirroring Figma's library model. GDL
  changes reach a brand through a release and a bump PR.
- **Package scope `@vdm-design-team`** — GitHub Packages requires the scope
  to match the repo owner.
- **Tokens are generated from Figma** (`figma-export/` → `npm run
  import:figma`), with CI checking they match. Whether GDL becomes
  repo-canonical (like VCP) once designers edit tokens through PRs is open.
- **Type metrics** (line height, letter spacing) come from VCP's production
  ramp because Figma's styles use AUTO. Desktop sizes are shipped as opt-in
  custom properties, not wired into the ramp, until a breakpoint strategy is
  agreed.
- **Not exported:** GDL Figma's legacy "Components" collection
  (`button/filled/enabled`, …) — superseded by the contract. GDL's Material 3
  pages are reference-only and have no tokens of their own here.
- **Components are not in v0.1.** Shared components move up into GDL when a
  second brand needs them (Button first, from VCP).

## Proven

Before v0.1 was published, VCP's production tokens were rebuilt on GDL in a
scratch folder (VCP keeping only `vcp-blue` and `brand`): 495 of 502 semantic
colour values and all 47 type styles were identical. The 7 differences were
all `green.800`, the fix GDL made on 16 Oct 2026 (`#008236`, a duplicate of
700, → `#016630`). VCP's tokens pass the contract, with `text.logo*` as
recognised extensions.
