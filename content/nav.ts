// content/nav.ts
//
// The navigation tree's top level, hand-written. Three groups; their children are
// derived from the content files (`src/content/nav.ts`) so adding an app, game or doc
// never means editing this file.
export const navGroups = [
  { id: "apps", labels: { vi: "Ứng dụng", en: "Applications" }, group: "apps" as const },
  { id: "games", labels: { vi: "Trò chơi", en: "Games" }, group: "games" as const },
  { id: "docs", labels: { vi: "Tài liệu", en: "Documentation" }, group: "docs" as const },
];
