# ADR-0003 · Locale is a row in a translation table, not a column

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** FR-05 · NFR-I18N-05

## 1. Context

The site is Vietnamese and English from day one and should stay open to a third
language. The two candidate shapes are a column per language on each content table
(`titleVi`, `titleEn`) or a child table with one row per language.

## 2. Decision

Every translated field lives in a `*Translation` table with a `locale` column:
`AppTranslation`, `FeatureTranslation`, `DocPageTranslation`, `SectionTranslation`,
`NavNodeTranslation`. Adding a language is **inserting data**, never a migration.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| A column per language | Every new language is a schema migration across every content table, and every query has to know the language list at compile time |
| One JSON blob keyed by locale | Cannot be indexed or queried per language; partial translations become invisible to any "what still needs translating" query |

## 4. Consequences

**Gained:**
- A third language costs data, not schema.
- "Which app is missing an English translation" is an ordinary query — which is exactly
  what powers the admin dashboard and the missing-translation badge.

**Lost / accepted:**
- Every read joins. Acceptable because the public path is static and does not query.
- The rule has to be obeyed *everywhere*. `DocPage.group` was once a flat unlocalised
  string, which is precisely why it could never be translated and sat `null` on every
  record for two milestones. It was deleted in `0002_nav_tree` and replaced by
  `CONTAINER` nodes, which do have a translation table
  ([ADR-0014](0014-one-nav-tree-three-node-kinds.md)).

**Revisit when:** realistically never — but if it is, note that the paragraph above is
what a column-shaped design looks like from the inside.
