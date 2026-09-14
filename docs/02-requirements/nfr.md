# Non-functional requirements

> **Answers:** Which thresholds apply to **every** feature, so they need not be restated each time?
> **Status:** 🟢 complete — reviewed against this project 2026-09-14
> **Updated:** 2026-09-14 · commit 3e4e67a
> **Update when:** a new resource type appears · a new user group appears · an incident produces a new threshold

<!-- HOW TO FILL
This is the file an AI SILENTLY IGNORES when it is empty — the code still runs, the
tests still pass, and nothing warns.

Every line must be MEASURABLE. If you cannot say how to check it, it is not yet a
requirement.

IDs are never reused. Dropping a threshold means marking it ~~(dropped)~~, not deleting
the row. A feature's design doc references the ID on its `Related:` line — it does NOT
copy the text across.
-->

The defaults that shipped with this file were reviewed line by line against Ducker on
2026-09-13. Rows marked ~~(dropped)~~ are kept with their number because retired IDs are
still referenced by older documents.

## Performance

| ID | Threshold | How to check |
| --- | --- | --- |
| ~~NFR-PERF-01~~ | ~~(dropped)~~ Pagination on list endpoints — the whole corpus is ~10 apps and ~4 guides, and the search index is a few dozen KB. Paginating would add machinery with nothing to page | — |
| NFR-PERF-02 | Public pages are **static HTML from the CDN**: zero database queries per view | trivially true since ADR-0018 — there is no database left to query |
| ~~NFR-PERF-03~~ | ~~No N+1 query on any admin path~~ | **Retired 2026-09-14** — there is no admin path (ADR-0019) |
| ~~NFR-PERF-04~~ | ~~Every column used to filter or sort has an index~~ | **Retired 2026-09-14** — there is no schema and no migration to index (ADR-0018) |
| NFR-PERF-05 | The search index is built **on demand, from the content files, on every request** — no cache. Never at build time, so it never lags content behind a deploy. It was cached by tag until Task 5: that cache relied on `mutations.ts` calling `revalidateTag` after a save, and there is no save path left to call it, so a cached copy would never be invalidated and would serve the first request forever | `src/app/api/search-index/[locale]/route.ts` is a route handler, not `generateStaticParams`, and contains no `unstable_cache` |

## Security

**Mostly vacuous since ADR-0019** (2026-09-13): there is no administration surface and
no mutation endpoint left to protect. Kept, not deleted — IDs are never reused, and the
row still states the bar a future write path would have to clear.

| ID | Threshold | How to check |
| --- | --- | --- |
| NFR-SEC-01 | ⚪ Vacuous — every mutation checks authorisation on the server. There is no mutation left; `await requireAdmin()` and `src/server/auth/` are deleted (ADR-0019) | — |
| NFR-SEC-02 | ⚪ Vacuous — do not log the administrator email, password hash, session tokens, or request bodies. There is no administrator account, session, or request body that writes anything | — |
| NFR-SEC-03 | ⚪ Vacuous — sign-in rate limiting. There is no sign-in; `src/server/auth/rate-limit.ts` is deleted | — |
| NFR-SEC-04 | Secrets are read from environment variables only. Never hardcoded, never committed. **Still applies in principle, currently vacuous in practice** — `.env.example` lists no secret, because the build reads none | grep + review |
| NFR-SEC-05 | No dependency vulnerability at high severity or above | `pnpm audit`. ⚠️ **not yet wired into CI** — this repo has no `.github/workflows/`; the check is manual today |
| NFR-SEC-06 | ⚪ Vacuous — errors returned to the client carry no stack trace, table name, or SQL. There is no database and no table to name | — |
| ~~NFR-SEC-07~~ | ~~Draft preview is gated by `PREVIEW_SECRET`; a refused preview wrongly answers 200 instead of 403/503~~ | **Retired 2026-09-14** — the preview route is deleted; a draft is now a branch and Vercel's per-branch preview URL replaces it (ADR-0019 §2) |

## Accessibility

