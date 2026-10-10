# In progress · Next up · Debt

> **Answers:** What is being worked on, what comes next, and what is owed?
> **Status:** 🟢 complete
> **Updated:** 2026-10-10 · branch main
> **Update when:** work starts or finishes · brainstorming produces new work · a shortcut is taken deliberately

<!-- HOW TO FILL
"In progress" is the first thing a NEW session reads. Keep it short: what is being done,
which step it stopped at, what is blocking. Update it BEFORE stopping the session, not
after.

"Technical debt" records only what was made temporary ON PURPOSE, written down at that
moment. Bugs do not belong here. Neither does unstarted work — that is section 2.

DOES NOT CONTAIN: out-of-scope features (-> 01-product/overview.md §Non-Goals).
-->

## In progress

**Nothing is in flight (2026-10-10).** Every branch is merged: PRs #1–#13 are on `main`,
no PR or issue is open, `.worktrees/` is empty, and the latest release is `v0.2.1`
(2026-10-05). The last feature work, in order:

- **#7 File-backed registry** (2026-09-14) — the admin surface, `src/server/`, `prisma/`
  and five dependencies deleted; content lives in `content/**.mdx`.
  [ADR-0018](../decisions/0018-content-is-files-not-rows.md),
  [ADR-0019](../decisions/0019-no-administration-surface.md),
  [`../specs/file-backed-registry/`](../specs/file-backed-registry/plan.md).
- **#8–#10 Release automation and CI** (2026-09-14) — version and notes derived from
  commit subjects ([ADR-0021](../decisions/0021-versions-and-notes-derive-from-commits.md));
  `ci.yml` gates every merge and owns a deploy job
  ([ADR-0022](../decisions/0022-deploy-from-actions-not-vercel-git.md)).
- **#11 Full-height side columns** (2026-10-04).
- **#12 README and releases from GitHub** (2026-10-04) — every app and game with a
  repository shows its README and releases, refreshed hourly by ISR; games have detail
  pages; `/apps` and `/games` are overview pages.
  [ADR-0023](../decisions/0023-readme-and-releases-from-github.md),
  [`../specs/github-readme-releases/`](../specs/github-readme-releases/design.md).
- **#13 Content fills the middle column** (2026-10-05) — `--measure` set to `none`, the
  66-character line cap removed; the trade is recorded in `MASTER.md` §2.

**Blocking the first deploy — a decision, not a bug.** The host is undecided: Vercel as
`ci.yml` configures it, or GitHub Pages — which would need `output: 'export'`, delete
`src/middleware.ts`, turn `/api/search-index/[locale]` into a build-time file
(**contradicting NFR-PERF-05**, so it needs its own ADR) and turn `/[locale]/n/[id]` into
static pages. The one real user-facing cost of Pages is that `/` would always land on
`/vi`: locale can no longer be negotiated from `Accept-Language` without a server.
`next/image` is used nowhere, so the usual worst blocker is absent.

Until the host is chosen, the `deploy` job **skips loudly** — a `::notice::` and a
job-summary heading — rather than fail; a permanently red pipeline is one people stop
reading. As of 2026-10-10 the repository has **no GitHub secrets at all**
(`gh secret list` is empty) and has never been deployed. If Vercel is chosen:

