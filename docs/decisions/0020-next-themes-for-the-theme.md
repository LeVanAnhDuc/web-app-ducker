# ADR-0020 · next-themes owns the three-state theme

> **Date:** 2026-09-13
> **Status:** accepted
> **Related:** FR-15 · I16 · NFR-A11Y-01 · NFR-A11Y-07 · NFR-SEC-05

## 1. Context

The hand-rolled machinery — `ThemeScript.tsx`, a layout effect in `ThemeToggle`, three
blocks in `tokens.css` — worked, and its "follow system means the attribute is absent"
design was deliberate. Two gaps were found in it, both measured rather than assumed:

- **Nothing under `src/styles/` sets `color-scheme`.** Scrollbars, `<select>`, date
  pickers and Chrome's autofill stay light on a dark page. That is a defect against
  NFR-A11Y-01, not a cosmetic preference.
- **A theme change never reaches a second tab.** There is no `storage` listener.

Separately, `ThemeToggle` carried a hand-written patch for React stripping the
script-set attribute during hydration.

## 2. Decision

Use `next-themes`, configured once in `src/components/ui/ThemeProvider.tsx` and mounted
in both root layouts: `attribute="data-theme"`, `storageKey="ducker-theme"`,
`defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`. `enableColorScheme`
stays at its default `true`. `ThemeScript.tsx` is deleted.

The library's default attribute is already `data-theme`, so **no CSS moved** — neither
`tokens.css` nor the Shiki selectors in `src/lib/markdown.ts`.

## 3. Rejected alternatives

| Alternative | Why rejected |
| --- | --- |
| Keep the hand-rolled version and add both features by hand | About eleven lines, so the code cost is not the argument. The anti-flash script and the hydration edge case stay ours to keep working, and that is the part that was already subtly wrong once |
| Add a CSS `color-scheme` only, and skip cross-tab | Leaves the tab gap open, and edits the one file the design-system token rewrite is replacing in a parallel branch — a guaranteed conflict for three lines |
| Keep the absent-attribute design by disabling `enableSystem` | Loses `systemTheme` and the media-query listener, which is the whole reason to use the library. Would also break I16's third state |

The published 0.4.6 source was read before deciding, because the decision turns on what
the library writes to the DOM in system mode.

## 4. Consequences

**Gained:**
- Both gaps close through default configuration, with no code of ours.
- The hydration patch becomes upstream's problem.
- Proven, not asserted: the e2e suite measures the absence of a colour flash with the
  CPU throttled 20×, and asserts the cross-tab and `color-scheme` behaviour.

**Lost / accepted:**
- One dependency, roughly 3 KB.
- **In system mode the attribute is now resolved rather than absent.** The rendered
  result is identical in all four cases, but `@media (prefers-color-scheme: dark)` in
  `tokens.css` is no longer what serves system-mode visitors — it is now only the
  no-JavaScript path. It must not be deleted for that reason.
- Choosing "follow system" stores the literal string `"system"` instead of removing the
  key. Existing stored values still migrate without a script.
- Visitors with JavaScript disabled get no `color-scheme`, since the library sets it at
  runtime. Handed to the token rewrite, which owns the file it belongs in.

**Revisit when:** the design-system migration rewrites `tokens.css` and can add the
CSS-level `color-scheme` fallback to each theme block.
