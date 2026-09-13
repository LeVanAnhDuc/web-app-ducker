# ADR-0002 · PostgreSQL on Neon with Prisma 7

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** NFR-DATA-03

## 1. Context

The content model is relational and heavily translated: every content record has a
per-language child row. The infrastructure ceiling is $0/month
([`overview.md`](../01-product/overview.md) §5). Database-backed tests need a database
that can be wiped without touching development data.

## 2. Decision

PostgreSQL hosted on Neon, accessed through Prisma 7. A Neon **branch** named `test`
serves the database-backed test suites.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| SQLite in the repo | No hosted write path from a serverless deploy |
| MongoDB, as the identity provider uses | The model is relational and translation-heavy; joins are the normal case here |
| A second Neon project instead of a branch | Branching is free and instant; a project per environment is not |

## 4. Consequences

**Gained:**
- Branching gives a throwaway test database at no cost.
- Prisma's generated client keeps schema and TypeScript types in one place.

**Lost / accepted:**
- Neon autosuspends after five minutes idle. Harmless for the public site because pages
  are static ([ADR-0004](0004-ssg-with-tag-revalidation.md)), but the first admin
  request after a quiet period pays a cold start.
- **There is only one `test` branch and `prisma migrate reset` empties it.** Two suites
  running at once destroy each other's data mid-run. Treat it as an exclusive resource.
- Prisma 7 moved the datasource URL out of `schema.prisma` into `prisma.config.ts`, and
  the CLI does **not** read `.env` — a whole class of confusing `P1010` failures that
  look like a permissions problem and are actually the wrong database.

**Revisit when:** the free tier's 100 CU-hours become a real constraint, or a second
person needs to run the suite concurrently (then add a `test-ci` branch).
