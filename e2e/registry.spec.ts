// e2e/registry.spec.ts
//
// The public registry now renders straight off `content/` (ADR-0018): the home
// page groups apps and games, and `/apps` lists every app with its authored
// tagline — nothing invented for an entry that has none.
import { expect, test } from "@playwright/test";

test("the home registry lists both groups", async ({ page }) => {
  await page.goto("/vi");
  // `exact: true`: the hero `<h1>` ("Một tài khoản, mọi ứng dụng.") also contains
  // "ứng dụng" as a substring, and `getByRole`'s name match is substring by
  // default — without `exact` this resolves to two headings instead of one.
  await expect(page.getByRole("heading", { name: "Ứng dụng", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trò chơi", exact: true })).toBeVisible();
  // `.first()`: "Ducker ID" also names its branch in the wire diagram above the
  // card grid, so the plain text appears twice on this page.
  await expect(page.getByText("Ducker ID").first()).toBeVisible();
  await expect(page.getByText("Duck Solitaire").first()).toBeVisible();

  // Ducker ID has a tagline in its frontmatter, so it should render the data-testid attribute.
  await expect(
    page.getByRole("listitem").filter({ hasText: "Ducker ID" }).getByTestId("tagline"),
  ).toBeVisible();
});

test("a planned entry shows no invented description", async ({ page }) => {
  await page.goto("/vi/apps");
  const row = page.getByRole("listitem").filter({ hasText: "Tier List" });
  await expect(row).toBeVisible();

  // `content/apps/web-app-tier-list.vi.mdx` carries no `tagline` — the card must
  // not invent one. The brief's literal assertion (`toContainText("planned")`)
  // does not hold on this page: the status badge shows the *translated* label
  // ("Dự kiến nối"), never the raw English integration key — showing a raw key
  // to a reader is exactly what `AppCard` is built to avoid. So this asserts
  // the thing the case is actually named for: no tagline paragraph renders.
  await expect(row.getByTestId("tagline")).toHaveCount(0);

  // The status badge should display the translated label for planned status.
  await expect(row).toContainText("Dự kiến nối");
});
