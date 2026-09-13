# In progress · Next up · Debt

> **Answers:** What is being worked on, what comes next, and what is owed?
> **Status:** 🟢 complete
> **Updated:** 2026-09-13 · commit b2d70a8
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

**Two branches planned, neither started. Specs and plan are written and merged.**

1. **File-backed registry** — [`../specs/file-backed-registry/plan.md`](../specs/file-backed-registry/plan.md),
   10 tasks. Deletes the admin surface (58 files), `src/server/` (24 files), `prisma/`
   and 5 dependencies; content moves to `content/**.mdx`; the catalogue grows from 6
   entries to 22 (10 apps + 12 duck games). Decisions:
   [ADR-0018](../decisions/0018-content-is-files-not-rows.md),
   [ADR-0019](../decisions/0019-no-administration-surface.md).
2. **Ink and state repaint** — not yet specified. Applies
   [`../design-system/ducker/MASTER.md`](../design-system/ducker/MASTER.md) to the ~25
   CSS modules that survive branch 1. Approved mockup: 12 artboards, 4 screens × 375 /
   768 / 1440. **Nothing about the mockup is in this repository** — it is an Artifact.

Deliberately not merged into one branch: a diff that both deletes a subsystem and
repaints every surface cannot be reviewed.

**Known conflict, owed to branch 2:** `NFR-A11Y-06` blesses mono UPPERCASE labels
(11px) and the code uses them in 20+ places; `MASTER.md` §7 forbids both the all-caps
tracked eyebrow and mono for small labels. `I14` also pins `h1,h2,h3` to serif-400 with
no tracking, while `MASTER.md` §2 makes headings tight heavy sans. Both must be resolved
in branch 2, not silently.

**next-themes migration — awaiting spec review.** Branch `feat/next-themes` in
`.worktrees/next-themes/`, design committed at `docs/specs/next-themes/design.md`.
Stopped at the spec review gate; `plan.md` is not written yet. Scope is deliberately
narrow: swap the hand-rolled theme machinery for `next-themes`, which closes two
verified gaps — nothing in `src/styles/` sets `color-scheme`, and a theme change never
reaches a second tab. It touches **no CSS**, so it cannot collide with the token rewrite
described above. The CSS-level `color-scheme` fallback for visitors without JavaScript
is handed to that rewrite.

Last completed: migrating this project onto the workspace documentation tier
(`scaffold-webapp-project`) and unifying both `CLAUDE.md` files on English —
2026-09-13. The old `docs/status.md`, `docs/session-log.md` and `docs/superpowers/`
were folded into this tier and deleted; they remain in git history.

## Where the code stands

Two plans ran to completion: 17 tasks (`superpowers/plans/2026-08-17-app-store-doc.md`)
and 9 tasks (`…/2026-08-18-ducker-navigation-tree.md`), both now only in git history.

Numbers below are from a **real run on 2026-08-19** against local Postgres, re-verified
on 2026-09-13 by starting the app against a freshly created container on port 15433.

| Check | Result |
| --- | --- |
| `pnpm test:run` | **242 green**, 26 skipped (33/34 files) |
| `DATABASE_URL_TEST=… pnpm exec vitest run src/server/content --maxWorkers=1` | **69 green**, 0 skipped |
| `pnpm typecheck` · `pnpm lint` | clean |
| `pnpm build` | succeeds, and still succeeds with no database |
| `pnpm e2e` | **14 green**, 2 skipped |
| `DATABASE_URL_TEST=… pnpm e2e` | **16 green**, 0 skipped |

The 21 remaining skips are all database tests in `*.db.test.ts`; setting
`DATABASE_URL_TEST` runs them.

**Never run:** the deploy. The only reason is missing Neon / Cloudflare R2 / Vercel
credentials.

## Next up

| Work | Related | Priority | Why that priority |
| --- | --- | --- | --- |
| Create the Neon project → `DATABASE_URL`, plus a `test` branch → `DATABASE_URL_TEST` | — | high | everything else in the deploy chain waits on it. Use the **direct** connection string, not the `-pooler` one |
| Create the R2 bucket + API token → the five `R2_*` vars, **and enable public access** | FR-12 | high | without public access `R2_PUBLIC_BASE_URL` is useless and every image 404s |
| Generate `ADMIN_PASSWORD_HASH`, `AUTH_SECRET`, `PREVIEW_SECRET` | FR-06 | high | escape every `$` as `\$` — see [`../05-operations/runbook.md`](../05-operations/runbook.md) §3.1 |
| Declare the variables on Vercel (Production + Preview) | — | high | do **not** declare `ADMIN_PASSWORD` or `DATABASE_URL_TEST` there |
| Deploy, then run the five manual checks in [`../05-operations/runbook.md`](../05-operations/runbook.md) §6.5 | — | high | the project has never been deployed |
| Rewrite `src/styles/tokens.css` and `tokens.test.ts` against MASTER.md, and raise the `--tap` threshold in `e2e/a11y-tap-target.spec.ts` from 28px to 44px | ADR-0017 | high | the design system and the code currently describe two different products. The tap change alone will turn that e2e spec red until it is updated |
| Review the seeded content through the CMS | — | medium | it was written from public READMEs and **never verified against source**; the "run it in 5 minutes" parts may have wrong ports or script names |
| Write content for **Shorten Link** | — | medium | its repo is private, so nothing could be seeded; the record is empty and `DRAFT` |
| Wire `pnpm audit` into CI | NFR-SEC-05 | medium | there is no `.github/workflows/` at all, so the threshold is manual today |
| Arrange a database backup | NFR-DATA-03 | medium | once content is edited through the CMS, the database is the only copy |

