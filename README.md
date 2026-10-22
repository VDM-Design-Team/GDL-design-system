# GDL — General Design Library

The parent design system. Every brand (VCP, CAF, BeyondFriends, WHU) builds on
it, the same way their Figma libraries subscribe to the GDL Figma library.

```
@vdm-design-team/gdl
├─ tokens/        shared scales — colour palette, spacing, radius, stroke,
│                 fonts, elevation, the 47-style type ramp (+ dark / desktop modes)
├─ contract/      the 247 semantic colour names every brand defines
├─ themes/        reference theme: the pink brand slot + placeholder semantics on it (never shipped to brands)
├─ build/         Style Dictionary formats + Tailwind v4 mapping brands use
└─ gdl-check-contract   CLI a brand runs in CI
```

What lives where, and why: [`docs/architecture.md`](docs/architecture.md).

## For designers — seeing the latest

**Just want to look at it? Open the published Storybook:**

### https://main--6ad738a1d955b2bc270fdb8a.chromatic.com

Always the current `main`, updated on every merge. Nothing to install, no account
needed. It shows the foundations (colour, type, spacing, shape) and the semantic
colour contract; semantic colours use the pink placeholder brand slot, so judge
names and structure here and colour in a brand's Storybook.

Every PR also gets a "Visual review" comment with its own live Storybook and
before → after diffs against `main`.

**New to the team?** Start with [`Onboarding/README.md`](Onboarding/README.md):
setup, catching up, reviewing, and proposing changes, with the exact things to
ask Claude.

## For a brand repo

```bash
npm install --save-dev "github:VDM-Design-Team/GDL-design-system#semver:^1.0.0" style-dictionary
```

This installs GDL from its release tag: no token, no `.npmrc`, and it resolves
only to tagged releases. (GitHub Packages needs a `read:packages` token even
for a public package, so it is the alternative, not the default.)

Keep only your brand ramps and your semantic values; take everything else
from GDL; build with GDL's formats; run `gdl-check-contract` in CI. The full
setup is in [`docs/consuming.md`](docs/consuming.md).

## Working on GDL

```bash
npm install
npm test               # lint tokens, build, check the reference theme, check changelog entry
npm run import:figma   # after refreshing figma-export/ — see docs/figma-sync.md
npm run storybook      # foundations gallery (colour, type, spacing, shape, contract) on :6006
```

- Tokens are generated from the GDL Figma file — never hand-edit `tokens/`.
- Every PR touching `tokens/`, `themes/`, `contract/` or `build/` adds a
  `changes/<branch>.md` entry (see [`changes/README.md`](changes/README.md)).
- Rules for people and AI agents: [`CLAUDE.md`](CLAUDE.md).

## Releasing

```bash
npm run changelog      # fold changes/ into CHANGELOG.md and bump the version
```

Merge that as the release PR, then create a GitHub release tagged
`v<version>`. The tag is what brands install from, and the release workflow
also publishes `@vdm-design-team/gdl` to GitHub Packages. Brands pick it up
through a dependency-bump PR — the GitHub equivalent of accepting a Figma
library update.

## Figma

GDL Figma library: `1rBM831Vs5ZS4OsRwIPH52`. Its Material 3 pages are
labelled "Reference · … (Material 3)" and have no tokens here.
