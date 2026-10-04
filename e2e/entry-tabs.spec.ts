// e2e/entry-tabs.spec.ts
//
// Overview → detail → Releases, for apps and games (ADR-0023). GitHub's answer
// is whatever it was at build time, so every assertion here holds for both an
// `ok` and an `unavailable` README/release list — the structure is under test,
// not GitHub's uptime.
import { expect, test } from "@playwright/test";

test("the Games tab opens the games overview, first in its sidebar", async ({ page }) => {
  await page.goto("/vi");
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Trò chơi" }).click();
  await expect(page).toHaveURL(/\/vi\/games$/);
  await expect(page.getByRole("heading", { level: 1, name: "Trò chơi" })).toBeVisible();
  const sidebar = page.getByRole("navigation", { name: "Điều hướng tài liệu" }).first();
  await expect(sidebar.getByRole("link").first()).toHaveText("Tổng quan");
});

test("an overview row opens the detail page on its README tab", async ({ page }) => {
  await page.goto("/vi/games");
  // The slug appears only in the overview row, not in the sidebar's item of the same name.
  await page
    .getByRole("listitem")
    .filter({ hasText: "web-game-duck-caro" })
    .getByRole("link")
    .click();
  await expect(page).toHaveURL(/\/vi\/games\/web-game-duck-caro$/);
  const tabs = page.getByRole("navigation", { name: "Nội dung của Duck Caro" });
  await expect(tabs.getByRole("link", { name: "README" })).toHaveAttribute("aria-current", "page");
});

test("the Releases tab keeps the sidebar and the active top tab", async ({ page }) => {
  await page.goto("/vi/games/web-game-duck-caro/releases");
  const tabs = page.getByRole("navigation", { name: "Nội dung của Duck Caro" });
  await expect(tabs.getByRole("link", { name: "Bản phát hành" })).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Trò chơi" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Điều hướng tài liệu" }).first()).toContainText("Duck Caro");
  // Either the list or the notice — never an empty tab.
  await expect(page.locator("details, [role=status]").first()).toBeVisible();
});

test("an entry with no repository has no tabs and no Releases page", async ({ page }) => {
  await page.goto("/vi/apps/web-app-tier-list");
  await expect(page.getByRole("heading", { level: 1, name: "Tier List" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: /Nội dung của/ })).toHaveCount(0);
  const response = await page.goto("/vi/apps/web-app-tier-list/releases");
  expect(response?.status()).toBe(404);
});

test("at 375px the newest release is on the first screen, not under the TOC", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/vi/games/web-game-duck-caro/releases");
  const newest = page.locator("details").first();
  // Skip when GitHub was unavailable at build time — there is no list to place.
  if ((await newest.count()) === 0) test.skip();
  const box = await newest.boundingBox();
  expect(box!.y).toBeLessThan(812);
});
