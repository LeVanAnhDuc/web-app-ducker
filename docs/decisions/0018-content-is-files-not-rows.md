# ADR-0018 · Content is files in this repository, not rows in Postgres

> **Date:** 2026-09-13
> **Status:** accepted
> **Related:** FR-22 · FR-24 · NFR-REL-04 · NFR-DATA-03 · supersedes ADR-0002 · ADR-0003 · ADR-0005 · ADR-0012

## 1. Context

The corpus is about a hundred short records — ten applications, twelve games, a handful
of guides — changing a few times a month. Serving them cost a Neon project with two
branches, Prisma with two migrations, a seed script, an on-disk render cache with its own
invalidation rule, and five environment variables that must agree across three
environments.

`NFR-DATA-03` already recorded the sharp edge: once content has been edited through the
CMS the database is the only copy, and **there is no backup**. Meanwhile the one person
who edits this content edits this repository daily.

## 2. Decision

Content moves into `content/` as MDX with frontmatter — one file per record per locale,
`content/apps/<slug>.<locale>.mdx`. The build reads the file tree. Postgres, Prisma, the
migrations and the seed are deleted. Locale stops being a row and becomes a filename
suffix; the fallback chain is unchanged, so `FR-05` and its missing-translation badge
still work.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Keep Postgres, delete only the admin UI | Keeps every operational cost — Neon, migrations, the cache rule — while removing the only convenient way to write. Worst of both |
| SQLite committed to the repository | A binary in git diffs as noise, merges as a conflict, and buys nothing over text for a hundred records |
| A hosted headless CMS | Trades a database for a vendor and a second place for content to live. The whole point is one place |
| Keep locale as a row inside one file | Reproduces the translation table in YAML. A sibling file is what a filesystem is for |

## 4. Consequences

**Gained:** content has a backup by construction and a reviewable diff; `pnpm build`
succeeds with **no environment variables at all**; `ADR-0012`'s cache-invalidation rule
and `NFR-REL-05` stop applying, because there is no external write path.

**Lost / accepted:**
- Editing requires a checkout. Acceptable only because there is exactly one editor.
- A language now costs a file per record rather than a row, so adding one is a bulk
  edit. `ADR-0015`'s "one redeploy" cost is unchanged.
- Content and code share a history. A typo fix and a refactor land in the same log.

**Revisit when:** a second person needs to edit content without a checkout, or the
corpus passes roughly a thousand records.
