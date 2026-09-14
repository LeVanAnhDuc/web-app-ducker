# In progress · Next up · Debt

> **Answers:** What is being worked on, what comes next, and what is owed?
> **Status:** 🟢 complete
> **Updated:** 2026-09-14 · commit 3e4e67a
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

**File-backed registry — code and documentation complete, on `feat/file-backed-registry`,
not yet merged to `main`.** [`../specs/file-backed-registry/plan.md`](../specs/file-backed-registry/plan.md),
10 tasks, all done. Deleted the admin surface (58 files), `src/server/` (24 files),
`prisma/` and 5 dependencies (`@prisma/client`, `@prisma/adapter-pg`, `next-auth`,
`@aws-sdk/client-s3`, `bcryptjs`); content moved to `content/**.mdx`, 25 files (10 apps +
12 duck games + 3 docs). Decisions:
[ADR-0018](../decisions/0018-content-is-files-not-rows.md),
[ADR-0019](../decisions/0019-no-administration-surface.md). Real numbers below, in
§Where the code stands.

**Next planned: "Ink and state" repaint** — not yet specified. Applies
[`../design-system/ducker/MASTER.md`](../design-system/ducker/MASTER.md) to the ~25
CSS modules that survive the migration above. Approved mockup: 12 artboards, 4 screens ×
375 / 768 / 1440. **Nothing about the mockup is in this repository** — it is an Artifact.

Deliberately kept as two branches: a diff that both deletes a subsystem and repaints
every surface cannot be reviewed.

**Known conflict, owed to that branch:** `NFR-A11Y-06` blesses mono UPPERCASE labels
(11px) and the code uses them in 20+ places; `MASTER.md` §7 forbids both the all-caps
tracked eyebrow and mono for small labels. `I14` also pins `h1,h2,h3` to serif-400 with
no tracking, while `MASTER.md` §2 makes headings tight heavy sans. Deliberately not
resolved by this migration — both must be resolved when the repaint lands, not silently.

**next-themes migration — merged.** `e085a74` on this branch. Design and plan in
[`../specs/next-themes/`](../specs/next-themes/), reasoning in
[ADR-0020](../decisions/0020-next-themes-for-the-theme.md).

Last completed: documenting the file-backed-registry migration — this entry, plus
`invariants.md`, `nfr.md`, `CLAUDE.md`, `README.md` and ADR-0015's mechanism — and two
small code follow-ups that belonged with the story: renaming
`src/i18n/locales.generated.ts` → `locales.ts` (nothing has generated it since Task 9),
and pruning `src/lib/schemas.ts` down to the one export (`statusValues`) that
`src/content/nav-tree.ts` still imports. 2026-09-14.

## Where the code stands

Real run on 2026-09-14, on this branch, with **no environment variables set at all**:

| Check | Result |
| --- | --- |
| `pnpm test:run` | **199 passed**, 0 skipped (29 files) |
| `pnpm typecheck` · `pnpm lint` | clean |
| `pnpm build` | succeeds with no environment configured — `NFR-REL-04`, strengthened |
| `pnpm e2e` | **16 passed**, 0 skipped |

There are no database-backed tests left to skip — the database is gone
([ADR-0018](../decisions/0018-content-is-files-not-rows.md)).

**Never deployed to Vercel** — but nothing blocks it now. The old blocker (missing
Neon / Cloudflare R2 credentials) no longer applies: there is no database and no object
store left to provision.

## Next up

