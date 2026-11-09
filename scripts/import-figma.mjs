/**
 * Figma → tokens. Turns the snapshots in figma-export/ into the DTCG token
 * files in tokens/. Re-runnable: it overwrites every file it writes, so a
 * Figma change is "re-export the snapshot, run this, review the diff".
 *
 *   npm run import:figma
 *
 * How to refresh the snapshots is in docs/figma-sync.md.
 *
 * What it reads
 *   figma-export/gdl-variables.json  every GDL variable collection, including
 *                                    font/line-height/* and font/letter-spacing/*
 *                                    (the type ramp's metrics per tier)
 *   figma-export/gdl-styles.json     text styles + elevation effect styles
 *
 * Type metrics: Figma px → code's form
 *   Figma binds a number variable to line height and letter spacing in px
 *   only, so a tier that scales with its size has a px value per mode
 *   (display-xl: 70.4 Mobile, 99 Desktop). Code keeps the ramp's form: a value
 *   that is the same in every mode ships in px (body-md: 24px); one that is
 *   the same multiple of the font size in every mode ships relative to it, as
 *   a unitless line height (1.1) or em letter spacing (-0.02em), so it keeps
 *   scaling once desktop sizes reach the ramp. Anything else means one mode
 *   was changed without the other, and the import stops.
 *
 * What it deliberately skips
 *   The "Components" collection (button/filled/enabled, text/brand_dark …).
 *   It is the GDL file's own legacy mini-semantics; the semantic contract in
 *   contract/ replaces it. GDL's Figma components still use it.
 *
 * Hidden from publishing → reference only
 *   A colour primitive that the GDL Figma file hides from publishing (`h` in
 *   the snapshot) is something brand libraries never receive in Figma, so
 *   brand builds must not receive it either. Today that is the brand slot
 *   (`primary`, the pink placeholder) and `secondary`. They are written to
 *   themes/reference/primitives.json, which GDL's own build, reference theme
 *   and Storybook use and which is never shipped into a brand build, instead
 *   of tokens/core/color.json. To ship or withdraw a family, change its
 *   "Hide from publishing" setting in Figma; this file follows.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, obj) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
  console.log('✔', p);
};
const kebab = (s) => s.trim().toLowerCase().replace(/\s+/g, '-');

const vars = read('figma-export/gdl-variables.json');
const styles = read('figma-export/gdl-styles.json');
const collection = (name) => {
  const c = vars.collections.find((x) => x.name === name);
  if (!c) throw new Error(`figma-export has no "${name}" collection`);
  return c;
};

/* ---------- colour: Primitives → color.<family>.<step> ----------
 * Published families go to tokens/core (shipped to every brand); families
 * hidden from publishing in Figma go to the reference theme (GDL only). */
const color = { $type: 'color' };
const referenceColor = { $type: 'color' };
const familyDescriptions = {};
const familyHidden = {};
for (const v of collection('Primitives').variables) {
  const [, family, step] = v.n.split('/');
  const value = v.v[0];
  if (typeof value !== 'string') throw new Error(`${v.n}: primitives must be raw colours, found ${JSON.stringify(value)}`);
  (familyHidden[family] ??= new Set()).add(Boolean(v.h));
  (familyDescriptions[family] ??= {})[v.d ?? ''] = ((familyDescriptions[family] ?? {})[v.d ?? ''] ?? 0) + 1;
  const target = v.h ? referenceColor : color;
  (target[family] ??= {})[step] = { $value: value, ...(v.d ? { $description: v.d } : {}) };
}
/* A family is shipped or withdrawn as a whole: half-hidden ramps are a Figma mistake, not a decision. */
for (const [family, flags] of Object.entries(familyHidden))
  if (flags.size > 1) throw new Error(`colors/${family}: some steps are hidden from publishing in Figma and some are not — hide or publish the whole family`);
