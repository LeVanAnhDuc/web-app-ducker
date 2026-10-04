import { describe, expect, it, vi } from "vitest";

// `listApps` and `listDocSlugs` are mocked with deterministic fixtures rather than
// pointed at the real `content/` tree: `content/apps` and `content/docs` are not
// authored until a later task (see registry.test.ts's own red content-count
// assertions), and mocking here keeps this suite green and deterministic without
// touching those protected directories.
vi.mock("./registry", () => ({
  listApps: vi.fn(async () => [
    { slug: "ducker-id", name: "Ducker ID" },
    { slug: "match-cv", name: "Match CV" },
  ]),
  listGames: vi.fn(async () => [
    { slug: "web-game-duck-caro", name: "Duck Caro" },
    { slug: "web-game-duck-flap", name: "Duck Flap" },
  ]),
}));

vi.mock("./docs", () => ({
  listDocSlugs: vi.fn(async () => ["getting-started", "faq"]),
  listDocs: vi.fn(async () => [
    { slug: "getting-started", title: "Getting Started" },
    { slug: "faq", title: "Frequently Asked Questions" },
  ]),
}));

import { listNavRows } from "./nav";
import { buildNavTree, firstLeafHref } from "./nav-tree";

describe("listNavRows", () => {
  it("produces one root row per group, in the order content/nav.ts declares", async () => {
    const rows = await listNavRows("vi");
    const roots = rows.filter((r) => r.parentId === null);
    expect(roots.map((r) => r.id)).toEqual(["apps", "games", "docs"]);
  });

  it("builds a tree with the three group labels as roots", async () => {
    const tree = buildNavTree(await listNavRows("vi"), "vi", "vi");
    expect(tree.map((n) => n.label)).toEqual(["Ứng dụng", "Trò chơi", "Tài liệu"]);
  });

  it("satisfies I5 — every root row has a vi label", async () => {
    const rows = await listNavRows("vi");
    const roots = rows.filter((r) => r.parentId === null);
    expect(
      roots.every((r) => r.labels.some((l) => l.locale === "vi" && l.value.length > 0)),
    ).toBe(true);
  });

  it("opens the apps group with an Overview leaf, then every app (R4)", async () => {
    const tree = buildNavTree(await listNavRows("vi"), "vi", "vi");
    const apps = tree.find((n) => n.id === "apps")!;
    expect(apps.children.map((c) => c.href)).toEqual([
      "/vi/apps",
      "/vi/apps/ducker-id",
      "/vi/apps/match-cv",
    ]);
    expect(apps.children[0]!.label).toBe("Tổng quan");
    expect(apps.children.every((c) => c.kind === "APP")).toBe(true);
  });

  it("puts every doc under the docs container, with kind DOC (R4/I7)", async () => {
    const rows = await listNavRows("vi");
    const docChildren = rows.filter((r) => r.parentId === "docs");
    expect(docChildren).toHaveLength(2);
    expect(docChildren.every((r) => r.kind === "DOC")).toBe(true);
    expect(docChildren.map((r) => r.href)).toEqual(["/vi/docs/getting-started", "/vi/docs/faq"]);
  });

  it("makes games a container shaped like apps — R5 is retired", async () => {
    const tree = buildNavTree(await listNavRows("en"), "en", "vi");
    const games = tree.find((n) => n.id === "games")!;
    expect(games.kind).toBe("CONTAINER");
    expect(games.href).toBeNull();
    expect(games.children.map((c) => c.href)).toEqual([
      "/en/games",
      "/en/games/web-game-duck-caro",
      "/en/games/web-game-duck-flap",
    ]);
    expect(games.children[0]!.label).toBe("Overview");
  });

  it("points each top tab at its overview", async () => {
    const tree = buildNavTree(await listNavRows("vi"), "vi", "vi");
    expect(tree.map((n) => firstLeafHref(n))).toEqual(["/vi/apps", "/vi/games", "/vi/docs/getting-started"]);
  });

  it("gives docs no Overview leaf — there is no /docs page", async () => {
    const rows = await listNavRows("vi");
    expect(rows.some((r) => r.id === "docs:overview")).toBe(false);
  });

  it("emits status PUBLISHED on every row (R14 — file-backed content has no draft state)", async () => {
    const rows = await listNavRows("vi");
    expect(rows.every((r) => r.status === "PUBLISHED")).toBe(true);
  });

  it("uses the authored title as doc row labels, not the slug", async () => {
    const rows = await listNavRows("vi");
    const docChildren = rows.filter((r) => r.parentId === "docs");
    expect(docChildren.map((r) => r.labels[0]!.value)).toEqual([
      "Getting Started",
      "Frequently Asked Questions",
    ]);
  });
});
