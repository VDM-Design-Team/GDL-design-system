import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  tokens, contract, get, aliasOf, semanticNames, tierOf, extensionPatternOf, recommendedNames,
  Page, Section, Code, Chip,
} from './lib';

const meta: Meta = { title: 'Contract/Semantic colour' };
export default meta;

const light = (name: string) => get(tokens, name.split('.')) as string | undefined;
const dark = (name: string) => get(tokens.dark, name.split('.')) as string | undefined;

const ModeCell = ({ name, mode }: { name: string; mode: 'light' | 'dark' }) => {
  const v = mode === 'light' ? light(name) : dark(name);
  if (!v) return <span className="text-caption-md-semibold text-accent-critical-outline-content-default">missing</span>;
  return (
    <div className="flex items-center gap-2">
      <Chip value={v} size={20} />
      <span className="text-caption-md-regular text-text-secondary">
        {v} · {aliasOf(mode, name.split('.'))}
      </span>
    </div>
  );
};

const COLUMNS = { gridTemplateColumns: 'minmax(260px,1.2fr) 1fr 1fr' };

const Rows = ({ names, notes }: { names: string[]; notes?: Record<string, string> }) => (
  <div>
    <div className="grid gap-4 pb-1 border-b border-stroke-default text-caption-md-semibold text-text-secondary" style={COLUMNS}>
      <div>Name</div>
      <div>Light</div>
      <div>Dark</div>
    </div>
    {names.map((n) => (
      <div key={n} className="grid gap-4 py-2 border-b border-stroke-default items-center" style={COLUMNS}>
        <div>
          <Code>{n}</Code>
          {notes?.[n] && <div className="text-caption-md-regular text-text-secondary">{notes[n]}</div>}
        </div>
        <ModeCell name={n} mode="light" />
        <ModeCell name={n} mode="dark" />
      </div>
    ))}
  </div>
);

const Stat = ({ value, label }: { value: number | string; label: string }) => (
  <div className="border border-stroke-default rounded-8 p-4 bg-surface-base">
    <div className="text-heading-lg-semibold">{value}</div>
    <div className="text-caption-md-regular text-text-secondary">{label}</div>
  </div>
);

const Contract = () => {
  const names = semanticNames();
  const covered = contract.required.filter((n) => light(n) && dark(n)).length;
  const outside = names.filter((n) => tierOf(n) === 'outside');
  return (
    <Page
      title="Semantic colour contract"
      intro={
        <>
          <Code>contract/semantic-color.json</Code>: the names every brand defines, in light and dark. Brands check
          themselves against it in CI with <Code>gdl-check-contract</Code>. Values here are GDL's reference theme
          (placeholder semantics on the brand slot), with the core colour each one points at.
        </>
      }
    >
      <div className="grid gap-2 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))' }}>
        <Stat value={contract.required.length} label="required names" />
        <Stat value={recommendedNames.length} label="recommended names" />
        <Stat value={Object.keys(contract.extensions).length} label="extension patterns" />
        <Stat value={`${covered}/${contract.required.length}`} label="required, defined in both modes by the reference theme" />
      </div>

      <Section
        title="Recommended"
        note="Expected unless a brand has a reason to leave it out. Missing ones are a warning, and an error only with --strict."
      >
        <Rows names={recommendedNames} notes={contract.recommended} />
      </Section>

      <Section
        title="Extensions"
        note={
          <>
            Known names only one brand uses today. Allowed; promoted to required when a second brand needs one.
            {!names.some(extensionPatternOf) && " The reference theme doesn't use any of them."}
          </>
        }
      >
        <div className="border-t border-stroke-default">
          {Object.entries(contract.extensions).map(([p, note]) => {
            const matches = names.filter((n) => extensionPatternOf(n) === p);
            return (
              <div key={p} className="grid gap-4 py-2 border-b border-stroke-default" style={{ gridTemplateColumns: 'minmax(260px,1fr) 2fr' }}>
                <Code>{p}</Code>
                <div className="text-caption-md-regular text-text-secondary">
                  {note}
                  {matches.length > 0 && <> · reference theme: {matches.join(', ')}</>}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {outside.length > 0 && (
        <Section title="Outside the contract" note="Defined by the reference theme but in no tier. Reported by the check, not an error.">
          <Rows names={outside} />
        </Section>
      )}

      <Section title="Required" note="Missing any of these in light or dark fails a brand's check.">
        {contract.roots.map((root) => {
          const group = contract.required.filter((n) => n.startsWith(`${root}.`));
          return (
            <details key={root} open className="mb-4">
              <summary className="text-title-sm-semibold cursor-pointer mb-2">
                {root} <span className="text-caption-md-regular text-text-secondary">({group.length})</span>
              </summary>
              <Rows names={group} />
            </details>
          );
        })}
      </Section>
    </Page>
  );
};

export const ContractStory: StoryObj = { name: 'Contract', render: () => <Contract /> };
