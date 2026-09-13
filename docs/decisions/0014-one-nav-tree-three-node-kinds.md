# ADR-0014 · One self-referencing navigation tree with three node kinds

> **Date:** 2026-08-18
> **Status:** accepted
> **Related:** FR-10 · FR-11 · US-06 · supersedes the `DocPage.group` model

## 1. Context

Before this, the sidebar was one level deep, grouped by `DocPage.group` — a flat,
unlocalised string that therefore could not be translated and sat `null` on every record
(see [ADR-0003](0003-locale-as-row-not-column.md)). The top tab strip was separate. The
request was: an arbitrarily deep tree, managed from the CMS, where **a parent with
children has no content of its own and only toggles.**

## 2. Decision

One self-referencing `NavNode` table drives both the top tabs and the sidebar. Root nodes
(`parentId = null`) are the tabs; their descendants are the sidebar. Three kinds:
`CONTAINER`, `APP`, `DOC`. `DocPage.group` was dropped in migration `0002_nav_tree`.

## 3. Why a third kind was forced

Applying "a parent with children has no content" directly to `App` would mean an app with
children **loses its repo, stack and features** — the data still in the database with no
route to it. So the rule forces a node kind that exists only to group. `App` and
`DocPage` are always leaves.

## 4. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Keep `DocPage.group`, add a second level | Still unlocalisable, still a separate model from the tab strip |
| Two tables — tabs and sidebar | The same tree rendered twice; two places to keep consistent |
| Let an `App` have children | Loses that app's own content, as above |

## 5. Consequences

**Gained:** one tree, one editor, arbitrary depth, translatable labels. Both navigation
surfaces are guaranteed consistent because they are the same data.

**Lost / accepted:**
- A self-referencing tree is the easiest place in the system to create meaningless data,
  so it carries six invariants (I1–I6) that the schema cannot express. Three of them
  were only found by trying to break the tree.
- `NavNode.app` / `NavNode.docPage` use `onDelete: Cascade`, which **bypasses** the
  invariant checks — deleting an app can leave a published container empty. `deleteApp`
  and `deleteDocPage` re-check the parent afterwards and demote it.
- `NavTree` renders twice per page (sidebar + mobile drawer), so its child-list ids must
  come from `useId()` (invariant I17).

**Revisit when:** navigation needs to differ between the tab strip and the sidebar.
