// content/nav.ts
//
// The navigation tree's top level, hand-written. Three groups; their children are
// derived from the content files (`src/content/nav.ts`) so adding an app, game or doc
// never means editing this file. A group with `overview` gets an Overview leaf as
// its first child, pointing at `/<locale>/<id>` — the page its top tab opens.
export type NavGroup = {
  id: "apps" | "games" | "docs";
  labels: Record<string, string>;
  overview?: Record<string, string>;
};

export const navGroups: NavGroup[] = [
  { id: "apps", labels: { vi: "Ứng dụng", en: "Applications" }, overview: { vi: "Tổng quan", en: "Overview" } },
  { id: "games", labels: { vi: "Trò chơi", en: "Games" }, overview: { vi: "Tổng quan", en: "Overview" } },
  { id: "docs", labels: { vi: "Tài liệu", en: "Documentation" } },
];