/* Lift the description most steps share to the family; keep only the ones that differ (e.g. green/800's fix note). */
for (const [family, counts] of Object.entries(familyDescriptions)) {
  const common = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  if (!common) continue;
  const target = family in color ? color : referenceColor;
  target[family] = { $description: common, ...target[family] };
  for (const [k, t] of Object.entries(target[family])) if (!k.startsWith('$') && t.$description === common) delete t.$description;
}

/* ---------- dimensions: Spacings / Radius / Stroke ---------- */
const scale = (name, prefix, describe) => {
  const out = { $type: 'dimension' };
  const items = collection(name).variables
    .map((v) => ({ key: v.n.split('/')[1], px: v.v[0], d: v.d }))
    .sort((a, b) => a.px - b.px);
  for (const { key, px, d } of items) out[key] = { $value: `${px}px`, ...(d ? { $description: d } : {}) };
  return { [prefix]: { $description: describe, ...out } };
};
const dimension = {
  ...scale('Spacings', 'space', 'Spacing scale in px. Same steps as Tailwind\'s numeric scale (4px = p-1), so components use p-*/gap-* utilities.'),
  ...scale('Radius', 'radius', 'Corner radius in px. radius.full is the pill shape.'),
  ...scale('Stroke', 'stroke-width', 'Stroke / border widths in px. 1.5px is named 1-5 because "." is not allowed in token names.'),
};

/* ---------- typography: families, weights, sizes (+ desktop mode) ---------- */
const typo = collection('Typography');
const MOBILE = typo.modes.indexOf('Mobile');
const DESKTOP = typo.modes.indexOf('Desktop');
const FALLBACK = ['system-ui', 'sans-serif'];
const WEIGHT = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 };
const typography = {
  font: {
    family: {
      $type: 'fontFamily',
      $description: 'Font families. font.family.sans is the slot every brand points at its own UI face (GDL default: Poppins). numeric is for dense figures and tabular numbers.',
    },
    weight: { $type: 'fontWeight' },
    size: { $type: 'dimension', $description: 'Type sizes, Mobile mode (the default every Figma text style resolves to). Desktop sizes are in tokens/modes/typography.desktop.json.' },
  },
};
const desktopSizes = {};
const sizeOf = {}; // tier → [Mobile, Desktop] px
const metricVars = { 'line-height': {}, 'letter-spacing': {} }; // kind → tier → [Mobile, Desktop] px
for (const v of typo.variables) {
  const [, kind, raw] = v.n.split('/');
  const key = kebab(raw);
  if (kind === 'family') typography.font.family[key] = { $value: [v.v[MOBILE], ...FALLBACK] };
  else if (kind === 'weight') {
    if (!(key in WEIGHT)) throw new Error(`Unknown weight ${v.n}`);
    typography.font.weight[key] = { $value: WEIGHT[key] };
  } else if (kind === 'size') {
    typography.font.size[key] = { $value: `${v.v[MOBILE]}px`, ...(v.d ? { $description: v.d } : {}) };
    desktopSizes[key] = { $value: `${v.v[DESKTOP]}px` };
    sizeOf[key] = [v.v[MOBILE], v.v[DESKTOP]];
  } else if (kind in metricVars) metricVars[kind][key] = [v.v[MOBILE], v.v[DESKTOP]];
  else throw new Error(`${v.n}: the importer doesn't know Typography variables of kind "${kind}" — teach scripts/import-figma.mjs about it rather than dropping it`);
}
typography.font.family.sans = { $value: '{font.family.poppins}', $description: 'The UI face. Brands override this one token (e.g. CAF → Inter, VCP → Poppins).' };
typography.font.family.numeric = { $value: '{font.family.inter}', $description: 'Dense numerics and tabular figures.' };
/* Stable order: weights light → bold, sizes small → large. */
typography.font.weight = Object.fromEntries([['$type', 'fontWeight'], ...Object.keys(WEIGHT).map((k) => [k, typography.font.weight[k]])]);
const bySize = (o) => Object.fromEntries(Object.entries(o).sort(([ka, a], [kb, b]) => (ka.startsWith('$') ? -1 : kb.startsWith('$') ? 1 : parseFloat(a.$value) - parseFloat(b.$value) || ka.localeCompare(kb))));
typography.font.size = bySize(typography.font.size);

