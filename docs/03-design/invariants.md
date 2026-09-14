# Load-bearing invariants

> **Answers:** What can I change that makes the system wrong **silently** — tests still green, result still wrong?
> **Status:** 🟢 complete — reviewed against this project 2026-09-14
> **Updated:** 2026-09-14 · commit 3e4e67a
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
| I2 | A `CONTAINER` with no published child **cannot be published** | A tab that opens onto nothing |
| I3 | **No cycles** — a node may not be its own descendant | Infinite loop while building the tree. Detection must walk **up** the parent chain; a `visited` set walking down never catches it, because a cycle has no root ancestor and the whole loop is simply unreachable — tree builds fine, data quietly vanishes |
| I4 | An `App` / `DocPage` attaches to **exactly one** node | Appears twice in the sidebar and counts twice in the search index |
| I5 | A `CONTAINER` must have a label in the **default locale** | A clickable blank line in the sidebar |
| I6 | At least **one** published root node must exist | No tabs means no way into anything |
| I7 | `kind` and the pointer columns agree: `APP ⟺ appId != null`, `DOC ⟺ docPageId != null`, `CONTAINER ⟺ both null` | A node claiming to be one kind while wired like another |

I1–I7 were partly database-enforced; there is no database now. `content/nav.ts` builds
every row once per app/doc/game group, so I1, I4, I7 hold by construction. Only I3 is
still enforced in code: `assertNoCycle`, called from `buildNavTree`
(`src/content/nav-tree.ts`), throws before a cycle can reach a rendered tree. I2, I5 and
I6 live only inside `assertNavInvariants` in the same file, and nothing in `src/` or
`e2e/` calls it — its only caller was the deleted `src/server/content/mutations.ts`.
`wouldCreateCycle` is in the same state, exercised only by `nav-tree.test.ts`. Do not
wire `assertNavInvariants` into `listNavRows` to close this gap: I2 ("a published
CONTAINER must have a published child") would then throw on an empty content directory —
turning the silent-empty-page failure mode of a missing `content/` bundle into a hard
crash instead.

## Retired

| # | Invariant | Why retired |
| --- | --- | --- |
| ~~I8~~ | ~~Every writing server action starts with `await requireAdmin()`~~ | **Retired 2026-09-14** — there are no writing actions left; the administration surface is deleted (ADR-0019) |
| ~~I9~~ | ~~Only `src/server/content/`, `src/server/auth/`, `src/server/media/` touch Prisma / Auth.js / the S3 SDK~~ | **Retired 2026-09-14** — none of the three is a dependency any more, so `boundary.test.ts` had nothing left to guard and is deleted with them. ADR-0019 §4: if a server dependency ever returns, this invariant must return with it |
| ~~I10~~ | ~~Migrations are forward-only~~ | **Retired 2026-09-14** — there is no schema and no migration history (ADR-0018) |
| ~~I12~~ | ~~The on-disk render cache is not invalidated by an outside write~~ | **Retired 2026-09-14** — there is no cache and no outside write path; content is read fresh from `content/` (ADR-0018) |
| ~~I13~~ | ~~`revalidateTag(tag, "max")` is stale-while-revalidate~~ | **Retired 2026-09-14** — nothing calls `revalidateTag` any more; the search index route reads files directly on every request (NFR-PERF-05) |

I11 (UTC timestamps) is untouched here — out of this migration's scope.

## New since the file-backed move

| # | Invariant | What breaks if you violate it |
| --- | --- | --- |
| I18 | A content file's `status` must be one of the five closed values (`core` / `connected` / `standalone` / `planned` / `private`) | A sixth value throws in `parseEntry` (`src/content/frontmatter.ts`) and fails the build — previously impossible, because `status` was a Postgres enum column |
| I19 | `src/i18n/locales.ts` is a hand-maintained constant, no longer generated | A locale listed there with no matching `messages/<locale>.json` falls back to `vi` silently in `src/i18n/request.ts`. `messages.test.ts` checks `vi`/`en` match each other, not that every listed locale has a file — it does not catch this |
| I20 | Nav `href`s carry the locale prefix (`/${locale}/apps/...`) and `findTrail` matches on that exact string | Dropping the prefix, or comparing against a bare pathname, empties the sidebar with nothing erroring |

## Presentation

| # | Invariant | What breaks if you violate it |
| --- | --- | --- |
| I14 | Do not declare `font-weight` or `letter-spacing` in a `*.module.css` that also styles a heading | A class selector beats the `h1,h2,h3` element selector in `globals.css` and silently voids the serif-400 and no-tracking rules. Still live: `SectionBody.module.css` is gone as a component but its stylesheet is reused by `MarkdownBody.tsx` and still declares both properties |
| I15 | Georgia is banned from every font stack | It has no precomposed Vietnamese glyphs: `ế` renders as `ê` with a stray acute. Guarded by `tokens.test.ts` |
| I16 | The theme has **three** states (system · light · dark), not two | A two-state toggle destroys the route back to "follow system", which is the default and where most users are |
| I17 | `NavTree` renders **twice** on one page (sidebar + mobile drawer), so child-list ids must come from `useId()` | Otherwise one copy's `aria-controls` points at the other copy's element |
