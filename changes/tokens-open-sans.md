---
bump: minor
---
### Open Sans joins GDL's font families (November 2026)

A new font family token, `font.family.open-sans` (`Open Sans`, then
`system-ui` and `sans-serif`), from a new `font/family/open sans` variable
in the GDL Figma file's Typography collection, set up like the other families
(FONT_FAMILY scope, the same value in every mode). Brands get it as the
`--font-open-sans` theme variable and the `font-open-sans` Tailwind utility.
It's available, not applied: no type style and no slot (`font.family.sans`,
`font.family.numeric`) changes, so nothing looks different in any brand.

The Storybook loads Open Sans from Google Fonts, so the Font families page
shows the real face.