/* Type metrics per tier (see "Type metrics" at the top). Tiers run display →
 * caption, large → small within a group, the order of the ramp below. */
const TIER_GROUPS = ['display', 'heading', 'title', 'body', 'label', 'caption'];
const tiers = Object.keys(sizeOf).sort((a, b) => {
  const [ga, gb] = [a, b].map((t) => TIER_GROUPS.indexOf(t.split('-')[0]));
  return ga - gb || sizeOf[b][0] - sizeOf[a][0] || a.localeCompare(b);
});
for (const t of tiers) if (TIER_GROUPS.indexOf(t.split('-')[0]) < 0) throw new Error(`font/size/${t}: unknown type tier group — add it to TIER_GROUPS in scripts/import-figma.mjs`);
const round4 = (x) => +x.toFixed(4);
const near = (a, b) => Math.abs(a - b) < 5e-4;
/** { px } when the same in every mode, { ratio } (of the font size) when it scales with the size. */
const metricOf = (kind, tier) => {
  const values = metricVars[kind][tier];
  if (!values) throw new Error(`font/size/${tier} has no font/${kind}/${tier} variable in the Figma Typography collection — every tier needs both metrics`);
  const [m, d] = values;
  if (near(m, d)) return { px: round4(m) };
  const [rm, rd] = [m / sizeOf[tier][0], d / sizeOf[tier][1]];
  if (near(rm, rd)) return { ratio: round4(rm) };
  throw new Error(`font/${kind}/${tier}: Mobile ${m} and Desktop ${d} are neither the same nor the same multiple of the font size (${sizeOf[tier].join(' / ')}) — change every mode together`);
};
const metrics = {}; // tier → { lineHeight, letterSpacing } in the ramp's form
for (const tier of tiers) {
  const lh = metricOf('line-height', tier);
  const ls = metricOf('letter-spacing', tier);
  metrics[tier] = {
    lineHeight: 'ratio' in lh ? lh.ratio : `${lh.px}px`,
    letterSpacing: 'ratio' in ls ? `${ls.ratio}em` : `${ls.px}px`,
  };
}
typography.font['line-height'] = {
  $description: 'Line height per type tier, from font/line-height/* in the Figma Typography collection; the type ramp (type.*) carries the same values. A tier whose Figma value scales with its font size in every mode ships unitless, one that is the same in every mode ships in px, so neither needs a desktop override.',
  ...Object.fromEntries(tiers.map((t) => [t, { $type: typeof metrics[t].lineHeight === 'number' ? 'number' : 'dimension', $value: metrics[t].lineHeight }])),
};
typography.font['letter-spacing'] = {
  $description: 'Letter spacing per type tier, from font/letter-spacing/* in the Figma Typography collection; the type ramp (type.*) carries the same values. A tier whose Figma value scales with its font size in every mode ships in em, one that is the same in every mode ships in px.',
  $type: 'dimension',
  ...Object.fromEntries(tiers.map((t) => [t, { $value: metrics[t].letterSpacing }])),
};

const typographyDesktop = {
  desktop: {
    $description: 'Desktop mode of the GDL Typography collection. Emitted as opt-in --font-size-* overrides (dist/typography.desktop.css); the type ramp itself ships Mobile sizes until a breakpoint strategy is agreed.',
    font: { size: { $type: 'dimension', ...bySize(desktopSizes) } },
  },
};

