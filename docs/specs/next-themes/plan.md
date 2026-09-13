# next-themes Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-rolled theme machinery with `next-themes`, closing two verified gaps — no `color-scheme` anywhere, and no cross-tab synchronisation — without touching a single line of CSS.

**Architecture:** A configured `ThemeProvider` wrapper lives in `src/components/ui/`, both root layouts mount it inside `<body>`, and `ThemeToggle` keeps its markup while its state plumbing moves to `useTheme()`. `ThemeScript.tsx` is deleted; the storage key moves to a plain module so it stays importable from a server component.

**Tech Stack:** Next 16 App Router · React 19 · `next-themes@^0.4.6` · vitest + jsdom + Testing Library · Playwright

**Spec:** [`design.md`](./design.md)

## Global Constraints

- Package manager is **pnpm 10** (`packageManager` is pinned). Never `npm` or `yarn`.
- All new code, comments, test names and commit subjects are **English** (root `CLAUDE.md` §Language). The existing Vietnamese test names in `ThemeToggle.test.tsx` are replaced, not preserved.
- `attribute="data-theme"` · `storageKey="ducker-theme"` · `defaultTheme="system"` · `enableSystem` · `disableTransitionOnChange`. `enableColorScheme` stays at its default `true`.
- **No file under `src/styles/` may be modified.** The design-system migration owns that directory in a parallel branch.
- Three theme states, never two (I16).
- Component tests use `fireEvent`, never `userEvent.type` (root `CLAUDE.md` trap 3).
- `vitest` does not typecheck. `pnpm typecheck` and `pnpm build` are separate gates (trap 2).
- `pnpm test:run` uses `--maxWorkers=1`; parallel runs are flaky on this machine.
- `pnpm e2e` needs `pnpm build` first — Playwright runs `pnpm start` on port 3210 and never reuses an existing server.

---

### Task 1: Dependency, storage-key module, and the jsdom `matchMedia` stub

The worktree has no `node_modules`. `next-themes` calls `window.matchMedia` on mount and jsdom does not implement it, so every component test in Task 3 would throw before asserting anything.

**Files:**
- Create: `src/components/ui/theme-config.ts`
- Create: `src/components/ui/theme-config.test.ts`
- Modify: `vitest.setup.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `THEME_STORAGE_KEY: "ducker-theme"` from `@/components/ui/theme-config`.

- [ ] **Step 1: Install dependencies into the worktree**

```bash
pnpm install --frozen-lockfile
pnpm add next-themes
```

- [ ] **Step 2: Write the failing test**

`src/components/ui/theme-config.test.ts`:

```ts
import { describe, it, expect } from "vitest";

import { THEME_STORAGE_KEY } from "./theme-config";