- run `vercel link` once, then set `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
  as repository secrets (runbook §6);
- set `GITHUB_TOKEN` in the Vercel project, or the ISR refreshes from #12 run anonymously
  against GitHub's rate limit;
- **if the Vercel Git integration is ever connected, turn its auto-deploy off**
  (runbook §6.3) or every push deploys twice, the ungated copy possibly last.

**Open item from #12:** `web-app-calculate-badminton` still does not resolve on GitHub
(re-checked 2026-10-10) — its pages show the "unavailable" notice until its `repo:` is
corrected or the repository is made public.

Owed on the next clone, on every machine: `git config core.hooksPath .githooks`. It is
local configuration and cannot be committed — the CI check in
`.github/workflows/commit-lint.yml` exists precisely because of that, and must not be
dropped as redundant.

**Two traps from 2026-09-14, kept because they fail silently.** Both came from a stale
worktree, `.worktrees/next-themes/` (since deleted):

- `vitest.config.mts` once declared `exclude: ["node_modules/**", ...]` — declaring
  `exclude` **replaces** vitest's default `**/node_modules/**`, so vitest silently ran
  thousands of dependency test files inside the worktree. Now `**/node_modules/**` plus
  `.worktrees/**`. The symptom was a hang, never a red test.
- The `.env.example` hook reported variables that only the worktree's deleted
  `src/server/` read. `docs-regen.sh` now excludes `.worktrees`.

## Where the code stands

Real run on 2026-10-10, on `main` at `b0f4c35`, with no environment variables set:

| Check | Result |
| --- | --- |
| `pnpm test:run` | **250 passed**, 0 skipped (37 files) |
| `pnpm typecheck` · `pnpm lint` | clean |
| `pnpm build` · `pnpm e2e` | not re-run on 2026-10-10 — both run green in CI on every PR; #13's checks passed before merge |

There are no database-backed tests left to skip — the database is gone
([ADR-0018](../decisions/0018-content-is-files-not-rows.md)).

## Next up

| Work | Related | Priority | Why that priority |
| --- | --- | --- | --- |
| Choose the host, then deploy for the first time | ADR-0022 | high | the only thing standing between `main` and a live site; see §In progress for what each choice costs |
| **"Ink and state" repaint** — not yet specified. Apply [`MASTER.md`](../design-system/ducker/MASTER.md) to the surviving CSS modules: rewrite `src/styles/tokens.css` and `tokens.test.ts`, and raise `--tap` (still `28px`) and the threshold in `e2e/a11y-tap-target.spec.ts` to 44px | ADR-0017 | high | the design system and the code still describe two different products. Approved mockup: 12 artboards, 4 screens × 375 / 768 / 1440 — an Artifact, **not in this repository**. The tap change alone turns that e2e spec red until it is updated |
| Resolve the `NFR-A11Y-06` / `MASTER.md` §7 conflict on mono UPPERCASE labels, and the `I14` / `MASTER.md` §2 conflict on heading weight | NFR-A11Y-06 · I14 | high | owed to the repaint branch, resolved explicitly, not silently. `NFR-A11Y-06` blesses mono UPPERCASE 11px labels used in 20+ places; `MASTER.md` §7 forbids both. `I14` pins `h1,h2,h3` to serif-400; `MASTER.md` §2 makes headings tight heavy sans |
| Wire `pnpm audit` into CI | NFR-SEC-05 | high | `ci.yml` runs no audit step, so the threshold is manual. The advisory count has not been re-measured since 2026-09-13, before five dependencies were removed |
| Rename `src/middleware.ts` to the `proxy` convention | — | medium | Next 16 warns the `middleware` file convention is deprecated. Moot if GitHub Pages is chosen, which deletes the file |
| Add a CSS-level `color-scheme` to each theme block while rewriting `tokens.css` | FR-15 · [ADR-0020](../decisions/0020-next-themes-for-the-theme.md) | medium | next-themes sets the property at runtime, so visitors with JavaScript disabled get none. The token rewrite already owns that file |
| Author the `features` frontmatter field | — | low | no content file sets it, so `FeatureGrid` renders on no page. The deleted `prisma/seed.ts` (`git show e085a74:prisma/seed.ts`) authored feature blocks for five applications; since #12 every page also shows its README, so this is a content task of reduced value |

## Open decisions

- **Deploy host** — Vercel or GitHub Pages. See §In progress.
- **Raw HTML in markdown is not rendered** (FR-19) — no `<kbd>`, `<details>`, `<br>`.
  Opening it means `rehype-raw` + `allowDangerousHtml: true` and dropping the
  hand-written filter in `src/lib/markdown.ts`; sanitisation already has
  `strip: ['script']` ready for that.
- **`<pre>` carries a `data-code` attribute holding the verbatim source**, so code
  appears twice in the payload. Bought: a copy button, and the code survives
  tokenisation. Drop the transformer and loosen `markdown.test.ts` if that trade stops
  being worth it.

## Accepted long-term

- **Adding a language needs one redeploy** (NFR-I18N-05, [ADR-0015](../decisions/0015-generated-locale-list-costs-one-redeploy.md)) —
  now an edit to `src/i18n/locales.ts` rather than a database row, same cost either way.
- **`NEXT_PUBLIC_SITE_URL` is read nowhere.** `playwright.config.ts` used to read it and
  stopped — that value, `http://localhost:3000`, was exactly how an e2e run wandered
  into another project's app. There is no `sitemap.ts` or canonical using it yet.

## Technical debt — deliberate shortcuts

| Where | What was traded | Why it was acceptable | When it must be paid |
| --- | --- | --- | --- |
| `docs/03-design/architecture.md` and `docs/05-operations/runbook.md` | Downgraded to 🔴/🟡 without rewriting bodies | Substantial rewrite work; post-migration status update took priority. Architecture has 17 stale references to deleted systems (Prisma, Auth.js, R2, Neon, src/server/*). Runbook has ~84; only its §6 was rewritten | Before the first deploy, at the latest — the runbook's §1–5 and §7 describe steps that no longer apply |

The "no CI at all" row retired with #9: `ci.yml` runs typecheck, lint, unit tests,
build and e2e on every PR and every push to `main`. Only `pnpm audit` is still manual
(§Next up).

## One trap when running e2e

**Playwright runs on its own port 3210, not 3000**, and never reuses an existing server
(`reuseExistingServer: false`). See the comment in `playwright.config.ts`.

## Rebuilding the environment on a new machine

Full detail in [`../05-operations/runbook.md`](../05-operations/runbook.md) — ⚠️ that
file is largely pre-migration; its Neon/R2/Vercel deploy steps and its `DATABASE_URL`
section no longer apply. The short version:

```bash
git clone https://github.com/LeVanAnhDuc/web-app-ducker.git
cd web-app-ducker
pnpm install --frozen-lockfile   # nothing to generate, no environment needed
git config core.hooksPath .githooks
cp .env.example .env
pnpm dev                         # http://localhost:3000 → redirects to /vi
```

Node 20+. No environment variables are required — the site renders its full content
from `content/**.mdx` either way.

**Superdesign MCP is machine-level configuration and is not in this repo.** Reinstall
with `git clone https://github.com/jonthebeef/superdesign-mcp-claude-code.git` (note: the
repo is `superdesign-mcp-claude-code`, not `superdesign-mcp` — the shorter name 404s),
`npm install && npm run build`, then `claude mcp add superdesign -s user -- node <abs>/dist/index.js`.
An MCP added mid-session is not callable until Claude Code restarts.
