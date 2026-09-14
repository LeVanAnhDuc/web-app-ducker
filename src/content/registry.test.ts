import { describe, expect, it } from "vitest";
import { listApps, listGames, getApp } from "./registry";

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
