# In progress · Next up · Debt

> **Answers:** What is being worked on, what comes next, and what is owed?
> **Status:** 🟢 complete
> **Updated:** 2026-10-11 · branch fix/audit-findings
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

**`fix/audit-findings` (2026-10-11) — built and verified, awaiting the commit review and a PR.**
An audit of `src/` against the docs. Search now indexes games and 404s an unknown
locale (FR-24); `sitemap.xml`, `robots.txt` and `metadataBase` (FR-28); the dead
draft/publish model, `assertNavInvariants`, `wouldCreateCycle` and the `/[locale]/n/[id]`
route deleted (I1, I2, I4–I7 retired); `middleware.ts` → `proxy.ts`; `engines.node` 22.x
pins CI and Vercel; Next 16.3.1 → 16.4.0 with every dependency refreshed in range (33
advisories → 2, none high in production) and `pnpm audit --prod` gating CI (NFR-SEC-05);
every Vietnamese comment in `src/`, `e2e/` and the configs translated. Verified:
typecheck, lint, 252 unit tests, build, 21/21 e2e.

**Before that branch, nothing was in flight (2026-10-11).** Every branch is merged: PRs #1–#15 are on `main`,
no PR or issue is open, `.worktrees/` is empty, and the latest release is `v0.2.3`
(2026-10-10). The last feature work, in order:

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

**Live on Vercel since 2026-10-11 — https://web-app-ducker.vercel.app.** The host is
Vercel ([ADR-0024](../decisions/0024-host-on-vercel-git-deploys-off-in-repo.md), which
also records why GitHub Pages lost). The first deploy came from re-running the CI run of
`9aac736` (#15) once the secrets existed; every later push to `main` deploys through the
gated `deploy` job.

- Vercel project `web-app-ducker` under `duclevananhregister-1123s-projects`. `vercel
  link` **did** connect the Git integration, as feared — `vercel.json` was already on
  `main`, so it creates no deployments. It also appended `.env*` to `.gitignore`, which
  would have matched `.env.example`; that line was reverted, not committed.
- Repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Vercel
  production variable: `GITHUB_TOKEN` (sensitive).
- Runbook §6.6, walked on 2026-10-11 with `curl`: `/` → 307 `/vi`, and → `/en` with
  `Accept-Language: en`; `/vi`, `/en`, `/vi/apps`, `/vi/games`, app and game detail
  pages all 200; `/api/search-index/vi` returns a non-empty index, so `content/**`
  reached the bundle (§6.4); `web-app-ducker`'s releases page lists `v0.1.0`…`v0.2.3`;
  Ducker ID's README renders. **Not checked:** the theme toggle surviving a reload
  (needs a browser) and a `/[locale]/n/[id]` route (no link to one on the home page).

**Credentials narrowed and rotated (2026-10-11), on `ci/project-scoped-token`.** The
first values were pasted into a chat session, so both were replaced:

- `VERCEL_TOKEN` is now **scoped to the `web-app-ducker` project only** — Vercel's token
  Scope offers Full Account, a team's All Projects, or one project. That needed Vercel
  CLI 63.1.2 in `ci.yml`: 59.16.0 failed `vercel pull` with "Could not retrieve Project
  Settings" (reproduced locally against both versions).
- `GITHUB_TOKEN` was regenerated and moved from a project variable to a **team Shared
  Environment Variable** linked to `web-app-ducker`, so other projects can link it
  (runbook §6.5). The project-level variable was deleted — it would have overridden the
  shared one.

The replacement values were also pasted into the chat, so they sit in a local
transcript too; the exposure is now one project's deploys and read-only public data.
**Still owed:** once a deploy from this branch's CLI pin passes, delete the old
all-projects token at vercel.com/account/tokens.

**Resolved 2026-10-11 — the open item from #12.** `web-app-calculate-badminton` answered
404 because the repository was named `app-calculate-badminton`. It was renamed on GitHub
to match the content file's `repo:`, its Pages base path followed
(https://levananhduc.github.io/web-app-calculate-badminton/), and its README now renders
here. That repository's Pages deploy had been failing since its own #6 on a test that
needed a local `.env`; fixed in its #8.

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
| Delete the old all-projects Vercel token | ADR-0024 | high | it can still deploy or delete any project in the account; replaced by a project-scoped one — see §In progress |
| **"Ink and state" repaint** — not yet specified. Apply [`MASTER.md`](../design-system/ducker/MASTER.md) to the surviving CSS modules: rewrite `src/styles/tokens.css` and `tokens.test.ts`, and raise `--tap` (still `28px`) and the threshold in `e2e/a11y-tap-target.spec.ts` to 44px | ADR-0017 | high | the design system and the code still describe two different products. Approved mockup: 12 artboards, 4 screens × 375 / 768 / 1440 — an Artifact, **not in this repository**. The tap change alone turns that e2e spec red until it is updated |
| Resolve the `NFR-A11Y-06` / `MASTER.md` §7 conflict on mono UPPERCASE labels, and the `I14` / `MASTER.md` §2 conflict on heading weight | NFR-A11Y-06 · I14 | high | owed to the repaint branch, resolved explicitly, not silently. `NFR-A11Y-06` blesses mono UPPERCASE 11px labels used in 20+ places; `MASTER.md` §7 forbids both. `I14` pins `h1,h2,h3` to serif-400; `MASTER.md` §2 makes headings tight heavy sans |
| Add a CSS-level `color-scheme` to each theme block while rewriting `tokens.css` | FR-15 · [ADR-0020](../decisions/0020-next-themes-for-the-theme.md) | medium | next-themes sets the property at runtime, so visitors with JavaScript disabled get none. The token rewrite already owns that file |
| Author the `features` frontmatter field | — | low | no content file sets it, so `FeatureGrid` renders on no page. The deleted `prisma/seed.ts` (`git show e085a74:prisma/seed.ts`) authored feature blocks for five applications; since #12 every page also shows its README, so this is a content task of reduced value |
| Silence Turbopack's "Dynamic filesystem access causes tracing of the whole project" (4 warnings, all `readdir`/`readFile` in `src/content/read.ts`) | — | low | seen on the first build with Next 16.4.0, 2026-10-11; not known whether 16.3.1 printed it too. Costs bundle size, not correctness — the README/ISR pages' traces do include `content/**` |

## Open decisions

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
- **`NEXT_PUBLIC_SITE_URL` is optional.** `src/lib/site-url.ts` reads it for canonical,
  `hreflang`, `sitemap.xml` and `robots.txt`; blank means the production URL. Playwright
  must not read it again — `http://localhost:3000` is how an e2e run once wandered into
  another project's app.

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

Node 22 (`engines.node`). No environment variables are required — the site renders its full content
from `content/**.mdx` either way.

**Superdesign MCP is machine-level configuration and is not in this repo.** Reinstall
with `git clone https://github.com/jonthebeef/superdesign-mcp-claude-code.git` (note: the
repo is `superdesign-mcp-claude-code`, not `superdesign-mcp` — the shorter name 404s),
`npm install && npm run build`, then `claude mcp add superdesign -s user -- node <abs>/dist/index.js`.
An MCP added mid-session is not callable until Claude Code restarts.
