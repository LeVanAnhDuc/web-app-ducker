import { describe, it, expect } from "vitest";
import {
  buildNavTree,
  findTrail,
  firstLeafHref,
  topTabs,
  navHref,
  resolveTranslation,
  type NavRow,
} from "./nav-tree";

const row = (o: Partial<NavRow> & { id: string }): NavRow => ({
  parentId: null, order: 0, kind: "CONTAINER",
  labels: [{ locale: "vi", value: o.id }], href: null, ...o,
});

describe("buildNavTree", () => {
  it("nests children under the right parent and keeps their order", () => {
    const t = buildNavTree([
      row({ id: "b", order: 1 }), row({ id: "a", order: 0 }),
      row({ id: "a1", parentId: "a", kind: "DOC", href: "/vi/docs/x" }),
    ], "vi", "vi");
    expect(t.map(n => n.id)).toEqual(["a", "b"]);
    expect(t[0].children.map(n => n.id)).toEqual(["a1"]);
  });

  it("nests three levels deep", () => {
    const t = buildNavTree([
      row({ id: "r" }), row({ id: "m", parentId: "r" }),
      row({ id: "leaf", parentId: "m", kind: "APP", href: "/vi/apps/x" }),
    ], "vi", "vi");
    expect(t[0].children[0].children[0].href).toBe("/vi/apps/x");
  });


  it("falls back to the default label when the locale's is missing, and flags isFallback", () => {
    const t = buildNavTree([row({ id: "a", labels: [{ locale: "vi", value: "Ứng dụng" }] })], "en", "vi");
    expect(t[0]).toMatchObject({ label: "Ứng dụng", isFallback: true });
  });

  it("drops an orphan node (missing parent) instead of crashing the tree", () => {
    const t = buildNavTree([row({ id: "a" }), row({ id: "x", parentId: "khong-co" })], "vi", "vi");
    expect(t.map(n => n.id)).toEqual(["a"]);
  });

  // The two tests below guard cycles and empty labels; see the doc comments
  // in `nav-tree.ts`.
  it("throws on a cycle in the data instead of looping forever", () => {
    expect(() => buildNavTree([
      row({ id: "a", parentId: "b" }), row({ id: "b", parentId: "a" }),
    ], "vi", "vi")).toThrow(/cycle/i);
  });

  it("drops a node with no label at all rather than inventing one from its id", () => {
    const t = buildNavTree([
      row({ id: "a" }),
      row({ id: "khong-nhan", labels: [], kind: "DOC", href: "/vi/docs/y" }),
    ], "vi", "vi");
    expect(t.map(n => n.id)).toEqual(["a"]);
  });
});

describe("firstLeafHref", () => {
  it("returns the first leaf in order, used when someone opens a container's URL directly", () => {
    const t = buildNavTree([
      row({ id: "r" }),
      row({ id: "c1", parentId: "r", order: 1, kind: "DOC", href: "/vi/docs/b" }),
      row({ id: "c0", parentId: "r", order: 0, kind: "DOC", href: "/vi/docs/a" }),
    ], "vi", "vi");
    expect(firstLeafHref(t[0])).toBe("/vi/docs/a");
  });
  it("returns null for a container with no leaves", () => {
    expect(firstLeafHref({ id: "x", kind: "CONTAINER", label: "x", href: null, isFallback: false, children: [] })).toBeNull();
  });
});

describe("findTrail", () => {
  it("returns the path from the root to the node holding href — which tab is open and which branch to expand", () => {
    const t = buildNavTree([
      row({ id: "r" }), row({ id: "m", parentId: "r" }),
      row({ id: "leaf", parentId: "m", kind: "APP", href: "/vi/apps/x" }),
    ], "vi", "vi");
    expect(findTrail(t, "/vi/apps/x").map(n => n.id)).toEqual(["r", "m", "leaf"]);
  });
});

// Carried over from `src/server/content/resolve.test.ts` (R13): `resolveTranslation`
// moved into this file with `buildNavTree`, its only surviving consumer, so this
// coverage must not be lost when `src/server/` is deleted.
describe("resolveTranslation", () => {
  const rows = [
    { locale: "vi", title: "Tính năng" },
    { locale: "en", title: "Features" },
  ];

  it("returns the right translation when it exists", () => {
    expect(resolveTranslation(rows, "en", "vi")).toEqual({
      value: rows[1], locale: "en", isFallback: false,
    });
  });

  it("falls back to the default locale when a translation is missing, and flags isFallback", () => {
    expect(resolveTranslation(rows, "ja", "vi")).toEqual({
      value: rows[0], locale: "vi", isFallback: true,
    });
  });

  it("returns null when even the default is missing, so the page calls notFound()", () => {
    expect(resolveTranslation([], "vi", "vi")).toBeNull();
  });

  it("never returns the slug as a substitute label", () => {
    const r = resolveTranslation(rows, "ja", "vi");
    expect(r!.value.title).not.toMatch(/-/);
  });
});

describe("navHref", () => {
  it("maps a releases tab onto its entry's nav href", () => {
    expect(navHref("/vi/apps/web-app-ducker-id/releases")).toBe("/vi/apps/web-app-ducker-id");
    expect(navHref("/en/games/web-game-duck-caro/releases")).toBe("/en/games/web-game-duck-caro");
  });

  it("leaves every other path alone", () => {
    for (const path of ["/vi/apps", "/vi/apps/x", "/vi/docs/releases-guide", "/vi/apps/releases"]) {
      expect(navHref(path)).toBe(path);
    }
  });
});

describe("topTabs", () => {
  const leaf = (id: string, href: string) =>
    ({ id, kind: "APP" as const, label: id, href, isFallback: false, children: [] });
  const container = (id: string, children: ReturnType<typeof leaf>[]) =>
    ({ id, kind: "CONTAINER" as const, label: id, href: null, isFallback: false, children });

  it("points each root at its first leaf", () => {
    expect(topTabs([container("apps", [leaf("o", "/vi/apps"), leaf("x", "/vi/apps/x")])])).toEqual([
      { id: "apps", label: "apps", href: "/vi/apps" },
    ]);
  });

  it("draws no tab for a root with no leaf — an empty content folder", () => {
    // A container has no page of its own, so a leafless one has nowhere to go.
    expect(topTabs([container("docs", []), container("apps", [leaf("o", "/vi/apps")])]).map((t) => t.id)).toEqual([
      "apps",
    ]);
  });
});
