/**
 * Shared pieces for the GDL foundations stories. Every value on these pages
 * is read from the build output (dist/tokens.json) or the token sources it
 * was built from — nothing is typed in by hand, so a token change shows up
 * here on the next `npm run storybook`.
 */
import type { ReactNode } from 'react';
import tokens from '../dist/tokens.json';
import coreColor from '../tokens/core/color.json';
import referenceColor from '../themes/reference/primitives.json';
import refLight from '../themes/reference/color.json';
import refDark from '../themes/reference/color.dark.json';
import contract from '../contract/semantic-color.json';

export { tokens, contract };
export type Mode = 'light' | 'dark';

type Tree = { [key: string]: unknown };

export const get = (obj: unknown, path: string[]): unknown =>
  path.reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Tree)[k] : undefined), obj);

/** The resolved value for a token path in a mode; dark falls back to light where it has no override. */
export const valueIn = (mode: Mode, path: string[]) =>
  (mode === 'dark' ? get(tokens.dark, path) : undefined) ?? get(tokens, path);

/**
 * What the reference theme points a semantic path at, e.g. `{color.slate.500}` → `slate.500`.
 * A few semantics (link colours, overlays) are raw values rather than references.
 */
export const aliasOf = (mode: Mode, path: string[]) => {
  const src = mode === 'dark' ? get(refDark, ['dark', ...path]) : get(refLight, path);
  const v = (src as { $value?: string } | undefined)?.$value;
  if (!v) return undefined;
  return v.match(/^\{color\.(.+)\}$/)?.[1] ?? 'raw value';
};

/** `$description` on a core colour family, from tokens/core/color.json. */
export const familyNote = (family: string) =>
  (get(coreColor, ['color', family, '$description']) ?? get(referenceColor, ['color', family, '$description'])) as string ?? '';

/** True for a family GDL keeps to itself: hidden from publishing in Figma, so brands never receive it. */
export const isReferenceOnly = (family: string) => get(referenceColor, ['color', family]) !== undefined;

/** Every string leaf under a token tree, as paths. */
export const leaves = (obj: unknown, prefix: string[] = []): string[][] =>
  Object.entries(obj as Tree).flatMap(([k, v]) =>
    k.startsWith('$') ? [] : typeof v === 'object' && v && !Array.isArray(v) ? leaves(v, [...prefix, k]) : [[...prefix, k]],
  );

/* ------------------------------------------------------------------ *
 * Contract tiers — same matching as scripts/check-contract.mjs:
 * `*` in an extension pattern spans one or more characters, dots included.
 * ------------------------------------------------------------------ */
const toRegex = (pattern: string) =>
  new RegExp(`^${pattern.split('.').map((s) => (s === '*' ? '.+' : s.replace(/[-/\\^$+?()|[\]{}]/g, '\\$&'))).join('\\.')}$`);
const extensionRegexes = Object.keys(contract.extensions).map((p) => [p, toRegex(p)] as const);
export const recommendedNames = Object.keys(contract.recommended);

export type Tier = 'required' | 'recommended' | 'extension' | 'outside';
export const tierOf = (name: string): Tier =>
  contract.required.includes(name)
    ? 'required'
    : recommendedNames.includes(name)
      ? 'recommended'
      : extensionRegexes.some(([, r]) => r.test(name))
        ? 'extension'
        : 'outside';
export const extensionPatternOf = (name: string) => extensionRegexes.find(([, r]) => r.test(name))?.[0];

/** The semantic names the reference theme defines, light and dark together. */
export const semanticNames = (): string[] => {
  const names = new Set<string>();
  for (const root of contract.roots) {
    for (const p of leaves(get(tokens, [root]), [root])) names.add(p.join('.'));
    for (const p of leaves(get(tokens.dark, [root]) ?? {}, [root])) names.add(p.join('.'));
  }
  return [...names];
};

/** Tailwind utility for a semantic colour, following the part it styles. */
export const utilityFor = (path: string[]) => {
  const name = `${path.join('-')}`;
  const [root] = path;
  if (root === 'surface') return `bg-${name}`;
  if (root === 'text') return `text-${name}`;
  if (root === 'stroke') return `border-${name}`;
  if (path.includes('content')) return `text-${name}`;
  if (path.includes('border')) return `border-${name}`;
  return `bg-${name}`;
};

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */
export const Page = ({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) => (
  <div className="p-8 max-w-[1400px] text-text-primary">
    <h1 className="text-heading-xl-semibold mb-2">{title}</h1>
    {intro && <div className="text-body-md-regular text-text-secondary mb-8 max-w-[760px]">{intro}</div>}
    {children}
  </div>
);

export const Section = ({ title, note, children }: { title: ReactNode; note?: ReactNode; children: ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-title-md-semibold mb-1">{title}</h2>
    {note && <p className="text-body-sm-regular text-text-secondary mb-3 max-w-[760px]">{note}</p>}
    {children}
  </section>
);

export const Grid = ({ min = 200, children }: { min?: number; children: ReactNode }) => (
  <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: `repeat(auto-fill,minmax(${min}px,1fr))` }}>
    {children}
  </div>
);

export const Code = ({ children }: { children: ReactNode }) => (
  <code className="text-caption-md-regular text-text-secondary font-mono break-words">{children}</code>
);

/** Checkerboard under a swatch, so transparent and translucent values read as such. */
const CHECKER = {
  backgroundImage:
    'linear-gradient(45deg,#0000001a 25%,transparent 25%),linear-gradient(-45deg,#0000001a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#0000001a 75%),linear-gradient(-45deg,transparent 75%,#0000001a 75%)',
  backgroundSize: '10px 10px',
  backgroundPosition: '0 0,0 5px,5px -5px,-5px 0',
};

export const Chip = ({ value, size = 40 }: { value: string; size?: number }) => (
  <div className="rounded-4 border border-stroke-default shrink-0 overflow-hidden" style={{ width: size, height: size, ...CHECKER }}>
    <div className="size-full" style={{ background: value }} />
  </div>
);

export const Tag = ({ children }: { children: ReactNode }) => (
  <span className="inline-block rounded-4 border border-stroke-default px-1 text-caption-sm-regular text-text-secondary align-middle">
    {children}
  </span>
);