describe("theme-config", () => {
  // Changing this string silently signs every existing visitor out of their
  // theme choice. See docs/specs/next-themes/design.md section 6.
  it("keeps the storage key the hand-rolled implementation used", () => {
    expect(THEME_STORAGE_KEY).toBe("ducker-theme");
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `pnpm exec vitest run src/components/ui/theme-config.test.ts`
Expected: FAIL — cannot resolve `./theme-config`.

- [ ] **Step 4: Create the module**

`src/components/ui/theme-config.ts`:

```ts
/**
 * The `localStorage` key holding the theme choice.
 *
 * Carried over verbatim from the deleted `ThemeScript.tsx` so that no visitor
 * loses a stored preference: next-themes reads this key, and the three
 * existing value shapes all migrate without a script.
 *
 * This file deliberately has no `"use client"`. Everything exported from a
 * client module becomes a client reference rather than a real string, and the
 * root layouts are server components.
 */
export const THEME_STORAGE_KEY = "ducker-theme";
```

- [ ] **Step 5: Add the `matchMedia` stub**

Append to `vitest.setup.ts`:

```ts
// jsdom does not implement `window.matchMedia`, and next-themes calls it the
// moment its provider mounts. Without this stub every theme component test
// dies on "matchMedia is not a function" before reaching an assertion.
// `matches: false` means "the OS is in light mode" — tests that care about the
// dark branch set the stored choice explicitly instead of emulating the OS.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
```

- [ ] **Step 6: Run the new test and the whole suite**

```bash
pnpm exec vitest run src/components/ui/theme-config.test.ts
pnpm test:run
```

Expected: the new test passes and nothing regresses.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.setup.ts src/components/ui/theme-config.ts src/components/ui/theme-config.test.ts
git commit -m "feat(theme): add next-themes and pin the storage key in its own module"
```

---

### Task 2: The configured `ThemeProvider`

Both root layouts need the identical configuration. Putting it in one component keeps the five props from drifting apart.

**Files:**
- Create: `src/components/ui/ThemeProvider.tsx`
- Create: `src/components/ui/ThemeProvider.test.tsx`

**Interfaces:**
- Consumes: `THEME_STORAGE_KEY` from Task 1.
- Produces: `ThemeProvider({ children }: { children: ReactNode })` from `@/components/ui/ThemeProvider`.

- [ ] **Step 1: Write the failing test**

`src/components/ui/ThemeProvider.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { ThemeProvider } from "./ThemeProvider";
import { THEME_STORAGE_KEY } from "./theme-config";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
});

describe("ThemeProvider", () => {
  it("renders its children", () => {
    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("applies a stored choice to data-theme, the attribute tokens.css binds to", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  // This is the gap the whole migration exists to close: without it the
  // scrollbars and native controls stay light on a dark page.
  it("sets color-scheme so native browser UI follows the theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/components/ui/ThemeProvider.test.tsx`
Expected: FAIL — cannot resolve `./ThemeProvider`.

- [ ] **Step 3: Write the component**

`src/components/ui/ThemeProvider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { THEME_STORAGE_KEY } from "./theme-config";

/**
 * The theme provider, configured once for both root layouts.
 *
 * `attribute="data-theme"` is next-themes' own default and happens to be
 * exactly what `tokens.css` binds to, which is why this migration moves no CSS.
 *
 * In system mode next-themes writes the resolved value rather than leaving the
 * attribute absent, so `:root[data-theme="dark"]` is what matches. The
 * `@media (prefers-color-scheme: dark)` block in `tokens.css` is still the
 * thing that honours the OS when JavaScript is disabled — do not delete it.
 *
 * `enableColorScheme` is left at its default `true`: it sets
 * `documentElement.style.colorScheme`, which is what themes scrollbars,
 * `<select>` and autofill.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      storageKey={THEME_STORAGE_KEY}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `pnpm exec vitest run src/components/ui/ThemeProvider.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ThemeProvider.tsx src/components/ui/ThemeProvider.test.tsx
git commit -m "feat(theme): add a ThemeProvider that carries the configuration once"
```

---

### Task 3: `ThemeToggle` on `useTheme()`

The markup, the SVG icons, the `role="group"` and the `aria-pressed` semantics do not change. Only the state plumbing does.

**Files:**
- Modify: `src/components/ui/ThemeToggle.tsx`
- Modify: `src/components/ui/ThemeToggle.test.tsx` (rewritten)

**Interfaces:**
- Consumes: `ThemeProvider` from Task 2.
- Produces: `ThemeToggle` keeps its existing exported types — `ThemeToggleProps`, `ThemeToggleLabels`, `ThemeChoice = "system" | "light" | "dark"`. `TopBar` and `AdminShell` call it unchanged.

- [ ] **Step 1: Rewrite the test file**

Replace the whole of `src/components/ui/ThemeToggle.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import type { ReactElement } from "react";

import { ThemeToggle } from "./ThemeToggle";
import { ThemeProvider } from "./ThemeProvider";
import { THEME_STORAGE_KEY } from "./theme-config";

const labels = {
  group: "Theme",
  system: "Follow system",
  light: "Light",
  dark: "Dark",
};

// The toggle reads its state from the provider, so every test mounts both.
function renderToggle(ui: ReactElement = <ThemeToggle labels={labels} />) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
});

describe("ThemeToggle", () => {
  it("offers three states, not two — losing 'follow system' loses the way back", () => {
    renderToggle();
    expect(screen.getAllByRole("button")).toHaveLength(3);
    for (const name of [labels.system, labels.light, labels.dark]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("starts on 'follow system' when nothing was ever chosen", () => {
    renderToggle();
    expect(screen.getByRole("button", { name: labels.system })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it('choosing dark sets data-theme="dark", the third block of tokens.css', () => {
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: labels.dark }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: labels.dark })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it('choosing light sets data-theme="light" so the @media block stops matching', () => {
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: labels.light }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("a manual choice is persisted under the key the old implementation used", () => {
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: labels.dark }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("returning to 'follow system' stores the literal system, and presses that button", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderToggle();
    fireEvent.click(screen.getByRole("button", { name: labels.system }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(screen.getByRole("button", { name: labels.system })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("restores a stored choice on mount", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    renderToggle();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(screen.getByRole("button", { name: labels.light })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("a junk stored value does not produce a junk theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon");
    renderToggle();
    expect(screen.getByRole("button", { name: labels.system })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("all three are real keyboard-usable buttons", () => {
    renderToggle();
    for (const button of screen.getAllByRole("button")) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
    }
  });

  it("labels the group for screen readers", () => {
    renderToggle();
    expect(screen.getByRole("group", { name: labels.group })).toBeInTheDocument();
  });

  it("uses drawn SVG symbols, not emoji, and no literal colours", () => {
    const { container } = renderToggle();
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{6}/i);
    expect(container.innerHTML).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/components/ui/ThemeToggle.test.tsx`
Expected: FAIL — the old component removes the key on "system" instead of storing the literal string.

- [ ] **Step 3: Replace the state plumbing**

In `src/components/ui/ThemeToggle.tsx`, delete `readChoice`, `applyChoice`, `useIsomorphicLayoutEffect`, `pick` and the `THEME_STORAGE_KEY` import. `ICONS`, `CHOICES`, the exported types and the returned JSX stay exactly as they are — only `choice` and the `onClick` change.

New imports:

```tsx
"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useTheme } from "next-themes";

import styles from "./ThemeToggle.module.css";
```

New component body:

```tsx
export function ThemeToggle({ labels }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  // The server cannot read `localStorage`, and next-themes seeds its state from
  // it on the client's very first render — so reading `theme` during hydration
  // is a mismatch. Rendering "system" until mounted reproduces exactly what the
  // hand-rolled version did, and the effect then swaps in the real choice.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const choice: ThemeChoice =
    mounted && (theme === "dark" || theme === "light") ? theme : "system";

  return (
    <div className={styles.group} role="group" aria-label={labels.group}>
      {CHOICES.map((value) => (
        <button
          key={value}
          type="button"
          className={styles.button}
          // `aria-pressed`, not `aria-current`: three mutually exclusive
          // toggles, not three navigation links.
          aria-pressed={choice === value}
          aria-label={labels[value]}
          title={labels[value]}
          onClick={() => setTheme(value)}
        >
          <svg
            className={styles.icon}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            {ICONS[value]}
          </svg>
        </button>
      ))}
    </div>
  );
}
```

Also rewrite the component's doc comment. It currently describes pairing with `ThemeScript` and re-applying the attribute in a layout effect; neither is true any more.

- [ ] **Step 4: Run the test**

Run: `pnpm exec vitest run src/components/ui/ThemeToggle.test.tsx`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ThemeToggle.tsx src/components/ui/ThemeToggle.test.tsx
git commit -m "refactor(theme): drive ThemeToggle from useTheme, leaving its markup alone"
```

---

### Task 4: Wire both layouts and delete `ThemeScript`

**Files:**
- Modify: `src/app/[locale]/(public)/layout.tsx`
- Modify: `src/app/[locale]/(admin)/admin/layout.tsx`
- Modify: `src/components/ui/index.ts`
- Delete: `src/components/ui/ThemeScript.tsx`
- Create: `src/components/ui/theme-wiring.test.ts`

**Interfaces:**
- Consumes: `ThemeProvider` from Task 2.
- Produces: nothing importable; this is the wiring.

- [ ] **Step 1: Write the failing test**

The codebase already guards structure by scanning source — `src/server/auth/boundary.test.ts` does it for the three doors. Same technique here, because nothing else catches a layout that forgot the provider.

`src/components/ui/theme-wiring.test.ts`:

```ts
import { readFileSync, existsSync } from "node:fs";
import { describe, it, expect } from "vitest";

const LAYOUTS = [
  "src/app/[locale]/(public)/layout.tsx",
  "src/app/[locale]/(admin)/admin/layout.tsx",
];

describe("theme wiring", () => {
  // A root layout without the provider renders an unthemed document, and no
  // test that only mounts components would ever notice.
  it.each(LAYOUTS)("%s mounts ThemeProvider", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source).toContain("<ThemeProvider>");
  });

  it.each(LAYOUTS)("%s keeps suppressHydrationWarning on <html>", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source).toMatch(/<html[^>]*suppressHydrationWarning/);
  });

  it("the hand-rolled anti-flash script is gone", () => {
    expect(existsSync("src/components/ui/ThemeScript.tsx")).toBe(false);
  });

  it("nothing still exports it", () => {
    const index = readFileSync("src/components/ui/index.ts", "utf8");
    expect(index).not.toContain("ThemeScript");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/components/ui/theme-wiring.test.ts`
Expected: FAIL on all four — the layouts still render `<ThemeScript />` and the file still exists.

- [ ] **Step 3: Rewire both layouts**

In each layout, drop the `ThemeScript` import, import `ThemeProvider` from `@/components/ui/ThemeProvider`, and wrap the body content:

```tsx
      <body>
        <ThemeProvider>
          <NextIntlClientProvider>
            {/* existing children, unchanged */}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
```

Replace each layout's `ThemeScript` comment with one stating the new arrangement: next-themes injects its own synchronous pre-paint script, and `suppressHydrationWarning` on `<html>` is still required because that script sets `data-theme` before React hydrates.

- [ ] **Step 4: Delete the file and fix the barrel**

```bash
git rm src/components/ui/ThemeScript.tsx
```

In `src/components/ui/index.ts`, remove the `ThemeScript` export line and add the two new modules:

```ts
export { ThemeProvider } from "./ThemeProvider";
export { THEME_STORAGE_KEY } from "./theme-config";
```

- [ ] **Step 5: Run the tests, then the gates vitest cannot cover**

```bash
pnpm test:run
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all green. `pnpm build` matters most — it is the only thing that proves both root layouts still compile as server components.

- [ ] **Step 6: Commit**

```bash
git add -A src/app src/components/ui
git commit -m "feat(theme): mount ThemeProvider in both root layouts and drop ThemeScript"
```

---

### Task 5: End-to-end coverage for flash, persistence and cross-tab

**Files:**
- Create: `e2e/theme.spec.ts`

**Interfaces:**
- Consumes: the running app.
- Produces: nothing importable.

- [ ] **Step 1: Read the real dark background out of the tokens**

```bash
grep -A4 ':root\[data-theme="dark"\]' src/styles/tokens.css
```

Convert the `--bg` hex to the `rgb(r, g, b)` form Chromium reports and use it as `DARK_BG` below. Do not guess — a wrong constant makes the flash test fail for the wrong reason.

- [ ] **Step 2: Write the spec**

`e2e/theme.spec.ts`:

```ts
// e2e/theme.spec.ts
//
// Three things only a real browser can answer, each a regression that would
// otherwise ship silently:
//
//   1. NFR-A11Y-07 — no colour flash. The theme script must land before the
//      first paint. Measured with the CPU throttled 20x, because at full speed
//      even a late script usually wins the race.
//   2. The choice survives a reload.
//   3. The choice reaches a second tab — the gap that motivated the migration.
import { test, expect, type Page } from "@playwright/test";

const STORAGE_KEY = "ducker-theme";

/** The dark ground from tokens.css :root[data-theme="dark"]. */
const DARK_BG = "rgb(20, 20, 18)";

async function throttle(page: Page, rate: number) {
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate });
}

/** Matches the dark button in either locale. */
const DARK_BUTTON = /tối|dark/i;

test("no colour flash: the first painted frame is already dark", async ({ page }) => {
  await page.addInitScript(
    ([key]) => {
      localStorage.setItem(key, "dark");
      // Runs before any of the page's own script. The first animation frame is
      // the earliest moment the document can have been painted.
      (window as unknown as Record<string, unknown>).__firstFrame = null;
      requestAnimationFrame(() => {
        (window as unknown as Record<string, unknown>).__firstFrame = {
          attr: document.documentElement.getAttribute("data-theme"),
          bg: getComputedStyle(document.body).backgroundColor,
        };
      });
    },
    [STORAGE_KEY],
  );
  await throttle(page, 20);

  const response = await page.goto("/vi");
  // Anti-self-deception: a 404 would satisfy every assertion below.
  expect(response?.status(), "/vi must answer 200").toBe(200);

  const first = await page.evaluate(
    () =>
      (window as unknown as { __firstFrame: { attr: string; bg: string } | null })
        .__firstFrame,
  );
  expect(first, "the first frame was never recorded").not.toBeNull();
  expect(first!.attr).toBe("dark");
  expect(first!.bg).toBe(DARK_BG);
});

test("the choice survives a reload", async ({ page }) => {
  const response = await page.goto("/vi");
  expect(response?.status(), "/vi must answer 200").toBe(200);

  await page.getByRole("button", { name: DARK_BUTTON }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe("dark");
});

test("color-scheme follows the theme so native controls are themed too", async ({ page }) => {
  const response = await page.goto("/vi");
  expect(response?.status(), "/vi must answer 200").toBe(200);

  await page.getByRole("button", { name: DARK_BUTTON }).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.style.colorScheme))
    .toBe("dark");
});

test("a change in one tab reaches another", async ({ context }) => {
  const first = await context.newPage();
  const second = await context.newPage();
  expect((await first.goto("/vi"))?.status()).toBe(200);
  expect((await second.goto("/vi"))?.status()).toBe(200);

  await first.getByRole("button", { name: DARK_BUTTON }).click();

  // The storage event only fires in *other* documents of the same origin,
  // which is precisely the case this migration added.
  await expect(second.locator("html")).toHaveAttribute("data-theme", "dark", {
    timeout: 5_000,
  });
});
```

- [ ] **Step 3: Build, then run just this spec**

```bash
pnpm build
pnpm e2e e2e/theme.spec.ts
```

Expected: 4 passing. If the cross-tab test is flaky, raise its timeout rather than deleting it — the behaviour is the point of the migration.

- [ ] **Step 4: Run the whole e2e suite for regressions**

Run: `pnpm e2e`
Expected: the pre-existing passes and skips, plus the 4 new ones.

- [ ] **Step 5: Commit**

```bash
git add e2e/theme.spec.ts
git commit -m "test(theme): cover flash, persistence, color-scheme and cross-tab sync"
```

---

### Task 6: Documentation

**Files:**
- Create: `docs/decisions/0018-next-themes-for-the-theme.md`
- Modify: `docs/02-requirements/scope.md`
- Modify: `docs/04-state/backlog.md`
- Modify: `README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Write ADR-0018**

Follow `docs/decisions/_template.md`, in English like ADR-0008, 15–40 lines. Contents:

- **Context:** the two verified gaps — nothing under `src/styles/` sets `color-scheme`, and a theme change never reaches a second tab.
- **Decision:** `next-themes` with the five configured props; `ThemeScript.tsx` deleted.
- **Rejected alternatives:** (a) keep the hand-rolled version and add both features by hand — roughly eleven lines, but the anti-flash and hydration edge cases stay ours to maintain; (b) add only a CSS `color-scheme` and skip cross-tab — leaves the tab gap open and edits the one file the token rewrite is replacing.
- **Consequences.** Gained: both gaps closed by default configuration, and the hydration patch in `ThemeToggle` becomes upstream's problem. Lost: one ~3 KB dependency, and in system mode the DOM attribute is now resolved rather than absent, so the `@media` block is only the no-JavaScript path.
- **Revisit when:** the design-system migration rewrites `tokens.css` and can add the CSS-level `color-scheme` fallback.

- [ ] **Step 2: Extend FR-15 in `docs/02-requirements/scope.md`**

The row currently reads *"Theme switch with three states: follow system · light · dark"*. Extend it so the two new behaviours belong to the same function, and reference ADR-0018. Do **not** add a new FR — this is one function, not two.

- [ ] **Step 3: Add the README feature bullet**

One short English bullet under `## Features`, in the existing style: the theme follows the system by default, is remembered, and stays in step across tabs.

- [ ] **Step 4: Ignore the worktree directory**

`.worktrees/` currently shows as untracked in the main checkout. Add it to `.gitignore`.

- [ ] **Step 5: Update `docs/04-state/backlog.md`**

Move the next-themes entry out of §In progress now that it is done, and record the hand-off: the design-system migration should add a CSS-level `color-scheme` to each theme block for visitors without JavaScript.

- [ ] **Step 6: Regenerate the derived doc blocks**

```bash
bash .claude/scripts/docs-regen.sh
```

This rewrites the ADR index between the `auto` markers. Never hand-edit inside them.

- [ ] **Step 7: Final verification, then commit**

```bash
pnpm test:run
pnpm typecheck
pnpm lint
pnpm build
pnpm audit
```

`pnpm audit` covers NFR-SEC-05, which this branch touches by adding a dependency.

```bash
git add -A docs README.md .gitignore
git commit -m "docs(theme): record ADR-0018, extend FR-15 and note the CSS fallback hand-off"
```
