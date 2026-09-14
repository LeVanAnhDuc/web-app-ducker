# ADR-0015 · Accept one redeploy to add a language

> **Date:** 2026-08-17
> **Status:** accepted
> **Related:** NFR-I18N-05 · FR-17

## 1. Context

Locales were database rows, editable in the CMS
([ADR-0003](0003-locale-as-row-not-column.md)). But the routing that maps `/vi/...` and
`/en/...` runs in next-intl middleware **at the edge**, where there was no database
connection.

**Superseded 2026-09-13** by [ADR-0018](0018-content-is-files-not-rows.md): the
database is gone, and with it the row this ADR's mechanism generated from. The
conclusion below is unaffected — read on for the corrected mechanism.

## 2. Decision

~~`scripts/generate-locales.ts` runs at `prebuild` and writes
`src/i18n/locales.generated.ts` from the database.~~ There is no database and no
generation step any more: `src/i18n/locales.ts` (renamed from `locales.generated.ts` in
Task 10 of the file-backed-registry migration — the name lied once nothing generated
it) is a hand-maintained constant, the same shape as `content/nav.ts`. The middleware
imports it directly. Enabling a language, or reordering the language switcher,
therefore takes effect only after the next deploy — exactly as before, only the edit is
now to a source file instead of a database row.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Query the database from the middleware | Not possible at the edge, and it would put a query in front of every request |
| Hardcode `['vi','en']` | Adding a third language becomes a code change rather than a build input. **This is what ADR-0018/ADR-0019 later did anyway** — once there was no database left to be the build input, a hand-maintained constant was the only option, and the "code change" cost this row warned about became the accepted mechanism, not a rejected one |
| Move routing out of the middleware | Loses edge routing, so every request reaches the origin |

## 4. Consequences

**Gained:** locale routing costs nothing at request time; the language list still has a
single source of truth — now `src/i18n/locales.ts` in git, rather than a database row.

**Lost / accepted:** adding a language needs one redeploy — the only thing in this
product that does. Editing *content* never does, which is the promise that matters. The
same applies to reordering languages: the order is real and drives the public switcher,
but only from the next deploy on.

**Revisit when:** languages start being added often enough that the redeploy is a burden.
