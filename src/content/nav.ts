import { navGroups } from "../../content/nav";
import { defaultLocale } from "@/i18n/locales";
import { listApps, listGames } from "./registry";
import { listDocs } from "./docs";
import { buildNavTree, type NavRow, type NavTreeNode } from "./nav-tree";

/** A pushed child's source: enough to build one `NavRow` under a container. */
type NavChildSource = { slug: string; name: string };

function containerRow(id: string, labels: Record<string, string>, order: number): NavRow {
  return {
    id,
    parentId: null,
    order,
    status: "PUBLISHED",
    kind: "CONTAINER",
    href: null,
    labels: Object.entries(labels).map(([locale, value]) => ({ locale, value })),
  };
}

function childRow(
  source: NavChildSource,
  order: number,
  parentId: string,
  base: string,
  kind: "APP" | "DOC",
  locale: string,
): NavRow {
  return {
    id: `${parentId}:${source.slug}`,
    parentId,
    order,
    status: "PUBLISHED",
    kind,
    href: `${base}/${source.slug}`,
    labels: [{ locale, value: source.name }],
  };
}

/**
 * Navigation rows for one locale, built from the content files.
 *
 * Apps and games are containers whose children come from the registry reader,
 * each opened by an Overview leaf (`content/nav.ts`) so `firstLeafHref` points
 * the top tab at `/apps` or `/games`. Games used to be a childless leaf (R5)
 * because they had no detail route; ADR-0023 gave them one.
 *
 * Every row comes out `status: "PUBLISHED"` (R14): file-backed content has no
 * draft state, and `buildNavTree` still filters on that field.
 */
export async function listNavRows(locale: string): Promise<NavRow[]> {
  const rows: NavRow[] = [];

  navGroups.forEach((group, order) => {
    rows.push(containerRow(group.id, group.labels, order));
    if (group.overview) {
      rows.push({
        id: `${group.id}:overview`,
        parentId: group.id,
        // Before every entry, whose orders start at 0.
        order: -1,
        status: "PUBLISHED",
        kind: "APP",
        href: `/${locale}/${group.id}`,
        labels: Object.entries(group.overview).map(([loc, value]) => ({ locale: loc, value })),
      });
    }
  });

  const [apps, games, docs] = await Promise.all([listApps(locale), listGames(locale), listDocs(locale)]);
  apps.forEach((app, order) => rows.push(childRow(app, order, "apps", `/${locale}/apps`, "APP", locale)));
  games.forEach((game, order) => rows.push(childRow(game, order, "games", `/${locale}/games`, "APP", locale)));
  docs.forEach((doc, order) =>
    rows.push(childRow({ slug: doc.slug, name: doc.title }, order, "docs", `/${locale}/docs`, "DOC", locale)),
  );

  return rows;
}

/**
 * The public navigation tree for one locale: root nodes are the top tab strip,
 * descendants of the open tab are the left sidebar.
 *
 * The file-backed replacement for `getNavTree` in `@/server/content/queries` —
 * same shape, built from `listNavRows` instead of Prisma. There is no draft
 * state to filter here (every row from `listNavRows` is already `PUBLISHED`,
 * per R14), but `buildNavTree` still does that filtering from its Prisma-era
 * contract, so it is harmless to route through it unchanged.
 */
export async function getNavTree(locale: string): Promise<NavTreeNode[]> {
  return buildNavTree(await listNavRows(locale), locale, defaultLocale);
}
