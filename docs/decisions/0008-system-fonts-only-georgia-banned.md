# ADR-0008 · System fonts only, and Georgia is banned

> **Date:** 2026-08-18
> **Status:** accepted
> **Related:** NFR-I18N-04 · NFR-PERF-02

## 1. Context

A documentation site that loads slowly loses its reason to exist. Every font with full
Vietnamese diacritic coverage is heavy. The reference site studied during design
(`code.claude.com/docs`) uses `Georgia, "Times New Roman", serif` as its serif stack.

## 2. Decision

No web fonts at all. Character comes from **how type is set** — scale, measure, leading
— not from the font name. **Georgia is banned from every font stack**, enforced by a
test in `tokens.test.ts`.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Self-host a subsetted Vietnamese font | Subsetting diacritics is fragile, and the weight still lands on the critical path of a page whose whole promise is speed |
| Copy the reference site's stack verbatim | **This is the trap.** Georgia has no precomposed Vietnamese glyphs: `ế` renders as `ê` with a stray floating acute. Every Vietnamese heading on Windows breaks |

Six system serif faces were rendered and looked at before choosing.

## 4. Consequences

**Gained:** no font payload, no FOUT, no layout shift, correct diacritics everywhere.

**Lost / accepted:**
- The site looks slightly different across operating systems.
- The typographic decisions have to carry the design alone — which is why the scale was
  measured from five large documentation sites rather than chosen by taste: body 16px,
  leading 1.75, measure 66 characters. The 1.75 is not preference; stacked diacritics
  (ế ữ ộ ằ) touch the line above at tighter leading.

**Revisit when:** a Vietnamese-complete variable font becomes small enough to be free.
