// e2e/theme.spec.ts
//
// Four things only a real browser can answer, each one a regression that would
// otherwise ship silently:
//
//   1. NFR-A11Y-07 — no colour flash. The theme script has to land before the
//      first paint. Measured with the CPU throttled 20x, because at full speed
//      even a late script usually wins the race and the test passes for the
//      wrong reason.
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

test("no colour flash: the first painted frame is already dark", async ({ page }) => {
  await page.addInitScript(
    ([key]) => {
      localStorage.setItem(key, "dark");
      // This runs before any of the page's own script. The first animation
      // frame is the earliest moment the document can have been painted.
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
  expect((await first.goto("/vi"))?.status(), "/vi must answer 200").toBe(200);
  expect((await second.goto("/vi"))?.status(), "/vi must answer 200").toBe(200);

  await first.getByRole("button", { name: DARK_BUTTON }).click();

  // The storage event only fires in *other* documents of the same origin, which
  // is exactly the case this migration added.
  await expect(second.locator("html")).toHaveAttribute("data-theme", "dark", {
    timeout: 5_000,
  });
});
