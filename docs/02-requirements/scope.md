# Function inventory

> **Answers:** Which functions does the system have, and what state is each in?
> **Status:** 🟢 complete
> **Updated:** 2026-09-13 · commit b2d70a8
> **Update when:** brainstorming produces a new function (assign a new FR) · an FR changes state

<!-- HOW TO FILL
LIST ONLY. One line per function, short name. How it works belongs to that feature's
design document, not here.

IDs increment, are never reused, never deleted. Dropping a function means changing its
state to (dropped) and keeping the number — old commits and tests still reference it.

State: chưa · đang · xong · (bỏ)

DOES NOT CONTAIN: implementation, non-functional thresholds (-> nfr.md), why a solution
was chosen (-> decisions/).
-->

## Public site

| ID | Function | Journey | State |
| --- | --- | --- | --- |
| FR-01 | Home page: hero, ecosystem diagram, app grid | US-01 | xong |
| FR-02 | App page: what it is · quick start · usage · features · sections | US-01 | xong |
| FR-03 | Doc page: standalone guides (ecosystem overview, OAuth integration, adding an app) | US-01 | xong |
| FR-04 | Site search: per-locale index, lazily loaded, fuzzy-matched in the browser | US-02 | xong |
| FR-05 | Language switch with fallback to the default locale plus a "missing translation" badge | US-03 | xong |
| FR-11 | Navigation: top tab strip + left tree + mobile drawer, all from one `NavNode` tree | US-01 · US-06 | xong |
| FR-14 | Table of contents on the right, built from section anchors | US-01 | xong |
| FR-15 | Theme switch with three states: follow system · light · dark | US-01 | xong |
| FR-16 | SEO: `hreflang` for every enabled locale plus `x-default`, self-canonical | US-01 | xong |

## Administration (CMS)

| ID | Function | Journey | State |
| --- | --- | --- | --- |
| FR-06 | Single-account sign-in, behind a three-function abstraction so the provider can change | US-04 | xong |
| FR-07 | App editor: general info, features, sections, ordering, publish toggle | US-05 | xong |
| FR-08 | Doc page editor | US-05 | xong |
| FR-09 | Dashboard: what is still draft, which app is missing a translation | US-05 | xong |
| FR-10 | Navigation tree editor: add / move / reorder / delete nodes, with the invariants enforced | US-06 | xong |
| FR-12 | Media library: upload, pick, record dimensions | US-07 | xong |
| FR-13 | Draft preview behind a secret | US-08 | xong |
| FR-17 | Language administration: enable / disable, set default, reorder | US-03 | xong |

## Not built — see [`overview.md`](../01-product/overview.md) §4

| ID | Function | Why it is not here |
| --- | --- | --- |
| FR-18 | Ordering controls on `/admin/docs` | (bỏ) — the numeric `order` field and arrow buttons are two different models writing one column. See [ADR-0011](../decisions/0011-no-order-buttons-on-admin-docs.md) |
| FR-19 | Raw HTML inside markdown (`<kbd>`, `<details>`, `<br>`) | chưa — safe default of `remark-rehype`; opening it means `rehype-raw` plus dropping the hand-written HTML filter |
| FR-20 | Home page rendering the real `DocPage("home")` record | chưa — the record exists as a draft and `/docs/home` deliberately 404s. Open decision in [`backlog.md`](../04-state/backlog.md) |
| FR-21 | Sign-in through Ducker ID (OAuth) | chưa — needs `src/server/auth/providers/idms-oauth.ts` and a working OAuth flow on the identity provider, which does not exist yet |
