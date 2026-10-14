# Load-bearing invariants

> **Answers:** What can I change that makes the system wrong **silently** — tests still green, result still wrong?
> **Status:** 🟢 complete — reviewed against this project 2026-09-14
> **Updated:** 2026-10-11 · branch fix/audit-findings
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
| I3 | **No cycles** — a node may not be its own descendant | Infinite loop while building the tree. Detection must walk **up** the parent chain; a `visited` set walking down never catches it, because a cycle has no root ancestor and the whole loop is simply unreachable — tree builds fine, data quietly vanishes. Enforced by `assertNoCycle` in `buildNavTree` (`src/content/nav-tree.ts`) |

I1, I2 and I4–I7 retired on 2026-10-11 (below): `listNavRows` builds every row from
`content/nav.ts` and the entry readers, so they hold by construction, and the
`assertNavInvariants` / `wouldCreateCycle` checks that only a deleted write path ever
called are gone with the draft/publish `status` field.

## Retired

| # | Invariant | Why retired |
| --- | --- | --- |
| ~~I1~~ | ~~A node with children must be `CONTAINER`~~ | **Retired 2026-10-11** — `listNavRows` makes only the three `content/nav.ts` groups containers, and every entry a leaf |
| ~~I2~~ | ~~A `CONTAINER` with no published child cannot be published~~ | **Retired 2026-10-11** — there is no publish state. A group whose `content/` folder is empty simply gets no top tab (`topTabs`), and the `/[locale]/n/[id]` fallback route, which could only redirect to that same first leaf or 404, is deleted |
| ~~I4~~ | ~~An `App` / `DocPage` attaches to exactly one node~~ | **Retired 2026-10-11** — one file is one row under its own group, by construction |
| ~~I5~~ | ~~A `CONTAINER` must have a label in the default locale~~ | **Retired 2026-10-11** — the labels are literals in `content/nav.ts`; a missing one drops the node rather than inventing a label (`buildNavTree`) |
| ~~I6~~ | ~~At least one published root node must exist~~ | **Retired 2026-10-11** — the three roots are literals in `content/nav.ts` |
| ~~I7~~ | ~~`kind` and the pointer columns agree~~ | **Retired 2026-10-11** — there are no pointer columns; `kind` and `href` are set together in `listNavRows` |
| ~~I8~~ | ~~Every writing server action starts with `await requireAdmin()`~~ | **Retired 2026-09-14** — there are no writing actions left; the administration surface is deleted (ADR-0019) |
| ~~I9~~ | ~~Only `src/server/content/`, `src/server/auth/`, `src/server/media/` touch Prisma / Auth.js / the S3 SDK~~ | **Retired 2026-09-14** — none of the three is a dependency any more, so `boundary.test.ts` had nothing left to guard and is deleted with them. ADR-0019 §4: if a server dependency ever returns, this invariant must return with it |
| ~~I10~~ | ~~Migrations are forward-only~~ | **Retired 2026-09-14** — there is no schema and no migration history (ADR-0018) |
| ~~I12~~ | ~~The on-disk render cache is not invalidated by an outside write~~ | **Retired 2026-09-14** — there is no cache and no outside write path; content is read fresh from `content/` (ADR-0018) |
| ~~I13~~ | ~~`revalidateTag(tag, "max")` is stale-while-revalidate~~ | **Retired 2026-09-14** — nothing calls `revalidateTag` any more; the search index route reads files directly on every request (NFR-PERF-05) |

I11 (UTC timestamps) is untouched here — out of this migration's scope.

R5 of the file-backed-registry design ("games have no detail page; `/games` links outward") is **retired 2026-10-04** by [ADR-0023](../decisions/0023-readme-and-releases-from-github.md): games now have the same overview and detail routes as apps.

## New since the file-backed move

| # | Invariant | What breaks if you violate it |
| --- | --- | --- |
| I18 | A content file's `status` must be one of the five closed values (`core` / `connected` / `standalone` / `planned` / `private`) | A sixth value throws in `parseEntry` (`src/content/frontmatter.ts`) and fails the build — previously impossible, because `status` was a Postgres enum column |
| I19 | `src/i18n/locales.ts` is a hand-maintained constant, no longer generated | A locale listed there with no matching `messages/<locale>.json` falls back to `vi` silently in `src/i18n/request.ts`. `messages.test.ts` checks `vi`/`en` match each other, not that every listed locale has a file — it does not catch this |
| I20 | Nav `href`s carry the locale prefix (`/${locale}/apps/...`) and `findTrail` matches on that exact string | Dropping the prefix, or comparing against a bare pathname, empties the sidebar with nothing erroring |
| I21 | `src/github/` is the only module that calls the GitHub API, and none of it throws (ADR-0023) | A throw fails every build while GitHub is down; a second caller escapes the token and the fetch cache. Guarded by `src/github/boundary.test.ts` |
| I22 | A Releases URL (`/<locale>/<group>/<slug>/releases`) is folded onto its README href by `navHref` before `findTrail` | The Releases URL is not a nav node: matching it as-is empties the sidebar and lights no top tab, with nothing erroring (I20) |
| I23 | A README's TOC is read off its rendered `<h2>`s (`renderMarkdownWithToc`), not by scanning the markdown for `## ` lines | A setext heading, a `## ` in an HTML comment or a quote makes a line scan and the renderer disagree, and every later TOC link lands on the wrong heading. `buildToc` + `attachHeadingIds` remain only for authored `.mdx` |

## Presentation

| # | Invariant | What breaks if you violate it |
| --- | --- | --- |
| I14 | Do not declare `font-weight` or `letter-spacing` in a `*.module.css` that also styles a heading | A class selector beats the `h1,h2,h3` element selector in `globals.css` and silently voids the serif-400 and no-tracking rules. Still live: `SectionBody.module.css` is gone as a component but its stylesheet is reused by `MarkdownBody.tsx` and still declares both properties |
| I15 | Georgia is banned from every font stack | It has no precomposed Vietnamese glyphs: `ế` renders as `ê` with a stray acute. Guarded by `tokens.test.ts` |
| I16 | The theme has **three** states (system · light · dark), not two | A two-state toggle destroys the route back to "follow system", which is the default and where most users are |
| I17 | `NavTree` renders **twice** on one page (sidebar + mobile drawer), so child-list ids must come from `useId()` | Otherwise one copy's `aria-controls` points at the other copy's element |
