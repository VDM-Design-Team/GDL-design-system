#!/usr/bin/env node
/**
 * gdl-check-contract — checks a brand's semantic colour tokens against the
 * GDL contract (contract/semantic-color.json).
 *
 *   gdl-check-contract --light tokens/semantic/color.json \
 *                      --dark  tokens/semantic/color.dark.json [--dark-root dark] \
 *                      --core  tokens/core/color.json [--core …] \
 *                      [--strict] [--allow-brand-slot]
 *
 * Errors (exit 1):
 *   - a required name is missing in light or dark
 *   - a reference doesn't resolve to a GDL token, a brand core token, or
 *     another semantic token
 * Warnings (exit 1 only with --strict):
 *   - a recommended name is missing
 *   - a raw value (hex) instead of a reference
 *   - a reference to GDL's brand slot (color.primary / color.secondary):
 *     brands use their own ramp (--allow-brand-slot is for GDL's reference theme)
 * Info:
 *   - names outside required / recommended / extensions — fine, but worth
 *     proposing to GDL if another brand would need them
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const all = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));
const flag = (name) => args.includes(`--${name}`);
if (!opt('light') || flag('help')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, ''));
  process.exit(opt('light') ? 0 : 1);
}

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const contract = read(join(PKG, 'contract/semantic-color.json'));
const tokensIn = (node, path = [], out = new Map()) => {
  for (const [k, v] of Object.entries(node ?? {})) {
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if ('$value' in v || 'value' in v) out.set([...path, k].join('.'), v.$value ?? v.value);
    else tokensIn(v, [...path, k], out);
  }
  return out;
};
const semanticOnly = (map) => new Map([...map].filter(([p]) => contract.roots.includes(p.split('.')[0])));

const light = semanticOnly(tokensIn(read(opt('light'))));
const darkRoot = opt('dark-root') ?? 'dark';
const dark = opt('dark') ? semanticOnly(tokensIn(read(opt('dark'))[darkRoot] ?? read(opt('dark')))) : null;

/* Everything a reference may point at: GDL's shipped tokens, the brand's core files, and the semantic files themselves. */
const known = new Set();
for (const f of ['tokens/core/color.json', 'tokens/core/dimension.json', 'tokens/core/typography.json', 'tokens/core/elevation.json'])
  for (const p of tokensIn(read(join(PKG, f))).keys()) known.add(p);
for (const f of all('core')) for (const p of tokensIn(read(f)).keys()) known.add(p);
for (const p of light.keys()) known.add(p);

const toRegex = (pattern) => new RegExp(`^${pattern.split('.').map((s) => (s === '*' ? '.+' : s.replace(/[-/\\^$+?()|[\]{}]/g, '\\$&'))).join('\\.')}$`);
const extensionPatterns = Object.keys(contract.extensions).map((p) => [p, toRegex(p)]);
const required = new Set(contract.required);
const recommended = Object.keys(contract.recommended);

const errors = [], warnings = [], info = [];
const modes = [['light', light], ...(dark ? [['dark', dark]] : [])];
if (!dark) warnings.push('no --dark file given — dark mode not checked');

for (const [mode, map] of modes) {
  const missing = contract.required.filter((p) => !map.has(p));
  if (missing.length) errors.push(`${mode}: ${missing.length} required name(s) missing:\n    ${missing.join('\n    ')}`);
  for (const p of recommended) if (!map.has(p)) warnings.push(`${mode}: recommended ${p} missing — ${contract.recommended[p]}`);
  let raw = 0;
  for (const [p, v] of map) {
    const ref = typeof v === 'string' && v.match(/^\{(.+)\}$/);
    if (!ref) { raw++; continue; }
    if (!known.has(ref[1])) errors.push(`${mode}: ${p} → {${ref[1]}} does not resolve (not in GDL, the brand's --core files, or the semantic file)`);
    else if (/^color\.(primary|secondary)\./.test(ref[1]) && !flag('allow-brand-slot'))
      warnings.push(`${mode}: ${p} → {${ref[1]}} uses GDL's placeholder brand slot; point it at your brand ramp`);
  }
  if (raw) warnings.push(`${mode}: ${raw} raw value(s) instead of references (e.g. link colours, overlays) — fine if intentional`);
}

const extensionsUsed = {};
for (const p of light.keys()) {
  if (required.has(p) || recommended.includes(p)) continue;
  const hit = extensionPatterns.find(([, re]) => re.test(p));
  if (hit) extensionsUsed[hit[0]] = (extensionsUsed[hit[0]] ?? 0) + 1;
  else info.push(p);
}

const req = contract.required.length;
console.log(`GDL contract — ${req} required, ${recommended.length} recommended, ${Object.keys(contract.extensions).length} known extensions`);
console.log(`  light: ${light.size} semantic tokens${dark ? ` · dark: ${dark.size}` : ''}`);
if (Object.keys(extensionsUsed).length) console.log(`  extensions used: ${Object.entries(extensionsUsed).map(([k, n]) => `${k} (${n})`).join(', ')}`);
if (info.length) console.log(`  ℹ ${info.length} brand-specific name(s) outside the contract — propose to GDL if others need them:\n    ${info.join('\n    ')}`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
for (const e of errors) console.error(`  ✖ ${e}`);
if (errors.length || (flag('strict') && warnings.length)) process.exit(1);
console.log('✔ contract satisfied');
