# Non-functional requirements

> **Answers:** Which thresholds apply to **every** feature, so they need not be restated each time?
> **Status:** 🟢 complete — reviewed against this project 2026-09-13
> **Updated:** 2026-09-13 · commit b2d70a8
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
| NFR-PERF-02 | Public pages are **static HTML from the CDN**: zero database queries per view. A read that reaches the database on the public path is a defect, not a slow path | read the query log while walking the public site |
| NFR-PERF-03 | No N+1 query on any admin path | enable the query log, walk the editor |
| NFR-PERF-04 | Every column used to filter or sort has an index | review the migration |
| NFR-PERF-05 | The search index is built **on demand and cached by tag**, never at build time — building it at deploy makes results lag content until the next deploy | `src/app/api/search-index/[locale]` is a route handler, not `generateStaticParams` |

## Security

| ID | Threshold | How to check |
| --- | --- | --- |
| NFR-SEC-01 | Every mutation checks authorisation **on the server**. A server action is its own HTTP endpoint — protecting `layout.tsx` protects nothing. `await requireAdmin()` is the first line of every writing action | a test per action; `src/server/auth/boundary.test.ts` |
| NFR-SEC-02 | Do not log the administrator email, the password hash, session tokens, or request bodies | review the log format |
| NFR-SEC-03 | Sign-in is rate limited: **5 attempts per 15 minutes** per client key | `src/server/auth/rate-limit.ts`, plus its test |
| NFR-SEC-04 | Secrets are read from environment variables only. Never hardcoded, never committed. `.env` is gitignored, `.env.example` carries names with empty values | grep + review |
| NFR-SEC-05 | No dependency vulnerability at high severity or above | `npm audit`. ⚠️ **not yet wired into CI** — this repo has no `.github/workflows/`; the check is manual today |
| NFR-SEC-06 | Errors returned to the client carry no stack trace, table name, or SQL | test |
| NFR-SEC-07 | Draft preview is gated by `PREVIEW_SECRET`. ⚠️ A refused preview currently answers **200** with an explanatory block instead of 403/503 — returning the right status needs `experimental.authInterrupts` | manual, see [`backlog.md`](../04-state/backlog.md) |

## Accessibility

| ID | Threshold | How to check |
| --- | --- | --- |
| NFR-A11Y-01 | Body text contrast ≥ 4.5:1, large text ≥ 3:1, in **all three** theme states | devtools, light and dark |
| NFR-A11Y-02 | Every action is reachable by keyboard and focus is always visible. The mobile drawer traps focus, closes on `Esc` and on outside click, and returns focus to the button that opened it | manual |
| NFR-A11Y-03 | Tap targets ≥ 44×44px | `e2e/a11y-tap-target.spec.ts` scans 4 pages — it caught two real violations on its first run |
| NFR-A11Y-04 | Every input has an associated label; error messages are readable by a screen reader | review |
| NFR-A11Y-05 | Honour `prefers-reduced-motion` | review the CSS |
| NFR-A11Y-06 | Type sizes stay on the scale: prose ≥ 14px · mono **UPPERCASE** labels may be 11px · mono lowercase labels ≥ 12px | `tokens.test.ts` scans every `*.module.css`; its `KNOWN_DEBT` list is **empty**, so any off-scale size fails immediately |
| NFR-A11Y-07 | No colour flash on load in any theme state | controlled experiment: real build, 20× CPU slowdown, screen recording, one run with the sync script and one with it disabled |

## i18n

| ID | Threshold | How to check |
| --- | --- | --- |
| NFR-I18N-01 | No hardcoded display strings in code. Interface strings live in `src/i18n/messages/`, content lives in the database | grep |
| NFR-I18N-02 | Timestamps stored in UTC; timezone conversion happens only at the display layer | test |
| NFR-I18N-03 | Numbers, currency and dates formatted by the user's locale | review |
| NFR-I18N-04 | Every font stack renders Vietnamese diacritics correctly. **Georgia is banned** — it lacks precomposed Vietnamese glyphs and `ế` breaks apart | `tokens.test.ts` fails if Georgia returns |
| NFR-I18N-05 | Adding a language is data, not a migration. It does cost **one redeploy**, because the middleware runs at the edge and the locale list is generated at `prebuild` | accepted limitation, see architecture §6 |

## Reliability

| ID | Threshold | How to check |
| --- | --- | --- |
| NFR-REL-01 | Every outbound call (object storage) has a timeout and an error branch | review |
| NFR-REL-02 | Seeding is idempotent — running it repeatedly does not duplicate records | run it twice and count |
| NFR-REL-03 | No infinite loading state: every request has an error branch on screen | manual |
| NFR-REL-04 | The site renders with **no database configured** — empty, not broken. This is by design, not a bug | `npm run build` with no `DATABASE_URL` |
| NFR-REL-05 | Content written to the database from outside the running server does not invalidate its cache, and the cache is on disk. Any such write must be followed by `rm -rf .next` | [ADR-0012](../decisions/0012-ssg-cache-is-per-process-and-on-disk.md) |

## Data & privacy

| ID | Threshold | How to check |
| --- | --- | --- |
| NFR-DATA-01 | PII fields are listed in the table below | the table below |
| ~~NFR-DATA-02~~ | ~~(dropped)~~ Account deletion erases PII — there are no end-user accounts to delete. Revisit if FR-21 (sign-in through Ducker ID) ever lands | — |
| NFR-DATA-03 | There is a recovery path: migrations are forward-only and the content is reproducible from `prisma/seed.ts` **only as a first draft**. ⚠️ Once content has been edited through the CMS the database is the sole source of truth and **there is no backup yet** | see [`backlog.md`](../04-state/backlog.md) §Next up |

**PII in this project**

| Field | Lives in | Retained for |
| --- | --- | --- |
| Administrator email | `ADMIN_EMAIL` env var | life of the deployment |
| Administrator password (bcrypt hash) | `ADMIN_PASSWORD_HASH` env var | life of the deployment |
| Session cookie | the visitor's browser | session |

No end-user accounts exist, and the public site collects nothing — no analytics, no
comments, no forms.
