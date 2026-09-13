// e2e/theme.spec.ts
//
// Four things only a real browser can answer, each one a regression that would
// otherwise ship silently:
//
//   1. NFR-A11Y-07 — no colour flash. The theme attribute has to be set before
//      the first contentful paint, which is what the test compares: the moment
//      a MutationObserver sees data-theme appear against the paint entry from
//      a PerformanceObserver. The CPU is throttled 20x, because at full speed
//      even a late script wins the race and the test passes for the wrong
//      reason.
//   2. The choice survives a reload.
//   3. color-scheme follows the theme, so scrollbars and native controls do too.
//      Nothing in src/styles/ sets that property; the provider does.
//   4. The choice reaches a second tab — the gap that motivated the migration.
import { test, expect, type Page } from "@playwright/test";

const STORAGE_KEY = "ducker-theme";

/**
 * `--bg` from the `:root[data-theme="dark"]` block of tokens.css, in the form
 * Chromium reports. Read out of the file, not guessed: a wrong constant here
 * fails the flash test for a reason that has nothing to do with flashing.
 */
const DARK_BG = "rgb(9, 9, 11)";

/** Matches the dark button's accessible name in either locale. */
const DARK_BUTTON = /tối|dark/i;

async function throttle(page: Page, rate: number) {
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate });
}

test("no colour flash: the theme is set before the first contentful paint", async ({
  page,
}) => {
  await page.addInitScript(
    ([key]) => {
      localStorage.setItem(key, "dark");
      const w = window as unknown as Record<string, unknown>;
      w.__themeAt = null;
      w.__themeError = null;

      try {
        // Observe `document`, not `document.documentElement`: an init script runs
        // at document start, where documentElement can still be null, and
        // observe(null) throws and kills the rest of this script silently.
        // Subtree catches the attribute landing on <html> just the same.
        //
        // The observer is parked on `window` because one with no reference can
        // be collected before it ever fires.
        const observer = new MutationObserver((records) => {
          for (const record of records) {
            if (
              record.attributeName === "data-theme" &&
              (record.target as Element).getAttribute?.("data-theme")
            ) {
              if (w.__themeAt === null) w.__themeAt = performance.now();
              observer.disconnect();
              return;
            }
          }
        });
        w.__themeObserver = observer;
        observer.observe(document, {
          attributes: true,
          subtree: true,
          attributeFilter: ["data-theme"],
        });
      } catch (error) {
        // Surfaced in the assertion message instead of failing as a bare null.
        w.__themeError = String(error);
      }
    },
    [STORAGE_KEY],
  );
  await throttle(page, 20);

  const response = await page.goto("/vi");
  // Anti-self-deception: a 404 would satisfy every assertion below.
  expect(response?.status(), "/vi must answer 200").toBe(200);

  // Paint entries stay in the performance timeline, so they can simply be read
  // once the page has loaded. An earlier draft used a PerformanceObserver inside
  // the init script and it never delivered an entry, which cost a debugging pass
  // and proved nothing about the theme.
  const timing = await page.evaluate(() => {
    const fcp = performance
      .getEntriesByType("paint")
      .find((entry) => entry.name === "first-contentful-paint");
    return {
      themeAt: (window as unknown as { __themeAt: number | null }).__themeAt,
      themeError: (window as unknown as { __themeError: string | null }).__themeError,
      fcpAt: fcp ? fcp.startTime : null,
    };
  });

  expect(timing.fcpAt, "no first-contentful-paint entry was recorded").not.toBeNull();
  expect(timing.themeError, "the instrumentation itself threw").toBeNull();
  expect(timing.themeAt, "data-theme was never set").not.toBeNull();
  expect(
    timing.themeAt!,
    `theme landed at ${timing.themeAt}ms, first contentful paint at ${timing.fcpAt}ms`,
  ).toBeLessThanOrEqual(timing.fcpAt!);

  // And the settled result is the dark ground, not merely some attribute.
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    DARK_BG,
  );
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
  expect((await first.goto("/vi"))?.status(), "/vi must answer 200").toBe(200);
  expect((await second.goto("/vi"))?.status(), "/vi must answer 200").toBe(200);

  await first.getByRole("button", { name: DARK_BUTTON }).click();

  // The storage event only fires in *other* documents of the same origin, which
  // is exactly the case this migration added.
  await expect(second.locator("html")).toHaveAttribute("data-theme", "dark", {
    timeout: 5_000,
  });
});
