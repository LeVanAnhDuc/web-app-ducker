# ADR-0012 · Accept that the render cache is per-process and on disk

> **Date:** 2026-08-19
> **Status:** accepted
> **Related:** NFR-REL-05 · US-05

## 1. Context

Two full debugging rounds were lost to the same shape of problem: the database holds the
new value and the page keeps serving the old one.

The cause is that `revalidateTag` only reaches the process that calls it, and
`unstable_cache` persists into `.next/cache` on disk.

- `prisma db seed` runs outside any Next request, so it cannot call `revalidateTag`.
  Worse, `next build` then reads that same stale cache and bakes the previous seed's
  content into the built pages.
- `npm run e2e` starts its own server on port 3210. It writes and revalidates correctly
  — in *its* process. The dev server on 3000 never hears about it, and restarting does
  not help because the cache is on disk.

## 2. Decision

Do not work around it in code. State the rule instead, and put it where it is read:
**any content change that does not go through the running server requires
`rm -rf .next`** — whether the source is a seed, an e2e run, or hand-typed SQL. It is
invariant I12 and NFR-REL-05.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Have the seed call a revalidation endpoint | Needs the server running and a secret to authenticate with; the seed's main job is bootstrapping an environment where it may not be |
| Turn off `unstable_cache` in development | Hides in development exactly the behaviour that production has, so the trap moves rather than disappearing |
| A file watcher clearing `.next` | Machinery to hide a rule that fits in one line |

## 4. Consequences

**Gained:** the production caching behaviour is the same everywhere, and the rule is
short enough to remember.

**Lost / accepted:** a manual step that is easy to forget, whose symptom looks like a
database bug. Which is why it appears in `invariants.md`, `nfr.md` and here.
