import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { listApps, listGames, getApp } from "./registry";

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "ducker-registry-test-"));
  mkdirSync(join(root, "apps"), { recursive: true });

  // Entry with status: "private", a repo URL, and repoPrivate: true
  writeFileSync(
    join(root, "apps", "private-status.vi.mdx"),
    `---
name: Private Integration
status: private
order: 10
repo: https://github.com/example/private-app
repoPrivate: true
---
This is a private integration.`,
  );

  // Entry with non-planned status, no repo, no repoPrivate (defaults to false)
  writeFileSync(
    join(root, "apps", "no-repo.vi.mdx"),
    `---
name: App Without Repo
status: connected
order: 20
---
This app has no repo.`,
  );

  // Entry with planned status and no repo
  writeFileSync(
    join(root, "apps", "planned.vi.mdx"),
    `---
name: Future App
status: planned
order: 30
---
This is planned.`,
  );
});

describe("listApps", () => {
  it("returns every application in order, Ducker ID first", async () => {
    const apps = await listApps("vi");
    expect(apps).toHaveLength(10);
    expect(apps[0].name).toBe("Ducker ID");
    expect(apps[0].integration).toBe("core");
  });

  it("leaves tagline null for the three entries that have no description", async () => {
    const apps = await listApps("vi");
    const planned = apps.filter((a) => a.integration === "planned");
    expect(planned.map((a) => a.name).sort()).toEqual(["Task Management", "Tier List"]);
    expect(planned.every((a) => a.tagline === null)).toBe(true);
  });

  it("returns fixture entries when using test root", async () => {
    const apps = await listApps("vi", root);
    expect(apps).toHaveLength(3);
    expect(apps.map((a) => a.name).sort()).toEqual([
      "App Without Repo",
      "Future App",
      "Private Integration",
    ]);
  });
});

describe("listGames", () => {
  it("returns the twelve duck games", async () => {
    const games = await listGames("vi");
    expect(games).toHaveLength(12);
    expect(games.find((g) => g.name === "Duck Strike")?.tagline).toBeNull();
  });
});

describe("getApp", () => {
  it("returns null for an unknown slug", async () => {
    expect(await getApp("no-such-app", "vi")).toBeNull();
  });
});

describe("isRepoPrivate", () => {
  it("uses the authored repoPrivate field from frontmatter", async () => {
    const apps = await listApps("vi", root);
    const privateStatus = apps.find((a) => a.name === "Private Integration");
    expect(privateStatus?.integration).toBe("private");
    expect(privateStatus?.repoUrl).toBe("https://github.com/example/private-app");
    expect(privateStatus?.isRepoPrivate).toBe(true);
  });

  it("defaults isRepoPrivate to false for entries without repoPrivate field", async () => {
    const apps = await listApps("vi", root);
    const noRepo = apps.find((a) => a.name === "App Without Repo");
    expect(noRepo?.repoUrl).toBeNull();
    expect(noRepo?.isRepoPrivate).toBe(false);
  });

  it("defaults isRepoPrivate to false for planned entries without repoPrivate field", async () => {
    const apps = await listApps("vi", root);
    const planned = apps.find((a) => a.name === "Future App");
    expect(planned?.integration).toBe("planned");
    expect(planned?.repoUrl).toBeNull();
    expect(planned?.isRepoPrivate).toBe(false);
  });
});
