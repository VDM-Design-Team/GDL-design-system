# Unreleased changes

Every PR that touches `tokens/`, `themes/`, `contract/` or `build/` adds
**one file here** with its changelog entry, instead of editing
`CHANGELOG.md`. Two PRs never write the same file, so entries can't
conflict. At release time `npm run changelog` combines the files into
`CHANGELOG.md`, newest first, and deletes them.

## Writing one

Name it after your branch, with the slash as a dash:
`tokens/add-teal-status` → `changes/tokens-add-teal-status.md`.

```markdown
---
bump: minor
---
### `color.teal` — a status hue for "scheduled" (November 2026)

CAF and WHU both show a scheduled state; the ramp is Tailwind v4 teal …
```

- **`bump`** is `patch`, `minor` or `major` (rules 3, 5 and 6 in `CLAUDE.md`):
  - `patch`: a value fix with no new name.
  - `minor`: a new token, contract extension or recommended name, or a
    tooling change that doesn't break a brand build.
  - `major`: a new **required** contract name, any rename or removal, or a
    tooling change that breaks a brand build. It must include a
    `Migration:` note saying what each brand changes.
- **The body** is the entry as it will read in `CHANGELOG.md`: a `### `
  heading naming the piece and the month, then the prose. Name the brands it
  affects.

`npm test` (and CI) fails a PR that changes those folders without a file
here, a PR that edits `CHANGELOG.md` directly, and a malformed file.

## Releasing

```bash
npm run changelog -- --dry-run
npm run changelog
```
