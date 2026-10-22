# Welcome to GDL — the General Design Library

GDL is the parent design system. VCP, CAF, BeyondFriends and WHU all build on
it: it holds the shared colour palette, spacing, radius, elevation, the type
ramp, and the list of semantic colour names every brand must define.

This is your setup, start to finish. It takes about ten minutes, and you do not
need a terminal or anything installed beyond Claude. **If you're already set up
on VCP, most of it is done**: the same Claude app, the same GitHub sign-in
inside Claude's browser, the same Chromatic sign-in. Read on for what's
different.

When something here doesn't work, paste the error to Claude, or ask **the
lead**.

---

## What you'll need

**For reading and reviewing** (steps 1–5):

| Tool | Where | Notes |
|---|---|---|
| A GitHub account | github.com | With the collaborator invite accepted (step 1) |
| Claude desktop app | https://claude.com/claude-code | Sign in with your work account |

**Only when you propose changes** (step 7):

| Tool | Where | Notes |
|---|---|---|
| Claude Code on the web | https://claude.ai/code | The one-time **authorize GitHub** click (same as VCP) |
| Edit access to the GDL Figma file | Ask the lead | Only for token changes. Tokens start in Figma |

**The sign-in trap (same as VCP):** Claude's browser window doesn't share
sign-ins with your everyday browser. If GitHub shows you logged out there, sign
in inside Claude's window yourself; Claude never asks for your password. For
Chromatic diff pages, click **Connect with GitHub** in that window.

---

## Step 1 — Accept the GitHub invitation

1. Check your GitHub email for an invitation to
   `VDM-Design-Team/GDL-design-system`, or go straight to
   https://github.com/VDM-Design-Team/GDL-design-system/invitations
2. Accept it.
3. Confirm it worked: https://github.com/VDM-Design-Team/GDL-design-system
   opens without a 404.

## Step 2 — Bookmark the two places you'll live

- **The repository**, where every change is proposed and lands:
  https://github.com/VDM-Design-Team/GDL-design-system
- **The published Storybook**, which shows GDL as it is right now and is
  rebuilt on every merge:
  https://main--6ad738a1d955b2bc270fdb8a.chromatic.com

## Step 3 — Know what you're looking at

GDL has **no components**. Components live in the brands and move up into GDL
only when a second brand needs the same one. The Storybook shows foundations:

- **Colour.** The semantic colours (`text`, `surface`, `stroke`, `action`,
  `neutral`, `accent`) and the core palette they point at.
- **Typography.** The 47 text styles and the font families.
- **Spacing** and **Shape** (radius, stroke width, elevation).
- **Contract.** The names every brand must define, in light and dark.

**The pink is a placeholder.** GDL's semantic colours are shown on its brand
slot (`color.primary`), a pink ramp that only GDL uses: it's hidden from
publishing, so brands never receive it, and each brand uses its own brand
colour instead. In GDL, judge **names, structure and steps**. Judge actual colour in a
brand's Storybook. Use **Theme** in the Storybook toolbar to switch between
light and dark.

## Step 4 — Catching up

There's no `/gdl-morning` yet. `/vcp-morning` only reads VCP. In any Claude
conversation, paste:

> Catch me up on the GDL design system at
> https://github.com/VDM-Design-Team/GDL-design-system. Tell me what merged
> since yesterday and what's open, in design terms, and which brands each
> change affects. List anything waiting on me: review requests, @-mentions,
> and comments on my PRs. Read-only: don't comment, approve or merge anything.

## Step 5 — Reviewing a change

Every PR gets a **🔍 Visual review** comment automatically, the same as on VCP.

1. Click **Before → after diffs**: every foundations page the PR changes, side
   by side against `main`. A token change usually repaints several pages at
   once, which is expected. **0 changes** means nothing visual moved.
2. Click **Live Storybook for this branch** and click through it, in light and
   dark.
3. Read the PR's **Brands affected** section. A GDL change reaches VCP, CAF and
   the rest, so this is the part that matters most.
4. Say what you see as a comment on the PR. Questions count as review.

To have Claude walk you through one:

> Help me review GDL PR #N:
> https://github.com/VDM-Design-Team/GDL-design-system/pull/N. Summarise what
> it changes in design terms and which brands it affects. Open the before →
> after diffs from its Visual review comment and the branch Storybook, and
> point me at what to look at. Don't comment or approve; I'll write the review
> myself.

There's no approval step in GDL. Once the `verify` and `chromatic` checks pass,
the PR can be merged.

**Merged isn't shipped.** Brands receive GDL changes through a GDL **release**,
then a version bump in each brand. A merged change shows up in VCP or CAF only
after that.

## Step 6 — Understand how change happens here

The working rules are in [`CLAUDE.md`](../CLAUDE.md). Claude enforces the
details. The short version to carry around:

- `main` is protected. Every change, however small, is a pull request.
- Describe changes in **design terms** ("success colours need a darker step
  for text"), not code terms.
- **Tokens come from Figma.** Never edit `tokens/` by hand; CI refuses it. To
  change a value, change the GDL Figma file, publish it, and have Claude pull
  it in (step 7).
- **The contract is a promise to every brand.** Adding a required colour name
  means every brand must add it before they can update, so it's a big change.
  A name only one brand uses is an **extension**, not a required name.
- **One brand's decision stays in that brand.** Something moves up into GDL
  when a second brand needs it.
- **No brand colours in GDL.** The pink brand slot is the only brand-ish ramp.

## Step 7 — Proposing a change

Changes happen in the cloud at https://claude.ai/code, exactly like step 8 of
VCP's onboarding. Start a session on `VDM-Design-Team/GDL-design-system`.

**Anything that isn't a token value** (page wording, docs, how the Storybook
shows something):

> In GDL, [what should change, in design terms]. Follow CLAUDE.md, and open a
> PR when it's done.

**A token change** (a colour, a size, a type style). Start in Figma:

1. Change the GDL Figma file (`1rBM831Vs5ZS4OsRwIPH52`) and **publish** it.
2. Then tell Claude:

> I changed [what] in the GDL Figma file (1rBM831Vs5ZS4OsRwIPH52) and
> published it. Refresh figma-export from the GDL Figma file, run
> `npm run import:figma` and `npm test`, explain the token changes in design
> terms, add the `changes/` entry, and open a draft PR. Follow CLAUDE.md.

This needs Figma connected in your Claude session. If Claude says it can't
reach Figma, ask the lead to pair on your first one.

Either way, a few minutes later the PR is on GitHub with its Visual review
comment, and the branch Storybook shows your change.

<details>
<summary>Optional: run the Storybook locally</summary>

Needs Node 22+ and a clone of the repo. Then:

```bash
npm install
npm run storybook
```

It rebuilds the tokens first and opens at http://localhost:6006.

</details>
