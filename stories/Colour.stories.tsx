import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  tokens, contract, valueIn, aliasOf, familyNote, isReferenceOnly, semanticNames, tierOf, utilityFor,
  Page, Section, Grid, Code, Chip, Tag, type Mode,
} from './lib';

const meta: Meta = { title: 'Foundations/Colour' };
export default meta;

const ROOT_NOTES: Record<string, string> = {
  text: 'Text and icon colour → text-text-*',
  surface: 'Backgrounds → bg-surface-*',
  stroke: 'Borders and dividers → border-stroke-*',
  action: 'Interactive controls by prominence, part and state. surface → bg-, content → text-, border → border-.',
  neutral: 'Non-brand controls (filters, chips, toggles) by style, part and state.',
  accent: 'Status and category colours: info, success, warning, critical and the rest.',
};

const SemanticSwatch = ({ path, mode }: { path: string[]; mode: Mode }) => {
  const name = path.join('.');
  const value = valueIn(mode, path) as string;
  const tier = tierOf(name);
  return (
    <div className="flex items-start gap-2 border border-stroke-default rounded-8 p-2 bg-surface-base">
      <Chip value={value} />
      <div className="min-w-0">
        <div className="text-body-sm-medium break-words">
          {path.at(-1)} {tier !== 'required' && <Tag>{tier}</Tag>}
        </div>
        <div className="text-caption-md-regular text-text-secondary">
          {value}
          {aliasOf(mode, path) && <> · {aliasOf(mode, path)}</>}
        </div>
        <Code>{utilityFor(path)}</Code>
      </div>
    </div>
  );
};

const Semantic = ({ mode }: { mode: Mode }) => {
  const names = semanticNames();
  return (
    <Page
      title="Semantic colour"
      intro={
        <>
          The {contract.required.length} names every brand defines, shown with GDL's <b>reference theme</b>: placeholder
          values on the pink brand slot (<Code>color.primary</Code>). A brand keeps the names and supplies its own values,
          so a component styled with these works in every brand. Each swatch shows its {mode} value, the core colour it
          points at, and the Tailwind utility. Switch Light/Dark in the toolbar.
        </>
      }
    >
      {contract.roots.map((root) => {
        const groups = new Map<string, string[][]>();
        for (const n of names.filter((n) => n.startsWith(`${root}.`))) {
          const path = n.split('.');
          const key = path.slice(0, -1).join('.');
          groups.set(key, [...(groups.get(key) ?? []), path]);
        }
        // The root's own tokens (text.primary, surface.canvas…) first, then its families.
        const ordered = [...groups].sort(([a], [b]) => Number(b === root) - Number(a === root));
        return (
          <Section key={root} title={root} note={ROOT_NOTES[root]}>
            {ordered.map(([key, paths]) => (
              <div key={key}>
                {key !== root && <h3 className="text-title-sm-semibold text-text-secondary mb-2">{key}</h3>}
                <Grid min={240}>
                  {paths.map((p) => (
                    <SemanticSwatch key={p.join('.')} path={p} mode={mode} />
                  ))}
                </Grid>
              </div>
            ))}
          </Section>
        );
      })}
    </Page>
  );
};

const Palette = () => (
  <Page
    title="Core palette"
    intro={
      <>
        The primitive ramps semantic tokens point at. Components don't use these directly (they're hidden from Figma's
        pickers); reach for a semantic token instead. Core colours don't change between light and dark: the semantic
        layer picks different steps. Ramps marked <Tag>reference only</Tag> are hidden from publishing in GDL Figma, so
        brands never receive them. Each brand uses its own brand ramp instead.
      </>
    }
  >
    {Object.entries(tokens.color).map(([family, ramp]) => (
      <Section
        key={family}
        title={
          <>
            {family} {family === 'primary' && <Tag>brand slot</Tag>} {isReferenceOnly(family) && <Tag>reference only</Tag>}
          </>
        }
        note={
          <>
            {familyNote(family)}{' '}
            {!isReferenceOnly(family) && (
              <span className="whitespace-nowrap">
                <Code>bg-{family}-*</Code>
              </span>
            )}
          </>
        }
      >
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(56px,1fr))' }}>
          {Object.entries(ramp as Record<string, string>).map(([step, value]) => (
            <div key={step}>
              <div className="h-14 rounded-6 border border-stroke-default" style={{ background: value }} />
              <div className="text-caption-md-semibold mt-1">{step}</div>
              <div className="text-caption-sm-regular text-text-secondary">{value}</div>
            </div>
          ))}
        </div>
      </Section>
    ))}
  </Page>
);

export const SemanticColours: StoryObj = {
  name: 'Semantic',
  render: (_args, { globals }) => <Semantic mode={globals.theme as Mode} />,
};

export const CorePalette: StoryObj = {
  name: 'Core palette',
  render: () => <Palette />,
};
