import type { Meta, StoryObj } from '@storybook/react-vite';
import { tokens, Page, Code } from './lib';

const meta: Meta = { title: 'Foundations/Spacing' };
export default meta;

/** GDL names spacing in px; Tailwind's numeric scale is px ÷ 4, so space.16 is p-4. */
const twStep = (px: string) => String(parseFloat(px) / 4);

export const Spacing: StoryObj = {
  render: () => (
    <Page
      title="Spacing"
      intro={
        <>
          Spacing tokens are named in pixels (<Code>space.16</Code> = 16px) and match Tailwind's numeric scale, so
          components use the standard <Code>p-*</Code>, <Code>m-*</Code> and <Code>gap-*</Code> utilities: px ÷ 4. Each
          step is also a custom property in <Code>tokens.css</Code>.
        </>
      }
    >
      <div className="border-t border-stroke-default">
        {Object.entries(tokens.space).map(([k, v]) => (
          <div key={k} className="flex items-center gap-4 py-2 border-b border-stroke-default">
            <div className="w-28 shrink-0 text-body-sm-medium">space.{k}</div>
            <div className="w-16 shrink-0 text-caption-md-regular text-text-secondary">{v}</div>
            <div className="w-44 shrink-0">
              <Code>
                p-{twStep(v)} · gap-{twStep(v)}
              </Code>
            </div>
            <div className="h-4 rounded-2 bg-surface-brand-strong" style={{ width: v }} />
          </div>
        ))}
      </div>
    </Page>
  ),
};
