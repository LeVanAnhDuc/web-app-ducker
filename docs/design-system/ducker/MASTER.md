# Design System Master File — Ducker

> **LOGIC:** When building a specific page, first check `pages/[page-name].md`.
> If that file exists, its rules **override** this Master file. If not, follow the rules below.

**Project:** Ducker · **Category:** ecosystem registry + documentation + CMS
**Bootstrapped:** 2026-09-13 · **Direction:** *Ink and state*

---

## 0. How this file was produced, and what may still change it

`design-bootstrap` ran in two steps. Step 1 (`ui-ux-pro-max`) supplies **constraints**;
step 2 (`frontend-design`) supplies **choices**. The split is not negotiable:

| Owned by step 1 — **not overridable** | Owned by step 2 — final say |
| --- | --- |
| A11y rules: 4.5:1 text contrast, 44px targets, visible focus, reduced-motion | Palette hex values |
| Anti-patterns, pre-delivery checklist | Typeface pairing (≥2 distinct families) |
| Spacing scale, density, motion tier | The one signature element |
| | Copy and wording |

**What step 2 overrode, and why** — recorded in full in
[`../../decisions/0017-ink-and-state-design-direction.md`](../../decisions/0017-ink-and-state-design-direction.md):

- Step 1 classified Ducker as an *API Developer Portal* → *FAQ/Documentation Landing*.
  Wrong: Ducker is a **registry of eight applications**, not an API reference.
