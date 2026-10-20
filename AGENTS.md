# Working on GDL

GDL (General Design Library) is the **parent design system**. Every brand
design system — VCP, CAF, BeyondFriends, WHU — builds on it. This repo ships
three things to them: shared **tokens**, the **semantic colour contract**
every brand implements, and the **build tooling** they all use. Read
`docs/architecture.md` before changing anything structural.

## Rules — apply to every change

1. **No brand colours in GDL.** The only brand-ish ramp is the brand slot,
   `color.primary` — a placeholder each brand replaces with its own.
   `npm run lint:tokens` fails on any colour family not on its allow-list;
   adding one means editing that list in the same PR, so a reviewer sees it.
2. **Tokens come from Figma (for now).** `tokens/` is generated from the
   snapshots in `figma-export/` by `npm run import:figma`. Never hand-edit
   `tokens/`. To change a value: change the GDL Figma file, refresh the
   snapshot (`docs/figma-sync.md`), run the import, and commit snapshot and
   tokens together. CI fails if `tokens/` differs from what the snapshot
   produces.
3. **The contract is a promise to every brand.** `contract/semantic-color.json`
   lists the semantic names every brand must define in light and dark.
   - Adding a **required** name is a **major** bump: every brand must add it
     before upgrading. Say which brands already have it.
   - Adding a **recommended** name or an **extension** is **minor**.
   - Removing or renaming anything is **major** and needs a `Migration:` note.
   - A name only one brand uses belongs in `extensions`, not `required`.
4. **The reference theme is a placeholder.** `themes/reference/` exists so the
   contract is testable and a new brand has a starting point. Brands never
   include it. Its values need not pass contrast checks on the pink slot;
   a brand's real ramp must.
5. **Shared tooling changes affect every brand.** `build/formats.mjs` and
   `scripts/check-contract.mjs` run inside VCP, CAF and the rest. A change
   that alters their output (CSS names, file names, check strictness) is at
   least **minor**; one that breaks an existing brand build is **major**.
6. **Changes are versioned.** Every PR that touches `tokens/`, `themes/`,
   `contract/` or `build/` adds its changelog entry as its own file in
   `changes/` (`changes/<branch-name>.md` with `bump: patch|minor|major`).
   Never edit `CHANGELOG.md` directly. See `changes/README.md`.
7. **Tokens never encode a single brand's decision.** If only one brand
   needs something, it lives in that brand's repo. Promote it to GDL when a
   second brand needs it.

## Naming

- Core colour: `color.<family>.<step>` → `--color-slate-500`, `bg-slate-500`.
- Semantic roots (contract): `text`, `surface`, `stroke`, `action`,
  `neutral`, `accent` → `--color-text-primary`, `bg-surface-canvas`.
- Dimensions are px-named: `space.16` = 16px, `radius.8` = 8px,
  `stroke-width.1-5` = 1.5px (no "." in token names). Spacing matches
  Tailwind's numeric scale, so components use `p-4`/`gap-2`; radius maps to
  `rounded-<px>`.
- Type ramp: `type.<tier>-<size>-<weight>` → `text-body-md-regular`
  (size + line height + weight + tracking as a unit). `font.family.sans` is
  the slot each brand points at its UI face.
- Elevation: `shadow.elevation.1`…`7` → `shadow-elevation-3`; dark values
  in `tokens/modes/elevation.dark.json`.
- Every path segment is lower-case kebab (`lint:tokens` enforces it).

## Commands

| | |
|---|---|
| `npm run import:figma` | `figma-export/` → `tokens/` |
| `npm run build` | `tokens/` + reference theme → `dist/` |
| `npm test` | Token lint, build, contract check on the reference theme, changelog-entry lint (what CI runs) |
| `npm run storybook` | Foundations gallery on :6006, read from `dist/` (rebuilds it first). `storybook:build` is the static build CI checks |
| `npm run changelog` | At release: fold `changes/` into `CHANGELOG.md` and set the version |

## Workflow

- One branch per task (`feat/…`, `fix/…`, `tokens/…`, `docs/…`), from a
  freshly pulled `origin/main`. Never push to `main`.
- Touch only the files the task needs. Before committing, list the changed
  files and confirm they match the task.
- Open a draft PR early. Describe the change in product terms and say which
  brands it affects and how (`npx gdl-check-contract` output from a brand is
  the best evidence).
- Merge `main` into your branch, never rebase; never force-push.
- Finish by reporting files changed and why, checks run with results, any
  breaking change, and a PR description.
