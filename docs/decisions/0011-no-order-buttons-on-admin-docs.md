# ADR-0011 · No ordering buttons on `/admin/docs`

> **Date:** 2026-08-19
> **Status:** accepted
> **Related:** FR-08 · FR-18

## 1. Context

`OrderControls` (up / down / top / bottom) is used in four places: root nav nodes, child
nav nodes, `Feature` and `Section`. `/admin/docs` has none, which looks like an
oversight. It is not.

`saveDocPage` **does** write `DocPage.order`, from a numeric input in the editor's
general-information block. An earlier version of this note claimed no mutation wrote
that column; that was wrong.

## 2. Decision

Leave `/admin/docs` without arrow buttons. The numeric field stays as the only way to
set `DocPage.order`.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Add `OrderControls` next to the numeric field | The two are **different models writing one column**. Buttons are only correct when the column is a contiguous permutation `0..n-1`; the field accepts any integer, including negatives (`/^-?\d+$/`) and duplicates. The first button press would silently renumber the whole table, destroying gaps someone left on purpose (10, 20, 30 to insert between) |
| Remove the numeric field and add buttons | The right fix, and a contract change to the general-information block — not a small job |

## 4. Consequences

**Gained:** no place where two numbers disagree about the same column.

**Lost / accepted:** reordering doc pages means typing numbers. The payoff is smaller
than it looks: since `0002_nav_tree`, `DocPage.order` no longer drives the public
sidebar — `NavNode.order` does, and that **is** reorderable at `/admin/navigation`. What
is left is the admin list order and tie-breaking in the search index.

**Revisit when:** someone is willing to drop the numeric field, making the column a true
permutation.