/* ---------- type ramp: the 47 text styles ---------- */
const WEIGHT_OF_STYLE = { Bold: 'bold', SemiBold: 'semibold', Medium: 'medium', Regular: 'regular', Light: 'light' };
const type = {};
const weightOrder = ['bold', 'semibold', 'medium', 'regular', 'light'];
const rows = styles.text.map(([name, , style, size, sizeVar]) => {
  const [group, rest] = name.split('/');
  const [sizeName, weightName] = rest.split('-');
  const tier = `${group.toLowerCase()}-${sizeName}`;
  const weight = WEIGHT_OF_STYLE[style];
  if (weight !== weightName) throw new Error(`${name}: name says ${weightName} but the font style is ${style}`);
  if (!metrics[tier]) throw new Error(`${name}: no font/size/${tier} (and so no metrics) in the Figma Typography collection`);
  return { tier, weight, size, sizeVar };
});
rows.sort((a, b) => tiers.indexOf(a.tier) - tiers.indexOf(b.tier) || weightOrder.indexOf(a.weight) - weightOrder.indexOf(b.weight));
for (const { tier, weight, size, sizeVar } of rows) {
  const m = metrics[tier];
  type[`${tier}-${weight}`] = {
    $type: 'typography',
    $value: {
      fontFamily: '{font.family.sans}',
      fontSize: `${size}px`,
      lineHeight: m.lineHeight,
      fontWeight: `{font.weight.${weight}}`,
      /* No tracking (0) is left out, so the style inherits it, as the ramp always has. */
      ...(m.letterSpacing !== '0px' ? { letterSpacing: m.letterSpacing } : {}),
    },
    ...(sizeVar ? { $extensions: { 'com.figma': { fontSizeVariable: sizeVar } } } : {}),
  };
}

/* ---------- elevation: effect styles → shadow.elevation.<n> (+ dark) ---------- */
const layers = (list) => list.map(([x, y, blur, spread, a]) => ({
  color: `#000000${Math.round(a * 255).toString(16).padStart(2, '0')}`,
  offsetX: `${x}px`, offsetY: `${y}px`, blur: `${blur}px`, spread: `${spread}px`,
}));
const elevation = { shadow: { elevation: { $type: 'shadow', $description: 'Elevation 1–7 from the GDL Figma effect styles (Effects/Elevation Light/*). Dark values are in tokens/modes/elevation.dark.json.' } } };
const elevationDark = { dark: { shadow: { elevation: { $type: 'shadow' } } } };
for (const [name, list] of Object.entries(styles.effects)) {
  const [theme, level] = name.split('/');
  const target = theme === 'Light' ? elevation.shadow.elevation : elevationDark.dark.shadow.elevation;
  target[level] = { $value: layers(list) };
}

/* ---------- write ---------- */
write('tokens/core/color.json', { color });
write('themes/reference/primitives.json', {
  $description: 'Generated by `npm run import:figma` — do not edit. Colour primitives the GDL Figma file hides from publishing: GDL\'s placeholder brand slot and other reference-only ramps. GDL\'s own build, reference theme and Storybook use them; brands never receive them.',
  color: referenceColor,
});
write('tokens/core/dimension.json', dimension);
write('tokens/core/typography.json', typography);
write('tokens/core/elevation.json', elevation);
write('tokens/modes/typography.desktop.json', typographyDesktop);
write('tokens/modes/elevation.dark.json', elevationDark);
write('tokens/semantic/type.json', { type });

const count = (o) => Object.entries(o).filter(([k]) => !k.startsWith('$')).reduce((n, [, v]) => n + ('$value' in v ? 1 : count(v)), 0);
console.log(`colours ${count({ color })} (+${count({ color: referenceColor })} reference only: ${Object.keys(referenceColor).filter((k) => !k.startsWith('$')).join(', ')}) · dimensions ${count(dimension)} · font tokens ${count(typography)} · type styles ${Object.keys(type).length} · elevations ${count(elevation)}+${count(elevationDark)}`);
