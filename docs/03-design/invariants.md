# Load-bearing invariants

> **Answers:** What can I change that makes the system wrong **silently** — tests still green, result still wrong?
> **Status:** 🟢 complete — reviewed against this project 2026-09-13
> **Updated:** 2026-09-13 · commit b2d70a8
> **Update when:** a new invariant is discovered — usually right after someone has just broken one

<!-- HOW TO FILL
READ THIS FILE BEFORE CHANGING ANY LINE OF CODE.

An invariant is not a code convention. ESLint catches conventions; nothing catches
these, and breaking one leaves the code running and the tests green while the result is
wrong.

KEEP THIS FILE UNDER ~40 CONTENT LINES. It is read on every code change; once it grows,
nobody reads it. Anything that is not "silently wrong" belongs elsewhere.

DOES NOT CONTAIN: format/naming conventions (-> lint config), architecture
(-> architecture.md).
-->

## Navigation tree

| # | Invariant | What breaks if you violate it |
| --- | --- | --- |
| I1 | A node with children **must** be `CONTAINER` | An `APP` with children loses its repo, stack and features — the data is still there with no route to it |
| I2 | A `CONTAINER` with no published child **cannot be published** | A tab that opens onto nothing. Also: `onDelete: Cascade` bypasses this check, so `deleteApp` / `deleteDocPage` must re-check the parent afterwards and demote it to draft |
| I3 | **No cycles** — a node may not be its own descendant | Infinite loop while building the tree. Detection must walk **up** the parent chain; a `visited` set walking down never catches it, because a cycle has no root ancestor and the whole loop is simply unreachable — tree builds fine, data quietly vanishes |
| I4 | An `App` / `DocPage` attaches to **exactly one** node | Appears twice in the sidebar and counts twice in the search index. Enforced by `@unique` on `appId` / `docPageId` |
| I5 | A `CONTAINER` must have a label in the **default locale** | A clickable blank line in the sidebar |
| I6 | At least **one** published root node must exist | No tabs means no way into anything |
| I7 | `kind` and the pointer columns agree: `APP ⟺ appId != null`, `DOC ⟺ docPageId != null`, `CONTAINER ⟺ both null` | Enforced by a hand-written CHECK constraint, same as `section_single_owner` |

I1 and I4 are partly enforceable in the database. I2, I3, I5, I6 must be checked in code.

## Server and data

| # | Invariant | What breaks if you violate it |
| --- | --- | --- |
| I8 | Every writing server action starts with `await requireAdmin()` | A server action is its own HTTP endpoint. Guarding `/admin/layout.tsx` guards nothing; anyone can POST to the action |
| I9 | Only `src/server/content/` touches Prisma; only `src/server/auth/` knows Auth.js; only `src/server/media/` knows the S3 SDK | Skips the authorisation and validation that live in those layers. Guarded by `boundary.test.ts` |
| I10 | Migrations are **forward-only** | Schema history diverges between environments and cannot be reconciled |
| I11 | Timestamps in UTC; conversion only at the display layer | Off-by-one-day at timezone edges; tests written in machine time stay green |
| I12 | Content written from outside the running server does not invalidate its cache, and that cache is **on disk** | The database holds the new value and the page keeps serving the old one, across restarts. After any seed / external write: `rm -rf .next` |
| I13 | `revalidateTag(tag, "max")` is stale-while-revalidate | A test that writes, reads once and asserts will fail at random. Read twice |

## Presentation

| # | Invariant | What breaks if you violate it |
| --- | --- | --- |
| I14 | Do not declare `font-weight` or `letter-spacing` in a `*.module.css` that also styles a heading | A class selector beats the `h1,h2,h3` element selector in `globals.css` and silently voids the serif-400 and no-tracking rules. No test catches it; only a screenshot and `getComputedStyle` do |
| I15 | Georgia is banned from every font stack | It has no precomposed Vietnamese glyphs: `ế` renders as `ê` with a stray acute. Guarded by `tokens.test.ts` |
| I16 | The theme has **three** states (system · light · dark), not two | A two-state toggle destroys the route back to "follow system", which is the default and where most users are |
| I17 | `NavTree` renders **twice** on one page (sidebar + mobile drawer), so child-list ids must come from `useId()` | Otherwise one copy's `aria-controls` points at the other copy's element |