- Step 1 proposed `#020617` ground + `#22C55E` accent. That is verbatim one of the
  clichés `frontend-design` names ("a near-black background with a single bright
  acid-green accent"). Rejected.
- Step 1 proposed **JetBrains Mono** for headings and **IBM Plex Sans** for body, both
  as web fonts. Rejected on a technical ground, not taste — see §2.
- Step 1's own component CSS contradicted its palette: `.card` background equal to the
  page background, and a `white` modal with a `#E2E8F0` input border inside a dark
  scheme. Discarded and rewritten.

Retained from step 1 unchanged: the spacing scale, the motion tier, the anti-pattern
list, and every a11y rule. `--tap` is therefore **44px**.

---

## 1. Colour — colour is reserved for meaning

**The rule that defines this system: the interface chrome has no accent hue.** Links,
buttons, focus, selection and the active navigation item are expressed with ink, weight,
underline and a filled block — never with a colour.

The five status values are the only things on the page that carry hue. If the chrome
also had a colour, status would stop reading as information and start reading as
decoration. This is also what keeps the palette clear of all three generated-design
tells at once: no cream-and-terracotta, no near-black-and-acid-green, no SaaS teal.

### Light — the base

| Token | Hex | Role | Contrast |
| --- | --- | --- | --- |
| `--paper` | `#F4F5F2` | page ground — cool grey-green, **not** cream `#F4F1EA` | — |
| `--card` | `#FFFFFF` | a record lifted off the sheet | — |
| `--rule` | `#D9DCD4` | hairline — the primary structural device | 1.27 : paper |
| `--rule-soft` | `#E8EAE5` | secondary hairline | 1.11 : paper |
| `--ink` | `#1B1D1A` | body and headings — near-black with a green cast, **not** `#111` | **15.51** : paper |
| `--ink-soft` | `#5C605A` | secondary line, slug, metadata | **5.86** : paper |
| `--stamp` | `#1B1D1A` | the filled block that stands in for an accent | 15.51 inverted |
| `--fill` | `#E4E6E0` | selected row, quiet | — |

### Dark — ink and paper swap; it is not a second palette

| Token | Hex | Contrast |
| --- | --- | --- |
| `--paper` | `#141613` | — |
| `--card` | `#1C1F1B` | — |
| `--rule` | `#30352E` | 1.45 : ground |
| `--rule-soft` | `#22261F` | 1.18 : ground |
| `--ink` | `#EDEFEA` | **15.72** : ground |
| `--ink-soft` | `#A0A59C` | **7.24** : ground |
| `--stamp` | `#EDEFEA` | 15.72 inverted |
| `--fill` | `#24281F` | — |

### The five status values

Semantics are conventional on purpose — green reads as connected, red as private, grey
as planned — because a registry is scanned, not studied. Each value has a text colour
and a chip background. Measured, not estimated:

| Status | Light fg | Light chip | fg/chip | fg/paper | Dark fg | Dark chip | fg/chip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `core` | `#5A2E8C` | `#EDE6F5` | **7.82** | 8.71 | `#C4A5E8` | `#241C2E` | **7.73** |
| `connected` | `#1F6144` | `#E2EFE7` | **6.22** | 6.73 | `#7ECBA1` | `#15261C` | **8.25** |
| `standalone` | `#7A5A0C` | `#F3EDDB` | **5.45** | 5.82 | `#D9B463` | `#2A2312` | **7.91** |
| `planned` | `#54584F` | `#E7E9E3` | **5.95** | 6.65 | `#A0A59C` | `#22251F` | **6.18** |
| `private` | `#8E2F2F` | `#F5E4E2` | **6.57** | 7.39 | `#E89189` | `#2D1917` | **7.00** |

Lowest ratio in the whole system is 5.45 — every value clears 4.5:1 in both modes.

**Non-text contrast (WCAG 1.4.11):** the status swatch is meaning, not decoration, so it
is drawn in the *foreground* colour against paper — 5.82 to 8.71, all past 3:1.
`--rule` at 1.27 is far below 3:1 and may therefore **never** be the only boundary of an
interactive control; controls take `--ink-soft` (5.86).

---

## 2. Typography — the expected pairing, inverted

**No web fonts.** This is a technical constraint carried over deliberately, not
inherited by accident: every font with complete Vietnamese diacritic coverage is heavy,
and Georgia — the obvious serif default — has **no precomposed Vietnamese glyphs**, so
`ế` renders as `ê` with a stray floating acute on Windows. Georgia is banned from every
stack. Step 1's JetBrains Mono heading font also collides with §5: mono is reserved.

Two clearly distinct families, in the **reverse** of the usual arrangement:

| Role | Stack | Reasoning |
| --- | --- | --- |
| **Headings** | `--sans`, tight, heavy, `letter-spacing: -0.015em` | A heading here is a catalogue entry, not a headline. Sans set tight reads as a label. |
| **Body** | `--serif`, 16px / 1.75 / 66ch | The site is long Vietnamese prose. Serif body is easier over a long read and rare enough on the web to carry the personality alone. |
| **Slug and code only** | `--mono` | See §5. Never for small labels — that is template chrome. |

```css
--sans:  "Segoe UI Variable Text", "Segoe UI", -apple-system, BlinkMacSystemFont,
         "Helvetica Neue", Arial, sans-serif;
/* Georgia is banned — no precomposed Vietnamese glyphs. */
--serif: Constantia, "Sitka Text", "New York", "Iowan Old Style", Charter, Cambria,
         "Times New Roman", serif;
--mono:  "Cascadia Mono", "Cascadia Code", ui-monospace, "SF Mono", Menlo, Consolas,
         "Liberation Mono", monospace;
```

### Scale — do not insert a size outside it

| Token | px | Use |
| --- | --- | --- |
| `--t-2xs` | 12 | mono slug, chip |
| `--t-xs` | 13 | footnote |
| `--t-sm` | 14 | nav, button, input |
| `--t-md` | 16 | **body** |
| `--t-lg` | 18 | one-line description |
| `--t-xl` | 22 | H3 |
| `--t-2xl` | 28 | H2 |
| `--t-3xl` | 38 | H1 |
| `--t-4xl` | 48 | registry hero |

`--lh-body: 1.75` · `--lh-head: 1.2` · `--measure: 66ch`

The 1.75 is not preference. Stacked Vietnamese diacritics (ế ữ ộ ằ ể) touch the line
above at tighter leading. The measure stays at 66 rather than the 75 a serif would
normally allow, for the same reason — Vietnamese sets denser.

---

## 3. Spacing, motion, elevation

Spacing is step 1's scale, unchanged: `--space-xs` 4 · `sm` 8 · `md` 16 · `lg` 24 ·
`xl` 32 · `2xl` 48 · `3xl` 64.

`--tap: 44px` — minimum hit area on **every** clickable element.

**Motion is one moment, not a texture.** The registry rows reveal in sequence on page
load. That is the only non-user-triggered motion on the site. Everything else answers an
action: opening, expanding, confirming. Transitions 150–300ms. `prefers-reduced-motion`
removes the reveal entirely — it does not shorten it.

**Elevation is hairlines, not shadows.** Cards are bounded by `--rule`. Shadow exists
only for things that genuinely float above the page:

```css
--shadow-overlay: 0 10px 15px rgba(0,0,0,.10);   /* dropdown, popover */
--shadow-modal:   0 20px 25px rgba(0,0,0,.15);   /* modal only       */
```

There is no `--shadow-sm` and no card shadow. An identical soft grey shadow under every
card is the SaaS-kit tell.

---

## 4. The signature element — the registry row

One memorable thing; everything around it stays quiet.

Each application is **one hairline-ruled row**, left-aligned, opened by a solid status
swatch, with the IdP relationship drawn as a branch inside the list. The branch is not
ornament: it is the only place the ecosystem's actual structure is visible.

```
Tám ứng dụng. Ba trong số đó đăng nhập qua Ducker ID.      ← serif, one sentence

■ Ducker ID          web-app-ducker-id          core
├─ Match CV          web-app-match-cv           connected
├─ Shorten Link      web-app-shorten-link       connected
└─ …
■ Manage Gym         web-app-manage-gym         standalone
■ Ducker Flow Grid   web-app-AI-workflow-…      planned
```

There is **no hero slab**. The most characteristic thing in Ducker's world is the
catalogue, so the catalogue is what appears first. The page pattern step 1 proposed —
*hero with search bar → popular categories → FAQ accordion → contact CTA* — belongs to a
support site and is not used.

Section order: **registry → documentation → about**. Search is a control in the header,
not a hero feature.

---

## 5. Application naming — not negotiable

Display names are **capitalised, space-separated**. A slug is never a display name.

| Slug | Display name |
| --- | --- |
| `web-app-ducker-id` | Ducker ID |
| `web-app-match-cv` | Match CV |
| `web-app-manage-gym` | Manage Gym |
| `web-app-AI-study-coach` | AI Study Coach |
| `web-app-AI-workflow-automation-platform` | Ducker Flow Grid |
| `web-app-calculate-badminton` | Calculate Badminton |
| `web-app-shorten-link` | Shorten Link |
| `web-app-ducker` | Ducker |

Drop the infrastructure prefix (`web-app-`, `app-`) — it describes the repository, not
the product. Initialisms stay upper-case: **API, AI, CV, OAuth, IdP**.

The slug is still shown, always in a **secondary** role: mono, `--t-2xs`, `--ink-soft`,
beside or beneath the display name. In the database `App.slug` is the slug and
`AppTranslation.name` is the display name. Never fall back to the slug when a
translation is missing — use the locale fallback chain.

---

## 6. Component specs

```css
/* Primary action — a filled ink block, not a coloured button. */
.btn-primary {
  min-height: var(--tap);
  padding: 0 var(--space-lg);
  background: var(--stamp);
  color: var(--paper);
  border: 1px solid var(--stamp);
  border-radius: 2px;
  font-family: var(--sans);
  font-size: var(--t-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background 200ms ease, color 200ms ease;
}
.btn-primary:hover { background: transparent; color: var(--ink); }

/* Secondary — outlined in ink-soft, never in --rule (1.27 fails 1.4.11). */
.btn-secondary {
  min-height: var(--tap);
  padding: 0 var(--space-lg);
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--ink-soft);
  border-radius: 2px;
  cursor: pointer;
  transition: background 200ms ease;
}
.btn-secondary:hover { background: var(--fill); }

/* Registry row — the signature. Ruled, not carded. */
.row {
  display: grid;
  grid-template-columns: 12px 1fr auto auto;
  gap: var(--space-md);
  align-items: center;
  min-height: var(--tap);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--rule);
}
.row:hover { background: var(--fill); }
.row__swatch { width: 10px; height: 10px; background: var(--status-fg); }
.row__slug   { font-family: var(--mono); font-size: var(--t-2xs); color: var(--ink-soft); }

.input {
  min-height: var(--tap);
  padding: 0 var(--space-md);
  background: var(--card);
  border: 1px solid var(--ink-soft);
  border-radius: 2px;
  font-family: var(--sans);
  font-size: var(--t-md);          /* 16px — never smaller, iOS zooms below it */
  transition: border-color 200ms ease;
}

/* One focus treatment everywhere. Ink, never a hue. */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.modal {
  background: var(--card);
  color: var(--ink);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: var(--space-xl);
  box-shadow: var(--shadow-modal);
  max-width: 520px;
  width: min(90vw, 520px);
}
```

Border radius is a two-value system on purpose: `2px` for controls, `4px` for overlays.
One radius applied to everything regardless of hierarchy is a tell.

---

## 7. Anti-patterns

From step 1 — retained:

- Buried entries · broken version switching · missing empty/limit state
- Emojis as icons — use SVG (Heroicons / Lucide)
- Missing `cursor: pointer` on clickable elements
- Layout-shifting hover transforms
- Text below 4.5:1
- Instant state changes with no transition
- Invisible focus states

Added by this direction:

- **An accent hue anywhere in the chrome.** Colour belongs to status only.
- A `translateY` card-lift on hover. Rows highlight with `--fill`; they do not rise.
- Cream `#F4F1EA` grounds, terracotta near `#D97757`, acid green — the generated-design
  palette tells.
- An all-caps tracked eyebrow above a heading.
- Metadata joined with middle dots.
- An arrow glyph appended to link or button text.
- Mono type for small labels. Mono means *slug or code*, nothing else.
- Numbered markers (`01 / 02 / 03`) unless the content is genuinely a sequence.
- Accenting one word inside a heading with colour, italic or weight.

---

## 8. Pre-delivery checklist

- [ ] No emoji used as an icon; icons from one set
- [ ] `cursor: pointer` on every clickable element
- [ ] Hover transitions 150–300ms
- [ ] Text contrast ≥ 4.5:1 in **both** themes
- [ ] Non-text meaning (swatches, control borders) ≥ 3:1 — `--rule` alone never qualifies
- [ ] Focus visible on every interactive element, ink outline, 2px offset
- [ ] `prefers-reduced-motion` removes the registry reveal
- [ ] Every hit area ≥ 44px
- [ ] Responsive at 375 / 768 / 1024 / 1440
- [ ] No content behind a fixed header; no horizontal scroll at 375px
- [ ] Display names capitalised; slug mono and secondary (§5)
- [ ] No accent hue introduced into the chrome (§1)