## Open decisions

- **`DocPage("home")` is `DRAFT` and `/docs/home` 404s on purpose.** Its nav node is
  draft too, so it never appears in the sidebar. The home page is currently built from
  interface strings rather than rendering that record. Publishing it would put a dead
  link into the search index. Decide: make the home page render the real record
  (FR-20), or delete the record.
- **Raw HTML in markdown is not rendered** (FR-19) — no `<kbd>`, `<details>`, `<br>`.
  Opening it means `rehype-raw` + `allowDangerousHtml: true` and dropping the
  hand-written filter in `src/lib/markdown.ts`; sanitisation already has
  `strip: ['script']` ready for that.
- **`<pre>` carries a `data-code` attribute holding the verbatim source**, so code
  appears twice in the payload. Bought: a copy button, and the code survives
  tokenisation. Drop the transformer and loosen `markdown.test.ts` if that trade stops
  being worth it.

## Accepted long-term

- **Adding a language needs one redeploy** (NFR-I18N-05, architecture §6).
- **`NEXT_PUBLIC_SITE_URL` is read nowhere.** `playwright.config.ts` used to read it and
  stopped — that value, `http://localhost:3000`, was exactly how an e2e run wandered
  into another project's app. There is no `sitemap.ts` or canonical using it yet.
- **Draft preview cannot answer 403/503** without `experimental.authInterrupts`; both
  refusal branches render an explanation with status 200 (NFR-SEC-07).
- **`/admin/docs` has no ordering buttons** — a decision, not an omission. See
  [ADR-0011](../decisions/0011-no-order-buttons-on-admin-docs.md).

## Technical debt — deliberate shortcuts

| Where | What was traded | Why it was acceptable | When it must be paid |
| --- | --- | --- | --- |
| `src/server/auth/` (Credentials provider) | One account, bcrypt hash in an env var, instead of real identity | The docs site had to ship without waiting on Ducker ID; the abstraction keeps the swap to one new file | when Ducker ID actually exposes `/oauth/authorize` (FR-21) |
| `prisma/seed.ts` content | Written from public READMEs, unverified against source | Better than an empty site while the real content is being written | before showing the site to anyone outside |
| No CI at all | `pnpm audit`, tests, typecheck and build run only on a developer machine | Single contributor, every gate is run manually before commit | as soon as a second person commits, or NFR-SEC-05 must be automatic |
| No database backup | The CMS database is the single copy of edited content | Nothing has been deployed yet, so nothing is at risk today | before the first real content is entered post-deploy |

## Two traps when re-running the deploy steps

- **`prisma migrate reset` is blocked for AI agents by Prisma 7.** It prints a long
  warning and exits, demanding an env var carrying the user's own verbatim consent. The
  way around it without resetting: create another empty database in the same container,
  `migrate deploy` + `db seed` into it, count, then `DROP DATABASE`.
- **Playwright runs on its own port 3210, not 3000**, and never reuses an existing
  server. See the comment in `playwright.config.ts`.

## Rebuilding the environment on a new machine

Full detail in [`../05-operations/runbook.md`](../05-operations/runbook.md). The short version:

```bash
git clone https://github.com/LeVanAnhDuc/web-app-ducker.git
cd web-app-ducker
pnpm install                # postinstall runs `prisma generate`
cp .env.example .env
pnpm dev                    # http://localhost:3000 → redirects to /vi
```

Node 20+. With no `DATABASE_URL` the site opens but has no content — by design.

For the database-backed tests, a local Postgres is needed. Verified working on
2026-09-13:

```bash
docker run -d --name app-store-doc-pg -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=app_store_doc -p 15433:5432 postgres:16
docker exec app-store-doc-pg psql -U postgres -c "CREATE DATABASE app_store_doc_test;"
DATABASE_URL="postgresql://postgres:devpass@localhost:15433/app_store_doc" pnpm exec prisma migrate deploy
DATABASE_URL="postgresql://postgres:devpass@localhost:15433/app_store_doc" pnpm exec prisma db seed
rm -rf .next          # required after any seed — see I12
```

⚠️ **The Prisma CLI does not read `.env`.** Without an inline `DATABASE_URL` it falls
back to the placeholder in `prisma.config.ts` and fails with `P1010`, which looks like a
permissions problem and is actually the wrong database. Next reads `.env` normally.

**Superdesign MCP is machine-level configuration and is not in this repo.** Reinstall
with `git clone https://github.com/jonthebeef/superdesign-mcp-claude-code.git` (note: the
repo is `superdesign-mcp-claude-code`, not `superdesign-mcp` — the shorter name 404s),
`npm install && npm run build`, then `claude mcp add superdesign -s user -- node <abs>/dist/index.js`.
An MCP added mid-session is not callable until Claude Code restarts.
