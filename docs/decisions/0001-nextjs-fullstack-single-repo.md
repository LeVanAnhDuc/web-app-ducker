# ADR-0001 · Build as one full-stack Next.js app, not a client plus a separate API

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** FR-07 · FR-08 · FR-10

## 1. Context

The brief changed mid-brainstorm from "a docs page" to "a CMS". That turns a static site
into an application with a database, authentication and an admin area. The ecosystem
already contains both shapes: Match CV splits client and API into two services, while
Manage Gym is a single Next.js full-stack repo. One contributor, zero budget.

## 2. Decision

One Next.js 16 App Router repository. Admin writes go through **server actions** that
call the content layer directly. No separate API service, no REST layer between the
editor and the database.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Client + NestJS API, as in Match CV | Two deploy targets, two sets of environment variables, and a network hop for a CMS with a single user |
| Static site generator with markdown in the repo | Directly contradicts the requirement: content must change without a code change |

## 4. Consequences

**Gained:**
- One deploy, one set of secrets, no serialisation layer to keep in sync.
- Server actions write straight through `src/server/content/`.

**Lost / accepted:**
- A server action is its own public HTTP endpoint. Guarding the `/admin` layout guards
  nothing — every writing action must call `requireAdmin()` itself (invariant I8). This
  is the sharpest edge of the choice.
- The content layer is not reusable by a non-Next client without extracting it.

**Revisit when:** a second consumer of this content appears that is not this web app.