| Work | Related | Priority | Why that priority |
| --- | --- | --- | --- |
| Merge `feat/file-backed-registry` to `main`, then deploy to Vercel | — | high | first deploy ever, and the first time this project needs no datastore credentials to do it |
| Rewrite `src/styles/tokens.css` and `tokens.test.ts` against MASTER.md, and raise the `--tap` threshold in `e2e/a11y-tap-target.spec.ts` from 28px to 44px | ADR-0017 | high | the design system and the code currently describe two different products. The tap change alone will turn that e2e spec red until it is updated |
| Resolve the `NFR-A11Y-06` / `MASTER.md` §7 conflict on mono UPPERCASE labels, and the `I14` / `MASTER.md` §2 conflict on heading weight | NFR-A11Y-06 · I14 | high | owed to the "Ink and state" repaint branch — see §In progress above |
| Write content for **Shorten Link** | — | medium | its repo is private, so its `content/apps/*.mdx` entry has no tagline and `status: planned` |
| Wire `pnpm audit` into CI | NFR-SEC-05 | **high** | there is no `.github/workflows/` at all, so the threshold is manual today. Re-run `pnpm audit` after this migration — five dependencies (`@prisma/client`, `@prisma/adapter-pg`, `next-auth`, `@aws-sdk/client-s3`, `bcryptjs`) that carried some of the 15 advisories measured 2026-09-13 are gone, but the count has not been re-measured |
| Add a CSS-level `color-scheme` to each theme block while rewriting `tokens.css` | FR-15 · [ADR-0020](../decisions/0020-next-themes-for-the-theme.md) | medium | next-themes sets the property at runtime, so visitors with JavaScript disabled get none. Three declarations, and the token rewrite already owns that file |

The Neon project, the R2 bucket, `ADMIN_PASSWORD_HASH`/`AUTH_SECRET`/`PREVIEW_SECRET`,
declaring datastore variables on Vercel, and arranging a database backup are all gone
from this table — none of them are needed any more (ADR-0018, ADR-0019). So is
reviewing the seeded content through the CMS: there is no CMS and no seed; the content
now living in `content/**.mdx` was authored directly, not seeded.

## Open decisions

- ~~**`DocPage("home")` is `DRAFT` and `/docs/home` 404s on purpose.**~~ **Resolved
  2026-09-14, dropped.** The move to file-backed content (this migration) closed FR-20
  by deleting the record instead of building a renderer for it: `content/docs/` has no
  `home.vi.mdx`, so there is nothing left to publish and no dead link to worry about.
  The home page keeps rendering from interface strings, as it always did.
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
| `docs/03-design/architecture.md` and `docs/05-operations/runbook.md` | Downgraded to 🔴/🟡 without rewriting bodies | Substantial rewrite work; post-migration status update takes priority. Architecture has 17 stale references to deleted systems (Prisma, Auth.js, R2, Neon, src/server/*). Runbook has ~84. | Pair of ADRs (ADR-0018, ADR-0019) explain what was removed; new documents needed to describe current file-backed system and Vercel deployment with no datastore |
| No CI at all | `pnpm audit`, tests, typecheck and build run only on a developer machine | Single contributor, every gate is run manually before commit | as soon as a second person commits, or NFR-SEC-05 must be automatic |

The three rows this table used to carry — the Credentials-provider auth abstraction,
the unverified `prisma/seed.ts` content, and the missing database backup — retired with
`src/server/auth/`, `prisma/seed.ts` and the database itself (ADR-0018, ADR-0019).
Content now lives in git, which is its own backup.

## One trap when running e2e

**Playwright runs on its own port 3210, not 3000**, and never reuses an existing server
(`reuseExistingServer: false`). See the comment in `playwright.config.ts`. Unrelated to
the migration above — kept here because it is still a live trap.

## Rebuilding the environment on a new machine

Full detail in [`../05-operations/runbook.md`](../05-operations/runbook.md) — ⚠️ that
file is largely pre-migration; its Neon/R2/Vercel deploy steps and its `DATABASE_URL`
section no longer apply. The short version, current as of this migration:

```bash
git clone https://github.com/LeVanAnhDuc/web-app-ducker.git
cd web-app-ducker
pnpm install                # install; nothing to generate, no environment needed
cp .env.example .env
pnpm dev                    # http://localhost:3000 → redirects to /vi
```

Node 20+. No environment variables are required — the site renders its full content
from `content/**.mdx` either way.

**Superdesign MCP is machine-level configuration and is not in this repo.** Reinstall
with `git clone https://github.com/jonthebeef/superdesign-mcp-claude-code.git` (note: the
repo is `superdesign-mcp-claude-code`, not `superdesign-mcp` — the shorter name 404s),
`npm install && npm run build`, then `claude mcp add superdesign -s user -- node <abs>/dist/index.js`.
An MCP added mid-session is not callable until Claude Code restarts.