| ID | Threshold | How to check |
| --- | --- | --- |
| NFR-A11Y-01 | Body text contrast ≥ 4.5:1, large text ≥ 3:1, in **all three** theme states | devtools, light and dark |
| NFR-A11Y-02 | Every action is reachable by keyboard and focus is always visible. The mobile drawer traps focus, closes on `Esc` and on outside click, and returns focus to the button that opened it | manual |
| NFR-A11Y-03 | Tap targets ≥ 44×44px | `e2e/a11y-tap-target.spec.ts` scans 4 pages — it caught two real violations on its first run |
| NFR-A11Y-04 | Every input has an associated label; error messages are readable by a screen reader | review |
| NFR-A11Y-05 | Honour `prefers-reduced-motion` | review the CSS |
| NFR-A11Y-06 | Type sizes stay on the scale: prose ≥ 14px · mono **UPPERCASE** labels may be 11px · mono lowercase labels ≥ 12px | `tokens.test.ts` scans every `*.module.css`; its `KNOWN_DEBT` list is **empty**, so any off-scale size fails immediately. ⚠️ **Conflicts with `docs/design-system/ducker/MASTER.md` §7**, which forbids both the all-caps tracked eyebrow and mono type for small labels. Not resolved here — it belongs to the separate visual-redesign branch (see [`backlog.md`](../04-state/backlog.md)) |
| NFR-A11Y-07 | No colour flash on load in any theme state | controlled experiment: real build, 20× CPU slowdown, screen recording, one run with the sync script and one with it disabled |

## i18n

| ID | Threshold | How to check |
| --- | --- | --- |
| NFR-I18N-01 | No hardcoded display strings in code. Interface strings live in `src/i18n/messages/`, content lives in `content/**.mdx` | grep |
| NFR-I18N-02 | Timestamps stored in UTC; timezone conversion happens only at the display layer | test |
| NFR-I18N-03 | Numbers, currency and dates formatted by the user's locale | review |
| NFR-I18N-04 | Every font stack renders Vietnamese diacritics correctly. **Georgia is banned** — it lacks precomposed Vietnamese glyphs and `ế` breaks apart | `tokens.test.ts` fails if Georgia returns |
| NFR-I18N-05 | Adding a language costs **one redeploy**, because the middleware runs at the edge and reads `src/i18n/locales.ts` directly — a hand-maintained constant since ADR-0018/ADR-0019 removed the database it used to be generated from ([ADR-0015](../decisions/0015-generated-locale-list-costs-one-redeploy.md)) | accepted limitation |

## Reliability

| ID | Threshold | How to check |
| --- | --- | --- |
| ~~NFR-REL-01~~ | ~~Every outbound call (object storage) has a timeout and an error branch~~ | **Retired 2026-09-14** — there is no object storage; images are static files under `public/` (ADR-0019) |
| ~~NFR-REL-02~~ | ~~Seeding is idempotent — running it repeatedly does not duplicate records~~ | **Retired 2026-09-14** — there is no seed; content is authored files (ADR-0018) |
| NFR-REL-03 | No infinite loading state: every request has an error branch on screen | manual |
| NFR-REL-04 | **Strengthened 2026-09-14.** `pnpm build` succeeds with **no environment variables at all** and produces a complete site. Previously the site rendered empty without a database; now there is nothing to be without | `pnpm build` with an empty environment |
| ~~NFR-REL-05~~ | ~~Content written to the database from outside the running server does not invalidate its cache, and the cache is on disk~~ | **Retired 2026-09-14** — there is no database and no external write path; content is read fresh from `content/` on every build (ADR-0018) |

## Data & privacy

| ID | Threshold | How to check |
| --- | --- | --- |
| NFR-DATA-01 | PII fields are listed in the table below | the table below |
| ~~NFR-DATA-02~~ | ~~(dropped)~~ Account deletion erases PII — there are no end-user accounts to delete. Revisit if FR-21 (sign-in through Ducker ID) ever lands | — |
| ~~NFR-DATA-03~~ | ~~There is a recovery path: migrations are forward-only and the content is reproducible from `prisma/seed.ts` only as a first draft; once edited through the CMS the database is the sole source of truth and there is no backup~~ | **Retired 2026-09-14** — content is files in this git repository; it has a backup by construction (ADR-0018) |

**PII in this project**

| Field | Lives in | Retained for |
| --- | --- | --- |
| ~~Administrator email~~ | ~~`ADMIN_EMAIL` env var~~ | **Retired 2026-09-14** — no administrator account exists (ADR-0019) |
| ~~Administrator password (bcrypt hash)~~ | ~~`ADMIN_PASSWORD_HASH` env var~~ | **Retired 2026-09-14** — no administrator account exists (ADR-0019) |
| ~~Session cookie~~ | ~~the visitor's browser~~ | **Retired 2026-09-14** — no sign-in exists (ADR-0019) |

No end-user accounts exist, and the public site collects nothing — no analytics, no
comments, no forms. There is currently no PII of any kind in this project.
