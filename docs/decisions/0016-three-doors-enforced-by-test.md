# ADR-0016 · Three doors to the outside world, enforced by a test

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** NFR-SEC-01 · FR-21

## 1. Context

Three dependencies are likely to change over this project's life: the database, the
authentication mechanism (Credentials today, Ducker ID OAuth eventually) and the image
store. If imports of Prisma, Auth.js and the S3 SDK spread through pages and components,
each swap becomes a repository-wide edit.

## 2. Decision

Exactly three modules may touch those dependencies:

- `src/server/content/` — the only place that touches Prisma
- `src/server/auth/` — the only place that knows Auth.js
- `src/server/media/` — the only place that knows the S3 SDK

This is **not** a documentation convention. `src/server/auth/boundary.test.ts` scans the
source and fails on violation, and the same technique guards `src/server/auth/` against
importing `next-intl` ([ADR-0010](0010-locale-aware-login-redirect.md)).

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| A written convention in `CLAUDE.md` | Conventions are followed until someone is in a hurry, and nothing reports the breach |
| An ESLint `no-restricted-imports` rule | Workable, but the test can also assert positive facts — such as which symbols the auth layer exposes — and it lives beside the code it protects |
| Separate packages with real dependency boundaries | A monorepo's worth of tooling for a single-app repository |

## 4. Consequences

**Gained:** changing the cache, the database, the storage provider or the authentication
mechanism each touches one layer. It is what makes FR-21 a one-file change.

**Lost / accepted:**
- Some indirection: a page that wants one field still goes through the content layer.
- The test is a string scan, so it can be fooled by a dynamic import. It catches the
  realistic mistake, not a determined one.

**Revisit when:** a fourth dependency of the same weight appears and the pattern needs a
name rather than three hardcoded folders.
