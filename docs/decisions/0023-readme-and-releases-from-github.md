# ADR-0023 · An entry's README and releases come from GitHub, refreshed hourly

> **Date:** 2026-10-04
> **Status:** accepted
> **Related:** FR-25 · FR-26 · FR-27 · I21 · I22 · NFR-REL-04 · amends ADR-0018 · ADR-0019 §4 · ADR-0022

## 1. Context

Every app page rendered a hand-written Vietnamese body from `content/apps/<slug>.vi.mdx`.
That body restated, by hand, what the repository's README already said, and drifted the
moment the README changed. Release history was shown nowhere, although eleven of the
twelve game repositories publish between 12 and 24 releases each. Games had no detail
page at all (R5): their cards linked straight out to GitHub.

The one editor of this site is also the one editor of every README. Writing the same
description twice, in two places, is the cost this decision removes.

## 2. Decision

For every entry whose frontmatter has a public github.com `repo:`, the detail page shows
two link-tabs, **README** and **Releases**, at two URLs: `/<group>/<slug>` and
`/<group>/<slug>/releases`. Their content comes from the GitHub REST API:

- `GET /repos/{o}/{r}/readme`. Relative links are rewritten to the blob view and
  relative images to raw.githubusercontent.com, both on the README's own branch. The
  first H1 is dropped, because the page hero already names the project.
- `GET /repos/{o}/{r}/releases?per_page=100`. Drafts are dropped and releases sorted
  newest first; only the newest is open.

Pages are generated at build time and refreshed by **ISR at most once an hour**
(`revalidate = 3600` in each route). `src/github/` is the only module that calls the API
(I21). It **never throws**: a failure becomes an `unavailable` state that renders a
notice with a link to GitHub, and one `console.warn` naming the repository.

This **amends ADR-0018 §2** for entries with a repository. Frontmatter stays the source
of name, status, order, tagline and stack. The `.mdx` body is no longer rendered for
those entries, but it still feeds the search index, which stays file-built. Entries with
no repository (Tier List, Task Management, Duck Strike) keep their `.mdx` body and get
no tabs.

Games get the same shape as apps: `/games` and `/apps` are overview pages, the first
item of each sidebar and the target of each top tab, and R5 is retired.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Fetch in the browser on each visit | 60 requests an hour per viewer's IP, a loading state on every visit, and no content in the HTML for search engines |
| Fetch at build time only | A README edit would need a redeploy to show — the same drift, one step removed |
| One URL with client-side tabs | Every page's HTML would carry up to 24 release bodies, and the table of contents would have to swap on the client |
| One URL with `?tab=releases` | Reading `searchParams` forces dynamic rendering, losing ISR and calling GitHub on every request |
| Keep the last good copy when a refresh fails | Needs storage this site deliberately does not have (ADR-0018, ADR-0019). The `unavailable` state lasts at most until the next refresh |
| Mirror READMEs into `content/` with a script | A second copy of the README is exactly the drift this decision removes |

## 4. Consequences

**Gained:** descriptions and release history are as current as the repositories,
within an hour; games have real pages; there is one place to edit a project's
description.

**Lost / accepted:**
- The build reaches the network. It **never fails** because of it — GitHub down,
  rate-limited or 404 renders the notice — but a build without network produces
  notices instead of READMEs. NFR-REL-04 is reworded accordingly.
- One clean build makes about 42 anonymous calls (measured 2026-10-04: 19 repositories
  × 2, plus the uncached 404s). The anonymous limit is 60 an hour per IP, so two clean
  builds within an hour from one machine run out. `GITHUB_TOKEN` (optional, no scopes)
  raises it to 5,000. The CI check job stays environment-free (NFR-REL-04); the deploy
  job's `vercel build` gets the Actions token.
- README text is English and is not in the search index.
- ISR needs a server host. On a static-only host the tabs would update only on rebuild.

**Revisit when:** a static-only host is chosen; a repository needs a README that differs
from what the site should say; or search has to cover README text.
