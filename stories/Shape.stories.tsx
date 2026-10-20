import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens, valueIn, Page, Section, Grid, Code, type Mode } from './lib';

const meta: Meta = { title: 'Foundations/Shape' };
export default meta;

type Shadow = { color: string; offsetX: string; offsetY: string; blur: string; spread: string };
const boxShadow = (layers: Shadow[]) =>
  layers.map((s) => `${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color}`).join(', ');

const Card = ({ children, label, value, util }: { children: ReactNode; label: string; value: string; util: string }) => (
  <div className="flex items-center gap-3 border border-stroke-default rounded-8 p-3 bg-surface-base">
    {children}
    <div className="min-w-0">
      <div className="text-body-sm-medium">{label}</div>
      <div className="text-caption-md-regular text-text-secondary break-words">{value}</div>
      <Code>{util}</Code>
    </div>
  </div>
);

const Shape = ({ mode }: { mode: Mode }) => (
  <Page title="Shape" intro="Corner radius, stroke width and elevation. Elevation has separate dark values; switch the theme in the toolbar.">
    <Section title="Radius" note="radius.<px> → rounded-<px>. radius.full is a pill.">
      <Grid min={200}>
        {Object.entries(tokens.radius).map(([k, v]) => (
          <Card key={k} label={`radius.${k}`} value={v} util={`rounded-${k}`}>
            <div className="size-14 shrink-0 bg-surface-brand-strong" style={{ borderRadius: v }} />
          </Card>
        ))}
      </Grid>
    </Section>

    <Section
      title="Stroke width"
      note={
        <>
          stroke-width.&lt;px&gt; (1.5px is <Code>stroke-width.1-5</Code>, since token names can't contain a dot). Not
          mapped to Tailwind utilities; use the custom property from <Code>tokens.css</Code>.
        </>
      }
    >
      <Grid min={200}>
        {Object.entries(tokens['stroke-width']).map(([k, v]) => (
          <Card key={k} label={`stroke-width.${k}`} value={v} util={`--stroke-width-${k}`}>
            <div className="size-14 shrink-0 rounded-8 border-solid border-stroke-stronger" style={{ borderWidth: v }} />
          </Card>
        ))}
      </Grid>
    </Section>

    <Section title="Elevation" note="shadow.elevation.1–7 → shadow-elevation-<n>. Shown on surface.elevated.">
      <Grid min={240}>
        {Object.keys(tokens.shadow.elevation).map((k) => {
          const layers = valueIn(mode, ['shadow', 'elevation', k]) as Shadow[];
          return (
            <div key={k} className="p-4">
              <div className="h-24 rounded-12 bg-surface-elevated mb-3" style={{ boxShadow: boxShadow(layers) }} />
              <div className="text-body-sm-medium">shadow.elevation.{k}</div>
              <Code>shadow-elevation-{k}</Code>
              <div className="text-caption-sm-regular text-text-secondary break-words">{boxShadow(layers)}</div>
            </div>
          );
        })}
      </Grid>
    </Section>
  </Page>
);

export const ShapeStory: StoryObj = {
  name: 'Shape',
  render: (_args, { globals }) => <Shape mode={globals.theme as Mode} />,
};
