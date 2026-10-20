import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens, Page, Section, Code, Tag } from './lib';

const meta: Meta = { title: 'Foundations/Typography' };
export default meta;

type Style = {
  fontFamily: string[];
  fontSize: string;
  lineHeight: string | number;
  fontWeight: number;
  letterSpacing?: string;
};

const TIERS = ['display', 'heading', 'title', 'body', 'label', 'caption'];
const desktopSize = (style: string) =>
  (tokens.desktop.font.size as Record<string, string>)[style.split('-').slice(0, 2).join('-')];

const Ramp = () => {
  const styles = Object.entries(tokens.type) as [string, Style][];
  return (
    <Page
      title="Type ramp"
      intro={
        <>
          {styles.length} styles. Each <Code>text-*</Code> utility sets size, line height, weight and tracking together,
          so pick a style rather than a size. Sizes are the default (mobile) scale. Where the desktop scale differs it's listed
          too: that's the opt-in <Code>data-type-scale="desktop"</Code> scale, not yet wired into the utilities.
        </>
      }
    >
      {TIERS.map((tier) => (
        <Section key={tier} title={tier}>
          <div className="border-t border-stroke-default">
            {styles
              .filter(([k]) => k.startsWith(`${tier}-`))
              .map(([k, s]) => (
                <div key={k} className="flex items-baseline gap-4 py-3 border-b border-stroke-default">
                  <div className="w-56 shrink-0">
                    <Code>text-{k}</Code>
                    <div className="text-caption-md-regular text-text-secondary">
                      {s.fontSize} / {s.lineHeight} · {s.fontWeight}
                      {s.letterSpacing && s.letterSpacing !== '0px' && <> · {s.letterSpacing}</>}
                      {desktopSize(k) && desktopSize(k) !== s.fontSize && <> · desktop {desktopSize(k)}</>}
                    </div>
                  </div>
                  <div
                    className="min-w-0 truncate"
                    style={{
                      fontFamily: s.fontFamily.join(','),
                      fontSize: s.fontSize,
                      lineHeight: s.lineHeight,
                      fontWeight: s.fontWeight,
                      letterSpacing: s.letterSpacing,
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              ))}
          </div>
        </Section>
      ))}
    </Page>
  );
};

const SLOTS: Record<string, string> = {
  sans: 'The UI face. Each brand points this slot at its own family.',
  numeric: 'Figures in tables and data.',
};

const Families = () => (
  <Page
    title="Font families"
    intro={
      <>
        <Code>font.family.sans</Code> and <Code>font.family.numeric</Code> are slots brands repoint; the rest are named
        faces. Gotham Pro and Gotham Rounded are licensed and not loaded in this Storybook, so they show a fallback here.
      </>
    }
  >
    <div className="border-t border-stroke-default">
      {Object.entries(tokens.font.family).map(([k, stack]) => (
        <div key={k} className="flex items-center gap-4 py-4 border-b border-stroke-default">
          <div className="w-56 shrink-0">
            <div className="text-body-sm-medium">
              {k} {SLOTS[k] && <Tag>slot</Tag>}
            </div>
            <Code>font-{k}</Code>
            <div className="text-caption-md-regular text-text-secondary">{(stack as string[]).join(', ')}</div>
            {SLOTS[k] && <div className="text-caption-md-regular text-text-secondary">{SLOTS[k]}</div>}
          </div>
          <div className="min-w-0 text-[28px] leading-[1.3]" style={{ fontFamily: (stack as string[]).join(',') }}>
            Aa Bb Cc Gg Qq Rr 0123456789
          </div>
        </div>
      ))}
    </div>
    <Section title="Weights" note="font.weight.* → font-* utilities.">
      <div className="flex flex-wrap gap-6">
        {Object.entries(tokens.font.weight).map(([k, w]) => (
          <div key={k}>
            <div className="text-[28px]" style={{ fontWeight: w as number }}>
              Aa
            </div>
            <div className="text-caption-md-regular text-text-secondary">
              {k} · {w as number}
            </div>
          </div>
        ))}
      </div>
    </Section>
  </Page>
);

export const TypeRamp: StoryObj = { name: 'Type ramp', render: () => <Ramp /> };
export const FontFamilies: StoryObj = { name: 'Font families', render: () => <Families /> };
