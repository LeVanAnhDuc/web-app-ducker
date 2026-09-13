# ADR-0006 · Auth.js Credentials, hidden behind a three-function abstraction

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** FR-06 · FR-21 · NFR-SEC-01 · NFR-SEC-03

## 1. Context

The ecosystem's plan is that every app signs in through Ducker ID over OAuth/OIDC. That
provider exposes no `/oauth/authorize`, no `/oauth/token` and no JWKS yet, and no
satellite app uses it. Waiting would mean not shipping.

## 2. Decision

Auth.js with a Credentials provider: one administrator account, a bcrypt hash in an
environment variable. All of it sits behind `src/server/auth/`, which exposes exactly
`getCurrentUser()`, `requireAdmin()` and `signOut()`. Nothing outside that folder
imports Auth.js, and a test enforces it.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Wait for Ducker ID's OAuth flow | Blocks this project on another repository that has not started the work |
| Call Auth.js directly from pages and actions | Twenty-plus call sites to rewrite the day the provider changes |
| A hosted identity provider (Auth0, Clerk) | Cost, and a third party for a single-user admin area |

## 4. Consequences

**Gained:**
- Switching to Ducker ID means adding one file,
  `src/server/auth/providers/idms-oauth.ts`. No other file changes — that is the whole
  point of the layer.
- Sign-in is rate limited at 5 attempts per 15 minutes (NFR-SEC-03).

**Lost / accepted:**
- One shared account, with no audit trail of who edited what.
- The password hash lives in `.env`, where an unescaped `$` truncates it silently and
  the only symptom is "wrong password". Documented at [`../05-operations/runbook.md`](../05-operations/runbook.md) §3.1.
- `requireAdmin()` keeps its no-argument signature even though it needs the locale.
  Changing it would touch twenty-plus call sites, and forgetting one would be a silent
  failure identical to the bug being fixed
  ([ADR-0010](0010-locale-aware-login-redirect.md)).

**Revisit when:** Ducker ID's OAuth flow is verified working end to end.
