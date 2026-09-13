# ADR-0010 · One locale-aware login path, without changing `requireAdmin()`

> **Date:** 2026-08-19
> **Status:** accepted
> **Related:** US-03 · US-04 · FR-06

## 1. Context

`requireAdmin()` redirected an unauthenticated caller to `/admin/login` with no locale.
The original bug report claimed a deep link to `/en/admin/apps` would land on
`/vi/admin/login`. Measuring it showed that claim was **wrong**: for a real browser
navigation, next-intl's `syncCookie` attaches `NEXT_LOCALE` to that very 307, so the
middleware guesses right and it only costs an extra hop.

The real failure is in **background requests** — soft navigation, server actions,
revalidation — where `syncCookie` deliberately does nothing. There the redirect goes to
`/admin/login`, the middleware then bounces to `/vi/...`, and a reader who was on `/en`
is thrown into Vietnamese.

## 2. Decision

One file, `src/server/auth/login-path.ts`, knows both authentication and i18n and builds
`/{locale}/admin/login`. A boundary test asserts that **no other file** in the auth
layer imports `next-intl`. `requireAdmin()` keeps its zero-argument signature.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| `requireAdmin(locale)` | Twenty-plus call sites; forgetting one is a silent failure identical to the bug being fixed |
| Let the middleware fix it | It is the middleware's guess that is wrong here, because the background request carries no cookie hint |
| Let `src/server/auth/` import `next-intl` freely | Erodes the boundary the layer exists to hold ([ADR-0006](0006-auth-behind-a-three-function-abstraction.md)) |

## 4. Consequences

**Gained:** correct locale on every redirect path, with the i18n dependency quarantined
in one file that has a test guarding it.

**Lost / accepted:** one more file in the auth layer, and one more boundary rule to
remember.

**Note for the reader:** this ADR exists partly as a record that the *documented* bug was
not the *actual* bug. Measure before believing a bug report, including your own.
