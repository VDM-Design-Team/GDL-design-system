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
 *   figma-export/gdl-variables.json  every GDL variable collection
 *   figma-export/gdl-styles.json     text styles + elevation effect styles
 *   figma-export/type-metrics.json   line height / letter spacing per tier
 *                                    (Figma's styles use AUTO, so these are kept here)
 *
 * What it deliberately skips
 *   The "Components" collection (button/filled/enabled, text/brand_dark …).
 *   It is the GDL file's own legacy mini-semantics; the semantic contract in
 *   contract/ replaces it. GDL's Figma components still use it.
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
const metrics = read('figma-export/type-metrics.json');
const collection = (name) => {
  const c = vars.collections.find((x) => x.name === name);
  if (!c) throw new Error(`figma-export has no "${name}" collection`);
  return c;
};

/* ---------- colour: Primitives → color.<family>.<step> ---------- */
const color = { $type: 'color' };
const familyDescriptions = {};
for (const v of collection('Primitives').variables) {
  const [, family, step] = v.n.split('/');
  const value = v.v[0];
  if (typeof value !== 'string') throw new Error(`${v.n}: primitives must be raw colours, found ${JSON.stringify(value)}`);
  (familyDescriptions[family] ??= {})[v.d ?? ''] = ((familyDescriptions[family] ?? {})[v.d ?? ''] ?? 0) + 1;
  (color[family] ??= {})[step] = { $value: value, ...(v.d ? { $description: v.d } : {}) };
}
/* Lift the description most steps share to the family; keep only the ones that differ (e.g. green/800's fix note). */
for (const [family, counts] of Object.entries(familyDescriptions)) {
  const common = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  if (!common) continue;
  color[family] = { $description: common, ...color[family] };
  for (const [k, t] of Object.entries(color[family])) if (!k.startsWith('$') && t.$description === common) delete t.$description;
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
  }
}
typography.font.family.sans = { $value: '{font.family.poppins}', $description: 'The UI face. Brands override this one token (e.g. CAF → Inter, VCP → Poppins).' };
typography.font.family.numeric = { $value: '{font.family.inter}', $description: 'Dense numerics and tabular figures.' };
/* Stable order: weights light → bold, sizes small → large. */
typography.font.weight = Object.fromEntries([['$type', 'fontWeight'], ...Object.keys(WEIGHT).map((k) => [k, typography.font.weight[k]])]);
const bySize = (o) => Object.fromEntries(Object.entries(o).sort(([ka, a], [kb, b]) => (ka.startsWith('$') ? -1 : kb.startsWith('$') ? 1 : parseFloat(a.$value) - parseFloat(b.$value) || ka.localeCompare(kb))));
typography.font.size = bySize(typography.font.size);
const typographyDesktop = {
  desktop: {
    $description: 'Desktop mode of the GDL Typography collection. Emitted as opt-in --font-size-* overrides (dist/typography.desktop.css); the type ramp itself ships Mobile sizes until a breakpoint strategy is agreed.',
    font: { size: { $type: 'dimension', ...bySize(desktopSizes) } },
  },
};

/* ---------- type ramp: the 47 text styles ---------- */
const WEIGHT_OF_STYLE = { Bold: 'bold', SemiBold: 'semibold', Medium: 'medium', Regular: 'regular', Light: 'light' };
const type = {};
const tierOrder = Object.keys(metrics).filter((k) => !k.startsWith('$'));
const weightOrder = ['bold', 'semibold', 'medium', 'regular', 'light'];
const rows = styles.text.map(([name, , style, size, sizeVar]) => {
  const [group, rest] = name.split('/');
  const [sizeName, weightName] = rest.split('-');
  const tier = `${group.toLowerCase()}-${sizeName}`;
  const weight = WEIGHT_OF_STYLE[style];
  if (weight !== weightName) throw new Error(`${name}: name says ${weightName} but the font style is ${style}`);
  if (!metrics[tier]) throw new Error(`${name}: no metrics for tier ${tier} in figma-export/type-metrics.json`);
  return { tier, weight, size, sizeVar };
});
rows.sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier) || weightOrder.indexOf(a.weight) - weightOrder.indexOf(b.weight));
for (const { tier, weight, size, sizeVar } of rows) {
  const m = metrics[tier];
  type[`${tier}-${weight}`] = {
    $type: 'typography',
    $value: {
      fontFamily: '{font.family.sans}',
      fontSize: `${size}px`,
      lineHeight: m.lineHeight,
      fontWeight: `{font.weight.${weight}}`,
      ...(m.letterSpacing ? { letterSpacing: m.letterSpacing } : {}),
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
write('tokens/core/dimension.json', dimension);
write('tokens/core/typography.json', typography);
write('tokens/core/elevation.json', elevation);
write('tokens/modes/typography.desktop.json', typographyDesktop);
write('tokens/modes/elevation.dark.json', elevationDark);
write('tokens/semantic/type.json', { type });

const count = (o) => Object.entries(o).filter(([k]) => !k.startsWith('$')).reduce((n, [, v]) => n + ('$value' in v ? 1 : count(v)), 0);
console.log(`colours ${count({ color })} · dimensions ${count(dimension)} · font tokens ${count(typography)} · type styles ${Object.keys(type).length} · elevations ${count(elevation)}+${count(elevationDark)}`);
