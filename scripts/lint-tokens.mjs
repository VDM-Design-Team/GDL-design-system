/**
 * Checks GDL's own token files:
 *
 * 1. Every `{reference}` in tokens/ and themes/ resolves.
 * 2. Token names are lower-case kebab segments (they become CSS variable and
 *    Tailwind class names in every brand).
 * 3. Colour families in tokens/core/color.json are on the allow-list below.
 *    GDL is the parent of every brand, so it holds no brand colours except
 *    the brand slot. Adding a family means editing this list in the same PR,
 *    which puts the decision in front of a reviewer.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED_FAMILIES = {
  primary: 'the brand slot (placeholder each brand replaces)',
  secondary: 'origin unknown — kept from Figma, not used by VCP/CAF; remove once confirmed',
  neutral: 'shared gray',
  slate: 'shared neutral used by VCP and CAF',
  monochrome: 'white / black / transparent',
  green: 'status', red: 'status', yellow: 'status', blue: 'status', orange: 'status',
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

const families = Object.keys(JSON.parse(readFileSync('tokens/core/color.json', 'utf8')).color).filter((k) => !k.startsWith('$'));
for (const f of families) if (!(f in ALLOWED_FAMILIES)) fail(`tokens/core/color.json: colour family "${f}" is not on the allow-list in scripts/lint-tokens.mjs — GDL holds no brand colours except the brand slot`);

if (failed) process.exit(1);
console.log(`✔ ${all.size} tokens: names valid, references resolve, ${families.length} colour families on the allow-list`);
