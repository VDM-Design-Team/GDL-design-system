/**
 * Checks GDL's own token files:
 *
 * 1. Every `{reference}` in tokens/ and themes/ resolves.
 * 2. Token names are lower-case kebab segments (they become CSS variable and
 *    Tailwind class names in every brand).
 * 3. Colour families in tokens/core/color.json (shipped to every brand) are on
 *    the allow-list below. GDL is the parent of every brand, so it ships no
 *    brand colours at all. Adding a family means editing this list in the
 *    same PR, which puts the decision in front of a reviewer.
 * 4. Reference-only families (themes/reference/primitives.json: hidden from
 *    publishing in Figma, never shipped to brands) are on their own list, and
 *    no family is in both files.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED_FAMILIES = {
  neutral: 'shared gray',
  slate: 'shared neutral used by VCP and CAF',
  monochrome: 'white / black / transparent',
  green: 'status', red: 'status', yellow: 'status', blue: 'status', orange: 'status',
};
const REFERENCE_ONLY_FAMILIES = {
  primary: 'the brand slot: GDL\'s placeholder brand ramp; each brand uses its own',
  secondary: 'origin unknown; no brand uses it',
};

const files = (dir) => readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.json')).map((f) => join(dir, f));
const tokensIn = (node, path = [], out = new Map()) => {
  for (const [k, v] of Object.entries(node ?? {})) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if ('$value' in v) out.set([...path, k], v.$value);
    else tokensIn(v, [...path, k], out);
  }
  return out;
};

const all = new Map();
for (const f of [...files('tokens'), ...files('themes')]) {
  for (const [path, value] of tokensIn(JSON.parse(readFileSync(f, 'utf8')))) all.set(path.join('.'), { path, value, file: f });
}

let failed = 0;
const fail = (m) => { console.error(`✖ ${m}`); failed++; };
const MODE_ROOTS = ['dark', 'desktop'];
const known = new Set([...all.keys()].map((k) => k.split('.')).map((p) => (MODE_ROOTS.includes(p[0]) ? p.slice(1) : p).join('.')));

const refsIn = (v) => (typeof v === 'string' ? [...v.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]) : v && typeof v === 'object' ? Object.values(v).flatMap(refsIn) : []);
for (const { path, value, file } of all.values()) {
  for (const seg of path) if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(seg)) fail(`${file}: ${path.join('.')} — "${seg}" is not lower-case kebab`);
  for (const ref of refsIn(value)) if (!known.has(ref)) fail(`${file}: ${path.join('.')} → {${ref}} does not resolve`);
}

const familiesOf = (file) => Object.keys(JSON.parse(readFileSync(file, 'utf8')).color).filter((k) => !k.startsWith('$'));
const families = familiesOf('tokens/core/color.json');
for (const f of families) if (!(f in ALLOWED_FAMILIES)) fail(`tokens/core/color.json: colour family "${f}" is not on the allow-list in scripts/lint-tokens.mjs — GDL ships no brand colours`);
const referenceFamilies = familiesOf('themes/reference/primitives.json');
for (const f of referenceFamilies) {
  if (!(f in REFERENCE_ONLY_FAMILIES)) fail(`themes/reference/primitives.json: colour family "${f}" is not on the reference-only list in scripts/lint-tokens.mjs`);
  if (families.includes(f)) fail(`colour family "${f}" is both shipped (tokens/core) and reference-only (themes/reference)`);
}

if (failed) process.exit(1);
console.log(`✔ ${all.size} tokens: names valid, references resolve, ${families.length} shipped + ${referenceFamilies.length} reference-only colour families on their lists`);
