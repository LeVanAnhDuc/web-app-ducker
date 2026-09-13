# ADR-0015 · Accept one redeploy to add a language

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** NFR-I18N-05 · FR-17

## 1. Context

Locales are database rows, editable in the CMS
([ADR-0003](0003-locale-as-row-not-column.md)). But the routing that maps `/vi/...` and
`/en/...` runs in next-intl middleware **at the edge**, where there is no database
connection.

## 2. Decision

`scripts/generate-locales.ts` runs at `prebuild` and writes
`src/i18n/locales.generated.ts` from the database. The middleware imports that generated
list. Enabling a language, or reordering the language switcher, therefore takes effect
only after the next deploy.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Query the database from the middleware | Not possible at the edge, and it would put a query in front of every request |
| Hardcode `['vi','en']` | Adding a third language becomes a code change rather than a build input |
| Move routing out of the middleware | Loses edge routing, so every request reaches the origin |

## 4. Consequences

**Gained:** locale routing costs nothing at request time; the language list still has a
single source of truth in the database.

**Lost / accepted:** adding a language needs one redeploy — the only thing in this
product that does. Editing *content* never does, which is the promise that matters. The
same applies to reordering languages: the order is real and drives the public switcher,
but only from the next deploy on.

**Revisit when:** languages start being added often enough that the redeploy is a burden.
