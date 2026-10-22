import StyleDictionary from 'style-dictionary';
import { registerGdlFormats, gdlPlatforms } from './build/formats.mjs';

/* ------------------------------------------------------------------ *
 * GDL's own build. Brands use the same formats through
 * `@vdm-design-team/gdl/build` (see build/formats.mjs and
 * docs/consuming.md); this file only differs in what it reads:
 *
 *   tokens/            GDL core scales, modes, type ramp  (shipped to brands)
 *   themes/reference/  the brand slot (primitives.json, generated from the
 *                      Figma variables hidden from publishing) and
 *                      placeholder semantics on it (GDL's own gallery and
 *                      the starting point for a new brand — brands never
 *                      include it)
 * ------------------------------------------------------------------ */
registerGdlFormats(StyleDictionary);

export default {
  source: ['tokens/**/*.json', 'themes/reference/*.json'],
  platforms: gdlPlatforms(),
};
