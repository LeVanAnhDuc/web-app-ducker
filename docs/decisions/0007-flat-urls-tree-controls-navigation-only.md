# ADR-0007 · URLs stay flat; the navigation tree controls display only

> **Date:** 2026-08-18
> **Status:** accepted
> **Related:** FR-11 · US-06

## 1. Context

Navigation became a real tree of arbitrary depth
([ADR-0014](0014-one-nav-tree-three-node-kinds.md)). The tempting next step is to mirror
that tree in the URL: `/apps/satellites/match-cv`.

## 2. Decision

URLs stay flat: `/{locale}/apps/{slug}` and `/{locale}/docs/{slug}`. The tree decides
only how navigation is *displayed*. A `CONTAINER` has no URL of its own; addressing one
directly redirects to its first published child, or 404s if it has none.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Nest the URL along the tree path | Needs a catch-all route, creates slug collisions between branches, and **breaks every existing link** the moment someone drags an item to another branch — for no benefit |
| Give containers their own landing page | A page that exists only to list its children, which the sidebar already does |

## 4. Consequences

**Gained:** reorganising navigation is purely cosmetic. No redirects, no broken links,
no SEO damage.

**Lost / accepted:**
- The URL does not tell you where a page sits in the hierarchy.
- Slugs must be unique across the whole site rather than per branch.
- An app not attached to the tree is still reachable by URL and still appears in search.
  That is deliberate: hiding it would make the author think the page was lost when it is
  intact in the database. The admin UI shows a "not in navigation" warning instead.

**Revisit when:** slug collisions across sections become a practical problem.
