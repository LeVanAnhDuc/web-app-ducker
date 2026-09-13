# ADR-0004 · Static generation with on-demand tag revalidation, not SSR

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** FR-01 · FR-02 · FR-03 · NFR-PERF-02

## 1. Context

Documentation is read-heavy and write-light. The database autosuspends after five
minutes idle ([ADR-0002](0002-postgres-on-neon-with-prisma.md)). The product's central
promise is that a CMS edit reaches the public page **without a deploy**, which rules out
build-time-only generation.

## 2. Decision

Public pages are static HTML on the CDN. Content reads are wrapped in `unstable_cache`
with tags; every mutation calls `revalidateTag` for the tags it touched.
`dynamicParams` stays `true`, so an app created in the CMS gets a page on first visit
without a redeploy.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| SSR on every request | Every page view becomes a database query, and readers intermittently pay the autosuspend cold start |
| Pure SSG, revalidated by redeploying | Breaks the central promise |
| Time-based ISR | Either stale for the window, or querying constantly — the tag is the precise signal and it is available |

## 4. Consequences

**Gained:**
- Zero database queries on the public path; the reader never meets a cold start.
- Content edits appear without a deploy, proven by `e2e/content-roundtrip.spec.ts`.

**Lost / accepted:**
- `revalidateTag(tag, "max")` is stale-while-revalidate: the **first** view after a
  write may still be the old copy. A test that writes, reads once and asserts will flake
  (invariant I13).
- The cache is per-process and on disk, with consequences of its own — see
  [ADR-0012](0012-ssg-cache-is-per-process-and-on-disk.md).

**Revisit when:** content becomes write-heavy, or per-reader personalisation appears.
