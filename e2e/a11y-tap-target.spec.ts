// e2e/a11y-tap-target.spec.ts
//
// Scans every clickable element and fails if any is smaller than 24×24 (WCAG 2.2
// SC 2.5.8), plus checks the page body does not scroll horizontally at 375px.
//
// These are the only two UI faults in this suite that a **machine can measure**.
// The rest — is the heading really serif, do Vietnamese diacritics break, is the
// code block coloured — fail silently in the browser when CSS does not match, so
// only a human eye catches them. See
// `docs/02-requirements/nfr.md` NFR-A11Y-03.
import { test, expect } from "@playwright/test";

const PAGES = [
  "/vi",
  "/vi/apps",
  // ADR-0018: slug is now the content filename minus locale/extension
  // (`content/apps/web-app-ducker-id.vi.mdx`), not the old Prisma `App.slug`
  // ("ducker-id"). Same trap as the comment below: a wrong slug 404s and still
  // passes every assertion here, which would be this test lying green.
  "/vi/apps/web-app-ducker-id",
  // The real slug of the OAuth integration guide. An earlier plan wrote
  // `/vi/docs/tich-hop-oauth` — that slug does not exist, and a 404 page still passes
  // every assertion below, so getting this wrong makes the suite go green testing nothing.
  "/vi/docs/oauth-integration-guide",
];

for (const path of PAGES) {
  test(`tap targets on ${path} reach 24x24 (WCAG 2.2 SC 2.5.8)`, async ({ page }) => {
    const response = await page.goto(path);
    // Guard against self-deception: a page that does not exist has nothing to measure.
    expect(response?.status(), `${path} must return 200`).toBe(200);

    const small = await page.evaluate(() => {
      const sel = "a, button, input, select, [role=button]";
      return [...document.querySelectorAll(sel)]
        .filter((e) => (e as HTMLElement).offsetParent !== null)
        .map((e) => {
          const r = e.getBoundingClientRect();
          return {
            t: e.tagName,
            txt: (e.textContent || "").trim().slice(0, 24),
            w: Math.round(r.width),
            h: Math.round(r.height),
          };
        })
        .filter((x) => x.h > 0 && (x.h < 24 || x.w < 24));
    });
    expect(small, JSON.stringify(small, null, 2)).toEqual([]);
  });

  test(`page body does not scroll horizontally at 375px — ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const response = await page.goto(path);
    expect(response?.status(), `${path} must return 200`).toBe(200);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

// ---------------------------------------------------------------------------
// Narrow-screen navigation drawer.
//
// The two tests above only measure the CLOSED state: the open button is in the flow
// so it gets scanned, but nothing inside the drawer exists in the DOM yet. Opening it
// and measuring again is the only way to know whether the drawer's tree meets the
// tap-target threshold.
// ---------------------------------------------------------------------------

/** A page that certainly has a left column, so certainly has a drawer at 375px. */
const DRAWER_PAGE = "/vi/apps/web-app-ducker-id";

test("at 375px navigation is reachable at the top of the article, without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const response = await page.goto(DRAWER_PAGE);
  expect(response?.status()).toBe(200);

  const trigger = page.getByRole("button", { name: /Điều hướng tài liệu/ });
  await expect(trigger).toBeVisible();

  // "Without scrolling" is measurable: the button's top must be inside the first viewport.
  const box = await trigger.boundingBox();
  expect(box, "drawer open button must have a box").not.toBeNull();
  expect(box!.y).toBeLessThan(800);

  // The left column must not be both hidden and taking space: closed, it covers no content.
  expect(await page.locator("[role=dialog]").count()).toBe(0);
});

test("open drawer meets the tap-target threshold and closes with Esc — 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const response = await page.goto(DRAWER_PAGE);
  expect(response?.status()).toBe(200);

  await page.getByRole("button", { name: /Điều hướng tài liệu/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const small = await page.evaluate(() => {
    const panel = document.querySelector("[role=dialog]");
    if (!panel) return [{ t: "MISSING", txt: "", w: 0, h: 0 }];
    return [...panel.querySelectorAll<HTMLElement>("a, button, [role=button]")]
      .map((e) => {
        const r = e.getBoundingClientRect();
        return {
          t: e.tagName,
          txt: (e.textContent || "").trim().slice(0, 24),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      })
      .filter((x) => x.h > 0 && (x.h < 24 || x.w < 24));
  });
  expect(small, JSON.stringify(small, null, 2)).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  // Focus returns to the open button, not to <body>.
  const focused = await page.evaluate(
    () => document.activeElement?.getAttribute("aria-haspopup") ?? "",
  );
  expect(focused).toBe("dialog");
});
