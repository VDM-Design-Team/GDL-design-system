# GDL — General Design Library

The parent design system. Every brand (VCP, CAF, BeyondFriends, WHU) builds on
it, the same way their Figma libraries subscribe to the GDL Figma library.

```
@vdm-design-team/gdl
├─ tokens/        shared scales — colour palette, spacing, radius, stroke,
│                 fonts, elevation, the 47-style type ramp (+ dark / desktop modes)
├─ contract/      the 247 semantic colour names every brand defines
├─ themes/        reference theme: placeholder semantics on the brand slot
├─ build/         Style Dictionary formats + Tailwind v4 mapping brands use
└─ gdl-check-contract   CLI a brand runs in CI
```

What lives where, and why: [`docs/architecture.md`](docs/architecture.md).

## For a brand repo

```bash
npm install --save-dev @vdm-design-team/gdl style-dictionary
```

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
`v<version>`. The release workflow publishes `@vdm-design-team/gdl` to
GitHub Packages. Brands pick it up through a dependency-bump PR — the GitHub
equivalent of accepting a Figma library update.

## Figma

GDL Figma library: `1rBM831Vs5ZS4OsRwIPH52`. Its Material 3 pages are
labelled "Reference · … (Material 3)" and have no tokens here.
