# Building a brand on GDL

How VCP, CAF and any new brand use this package. The brand repo keeps only
what is its own; everything shared comes from GDL.

## 1. Install

From GDL's release tag on GitHub. In the brand repo:

```bash
npm install --save-dev "github:VDM-Design-Team/GDL-design-system#semver:^0.1.0" style-dictionary
```

This writes the dependency as

```json
"@vdm-design-team/gdl": "github:VDM-Design-Team/GDL-design-system#semver:^0.1.0"
```

GDL's repo is public, so this needs no token and no `.npmrc`, locally or in
GitHub Actions: `npm ci` needs no token.

Why the git tag and not GitHub Packages:

- GitHub Packages needs a token with `read:packages` even for a public
  package. Every machine and workflow that installs the brand would need one.
- `#semver:^0.1.0` is the same version range a registry dependency would
  have. It resolves only to tagged releases (`v0.1.0`, `v0.1.1`, …), never to
  `main`, and `package-lock.json` pins the exact commit.
- npm clones GitHub dependencies over https first. The lockfile records a
  `git+ssh://` URL, but that is only npm's canonical form for GitHub
  dependencies, so it is harmless in CI.

A git install has no `dist/`: GDL doesn't commit it, and the registry package
gets it from `prepack`. Brands don't need it. They build their own `dist/`
from GDL's `tokens/` (section 3). Only the package exports that point into
GDL's own `dist/` (`theme.css`, `tokens.css`, `tokens.json`, …) are absent.

### Alternative: GitHub Packages

GDL is also published to GitHub Packages as `@vdm-design-team/gdl`. Use it
once every machine and workflow that installs the brand has `read:packages`.
In the brand repo:

```ini
# .npmrc
@vdm-design-team:registry=https://npm.pkg.github.com
```

```bash
npm install --save-dev @vdm-design-team/gdl style-dictionary
```

Locally, `npm login --registry=https://npm.pkg.github.com` (a GitHub token
with `read:packages`). In GitHub Actions, `GITHUB_TOKEN` with
`packages: read` is enough when the brand repo is in the same org.

Moving between the two routes is a one-line change to the dependency (plus
the `.npmrc`).

## 2. Keep only brand tokens

```
tokens/core/color.json        your ramps only — e.g. color.vcp-blue.*, color.caf-blue.*
tokens/core/typography.json   { "font": { "family": { "sans": { "$value": "{font.family.inter}" } } } }
tokens/semantic/color.json    the contract's names → references, light
tokens/semantic/color.dark.json   the same under a "dark" root
```

Delete local copies of slate, monochrome, green, red, yellow, blue, orange
and neutral — they come from GDL. Semantic tokens reference them the same
way (`{color.slate.500}`).

## 3. Build with GDL's formats

```js
// style-dictionary.config.mjs
import StyleDictionary from 'style-dictionary';
import { registerGdlFormats, gdlPlatforms, gdlIncludes } from '@vdm-design-team/gdl/build';

registerGdlFormats(StyleDictionary);

export default {
  include: gdlIncludes(),          // GDL tokens — lower priority
  source: ['tokens/**/*.json'],    // brand tokens win on collisions (e.g. font.family.sans)
  platforms: gdlPlatforms(),       // dist/theme.css, tokens.css, tokens.dark.css, …
};
```

Style Dictionary reports the intended overrides (like `font.family.sans`) as
collisions; that is how a brand overrides a GDL default.

The app imports the brand's `dist/theme.css` in place of
`@import "tailwindcss"`.

## 4. Check the contract in CI

```json
"scripts": {
  "check:contract": "gdl-check-contract --light tokens/semantic/color.json --dark tokens/semantic/color.dark.json --core tokens/core/color.json"
}
```

Add it to `npm test`. It fails on a missing required name (either mode) or a
reference that doesn't resolve to GDL or the brand's core; it warns on a
missing recommended name, raw hex values, and references to GDL's brand
slot (`color.primary`).

## 5. Upgrading GDL

Treat a GDL bump like accepting a Figma library update: open it as its own
PR, read the GDL `CHANGELOG.md` entries, and review the visual diff. A
`major` GDL release lists what each brand must change under `Migration:`.

What the bump PR changes depends on the release:

- A release inside the range (for `^0.1.0`, any `0.1.x`) changes only
  `package-lock.json`: run `npm update @vdm-design-team/gdl`.
- A release outside the range (any `major`, and while GDL is `0.x`, a `minor`
  too) also changes the semver range in `package.json`, for example
  `npm install --save-dev "github:VDM-Design-Team/GDL-design-system#semver:^0.2.0"`.
