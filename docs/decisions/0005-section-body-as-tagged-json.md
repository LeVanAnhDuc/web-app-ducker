# ADR-0005 · `SectionTranslation.body` is JSON carrying a `type` discriminator

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** FR-19

## 1. Context

Sections hold markdown today. A block-based editor is explicitly a Non-Goal for now, but
it is the obvious next shape for a CMS, and switching later must not require rewriting
content a human has already checked.

## 2. Decision

Store the body as JSON with a `type` discriminator rather than as a plain text column.
Today every row is one markdown block; a future block editor adds new `type` values
beside it.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| A plain `text` column | Moving to blocks later means migrating content a human has already written and re-checked |
| Building the block editor now | Ten times the work for an editor with one user, before anyone knows which blocks are wanted |

## 4. Consequences

**Gained:** the door to blocks is open with no migration of old rows.

**Lost / accepted:**
- Slightly heavier reads and writes, plus validation a plain column would get for free.
- A shape with no second implementation is a guess. If blocks never arrive, this is
  unused generality — a small, deliberate bet.

**Revisit when:** a block editor is actually built, or two years pass without one.
