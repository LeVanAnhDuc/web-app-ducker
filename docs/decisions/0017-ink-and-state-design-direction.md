# ADR-0017 · Colour is reserved for status; the chrome has none

> **Date:** 2026-09-13
> **Status:** accepted
> **Related:** ADR-0008 (upheld, not superseded) · NFR-I18N-04 · NFR-PERF-02

## 1. Context

Commit `d2f61bb` deleted `docs/design/` — the approved v3 rules and all three mockups.
The design system was therefore re-bootstrapped from nothing. `design-bootstrap`
sequences two plugins: `ui-ux-pro-max` supplies constraints, `frontend-design` supplies
choices, and step 1's output is input to step 2, never the decision.

Step 1 classified Ducker as an *API Developer Portal* and returned a `#020617` ground
with a `#22C55E` accent, JetBrains Mono headings over IBM Plex Sans body, and component
CSS whose `.card` background equalled the page background. Ducker is a registry of eight
applications, and five of its status values already carry hue.

## 2. Decision

The interface chrome has **no accent colour**. Links, buttons, focus, selection and the
active nav item are expressed with ink, weight, underline and a filled block. The five
status values — core, connected, standalone, planned, private — are the only hue on the
page. Ground is a cool grey-green `#F4F5F2`, ink `#1B1D1A`; dark mode swaps the two
rather than introducing a second palette. Headings are system sans set tight, body is
system serif at 16/1.75/66ch — the reverse of the usual pairing. Tokens and measured
contrast ratios live in `docs/design-system/ducker/MASTER.md`.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Step 1's `#020617` + `#22C55E` | It is verbatim a cliché `frontend-design` names: "a near-black background with a single bright acid-green accent" |
| Step 1's JetBrains Mono + IBM Plex Sans web fonts | ADR-0008 still holds: Vietnamese-complete fonts are heavy, and mono is reserved for the repo slug, so a mono heading collides with the naming rule |
| Keep a single accent hue alongside the status colours | With six hues competing, status stops reading as information and becomes decoration — the registry's whole job is to be scanned |
| A warm cream ground with a terracotta accent | The most-generated palette there is, and the deleted v3 already used it |
| Restore v3 from `b2d70a8` | The operator asked for a blank slate after deleting it deliberately |

## 4. Consequences

**Gained:** status is unambiguous because nothing else competes with it; no font payload,
no FOUT, correct diacritics; the palette avoids all three known generated-design tells;
every colour pair is measured, lowest ratio 5.45:1.

**Lost / accepted:**
- A chrome with no accent can read as austere or unfinished. Type and the status
  swatches have to carry the personality alone.
- `--tap` moves 28px → 44px, because step 1's a11y rules are not overridable. Every hit
  area grows, and `e2e/a11y-tap-target.spec.ts` needs its threshold raised.
- `src/styles/tokens.css` and `tokens.test.ts` no longer match this system and must be
  rewritten; until then the running app shows the old palette.
- Brand recognition through colour is given up; recognition has to come from the
  registry row.

**Revisit when:** the status vocabulary drops below three values — with two, reserving
all colour for them stops paying for itself.
