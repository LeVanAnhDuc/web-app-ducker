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
| FR-22 | Catalogue entries authored as files under `content/`, one file per record per locale | US-09 | đang |
| FR-23 | Games group: the twelve duck games listed as their own section, flat, no IdP branch | US-01 | đang |
| FR-24 | Search index built from the content files at build time, not from a database | US-02 | đang |

## Administration (CMS) — retired 2026-09-13

Removed entirely by [`../specs/file-backed-registry/design.md`](../specs/file-backed-registry/design.md).
Content is now files in the repository; editing is a commit. The numbers are kept because
old commits and tests still reference them. See [ADR-0019](../decisions/0019-no-administration-surface.md).

| ID | Function | Journey | State |
| --- | --- | --- | --- |
| FR-06 | Single-account sign-in, behind a three-function abstraction so the provider can change | US-04 | (bỏ) |
| FR-07 | App editor: general info, features, sections, ordering, publish toggle | US-05 | (bỏ) |
| FR-08 | Doc page editor | US-05 | (bỏ) |
| FR-09 | Dashboard: what is still draft, which app is missing a translation | US-05 | (bỏ) |
| FR-10 | Navigation tree editor: add / move / reorder / delete nodes, with the invariants enforced | US-06 | (bỏ) |
| FR-12 | Media library: upload, pick, record dimensions | US-07 | (bỏ) |
| FR-13 | Draft preview behind a secret | US-08 | (bỏ) — a draft is a branch; Vercel builds a preview URL per branch |
| FR-17 | Language administration: enable / disable, set default, reorder | US-03 | (bỏ) — a language is a file suffix |

## Not built — see [`overview.md`](../01-product/overview.md) §4

| ID | Function | Why it is not here |
| --- | --- | --- |
| FR-18 | Ordering controls on `/admin/docs` | (bỏ) — the numeric `order` field and arrow buttons are two different models writing one column. See [ADR-0011](../decisions/0011-no-order-buttons-on-admin-docs.md) |
| FR-19 | Raw HTML inside markdown (`<kbd>`, `<details>`, `<br>`) | chưa — safe default of `remark-rehype`; opening it means `rehype-raw` plus dropping the hand-written HTML filter |
| FR-20 | Home page rendering the real `DocPage("home")` record | chưa — the record exists as a draft and `/docs/home` deliberately 404s. Open decision in [`backlog.md`](../04-state/backlog.md) |
| FR-21 | Sign-in through Ducker ID (OAuth) | (bỏ) — there is no longer anything to sign in to. Revisit only if an end-user account ever appears |
