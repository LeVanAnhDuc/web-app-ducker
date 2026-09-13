# Replace the hand-rolled theme machinery with next-themes

> **Related:** FR-15 · I16 · NFR-A11Y-01 · NFR-A11Y-07 · NFR-SEC-05 · ADR-0020

## 1. What exists today

Three pieces, roughly 40 lines of real logic:

| File | Role |
| --- | --- |
| `src/components/ui/ThemeScript.tsx` | synchronous anti-flash script, first element in `<body>` of both root layouts; owns `THEME_STORAGE_KEY = "ducker-theme"` |
| `src/components/ui/ThemeToggle.tsx` | three buttons; `useLayoutEffect` re-applies the attribute after hydration |
| `src/styles/tokens.css` | `:root` (light) · `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` · `:root[data-theme="dark"]` |

The architecture rests on one idea: **"follow system" means the attribute is absent**,
so the `@media` block decides. This satisfies I16 and costs no JavaScript.

## 2. Why change

Two gaps, both verified in this codebase, not assumed:

- **No `color-scheme` anywhere.** `grep -rn "color-scheme" src/styles/` returns only
  `prefers-color-scheme`. Scrollbars, `<select>`, date pickers and Chrome autofill stay
  light while the site is dark. This is a visible defect against NFR-A11Y-01.
- **No cross-tab synchronisation.** Change the theme in one tab; a second tab keeps the
  old one until it reloads.

A third, smaller reason: `ThemeToggle.tsx` carries a hand-written patch for React
stripping the script-set attribute during hydration. It works, but it is our bug to keep
working.

## 3. What next-themes actually does

Read from the published source and README of `next-themes@0.4.6`, not from memory.

| Question | Answer |
| --- | --- |
| Default `attribute` | `'data-theme'` — **identical to our selectors**, so no CSS rename |
| System mode | writes the **resolved** value: `const name = value ? value[resolved] : resolved` then `d.setAttribute(attr, name)`. Never absent while JS runs |
| Three states | `theme` returns `"system"`, `resolvedTheme` returns `"dark"`/`"light"`, `systemTheme` reports the OS regardless — I16 holds |
| Cross-tab | a `storage` listener keyed on `storageKey`; a removed key falls back to `defaultTheme` |
| `color-scheme` | `enableColorScheme` defaults `true` and sets `d.style.colorScheme` to the resolved theme |
| React 19 | peer range `^16.8 \|\| ^17 \|\| ^18 \|\| ^19`; no `next` peer, so Next 16 is unconstrained |

## 4. The design

`ThemeProvider` in both root layouts, inside `<body>`, wrapping everything:

```tsx
<ThemeProvider
  attribute="data-theme"
  storageKey="ducker-theme"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
```

- `storageKey` keeps our existing key so no stored preference is lost.
- `enableColorScheme` is left at its default `true` — this is what closes gap one.
- `disableTransitionOnChange` stops any colour transition from animating mid-switch.

`ThemeScript.tsx` is **deleted**; next-themes injects its own pre-paint script and the
`suppressHydrationWarning` already on both `<html>` elements keeps serving the same
purpose. `ThemeToggle` keeps its markup, its SVG icons, its `role="group"` and its
`aria-pressed` semantics unchanged — only the state plumbing is swapped for `useTheme()`.

### No CSS is touched

`src/styles/tokens.css` is being rewritten in parallel by the design-system migration
(§9). Adding three `color-scheme` declarations to a file about to be replaced would buy
a guaranteed conflict for marginal value, because `enableColorScheme` already sets the
property at runtime. The CSS-level fallback is handed to that migration instead.

## 5. The one behaviour change

In system mode the attribute is now always present and resolved. The rendered result is
the same in every case:

| State | Today | After | Tokens that apply |
| --- | --- | --- | --- |
| system, OS light | no attribute | `data-theme="light"` | `:root` |
| system, OS dark | no attribute | `data-theme="dark"` | `:root[data-theme="dark"]` |
| explicit light | `data-theme="light"` | `data-theme="light"` | `:root` |
| explicit dark | `data-theme="dark"` | `data-theme="dark"` | `:root[data-theme="dark"]` |

The `@media` block is **kept**: with JavaScript disabled no attribute is written and it
remains the only thing that honours the OS. `tokens.test.ts` asserts both selectors and
needs no change.

## 6. Stored preference migrates itself

| Existing user | `localStorage` | next-themes reads | Result |
| --- | --- | --- | --- |
| never chose, or chose system | key absent | `null` → `defaultTheme` | system ✓ |
| chose dark | `"dark"` | `"dark"` | dark ✓ |
| chose light | `"light"` | `"light"` | light ✓ |

No migration script. The only shape change is that choosing "system" from now on writes
the literal `"system"` instead of removing the key, which the table above already covers.

## 7. Testing

- **`ThemeToggle.test.tsx`** — rewritten against `ThemeProvider`. Assertions stay
  behavioural: three buttons exist, the active one carries `aria-pressed="true"`,
  clicking each one switches. `fireEvent`, never `userEvent.type` (trap 3).
- **`e2e/theme.spec.ts`** — new. Covers NFR-A11Y-07 by the agreed method: throttle the
  CPU through CDP, load each of the three states, capture the first frame and compare the
  background colour against the settled colour. Also asserts the choice survives a reload
  and propagates to a second tab.
- **`tokens.test.ts`**, **`markdown.test.ts`** — untouched; both bind to selectors this
  change preserves.
- `pnpm typecheck` and `pnpm build` run separately — vitest does not typecheck (trap 2).
- `pnpm audit` for NFR-SEC-05, since this adds a dependency.

## 8. Files touched

```
package.json                                   + next-themes
src/components/ui/ThemeScript.tsx              deleted
src/components/ui/ThemeToggle.tsx              state logic only; markup unchanged
src/components/ui/index.ts                     drop the ThemeScript exports
src/app/[locale]/(public)/layout.tsx           ThemeProvider
src/app/[locale]/(admin)/admin/layout.tsx      ThemeProvider
src/components/ui/ThemeToggle.test.tsx         rewritten
e2e/theme.spec.ts                              new
docs/decisions/0020-next-themes-for-the-theme.md  new
docs/02-requirements/scope.md                  extend FR-15
docs/04-state/backlog.md                       §In progress, and the Phase B hand-off
README.md                                      one bullet under ## Features
.gitignore                                     add .worktrees/ — currently untracked
```

## 9. Out of scope

- **The design-system token migration.** `MASTER.md` abolishes the accent hue that 79
  call sites across 29 files rely on, 49 of them chrome. That is a visual redesign with
  its own mockup gate, and another session owns it.
- **A CSS-level `color-scheme` fallback for no-JS visitors.** Handed to that migration,
  which is rewriting the file it belongs in.

## 10. Risks

| Risk | Handling |
| --- | --- |
| `tokens.css` rewritten underneath us mid-branch | this change touches no CSS at all |
| next-themes' script lands later in `<body>` than ours did | it is still synchronous and pre-paint; the e2e flash test is what decides, not reasoning |
| A dependency for ~40 lines of our own code | recorded in ADR-0020 §3 as the deliberate trade |
