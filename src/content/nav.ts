import { navGroups } from "../../content/nav";
import { listApps } from "./registry";
import { listDocs } from "./docs";
import type { NavRow } from "./nav-tree";

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
 * `content/nav.ts` names three groups: apps and docs are containers whose children
 * are derived from the registry/docs readers, so adding an entry there never means
 * editing the nav tree by hand. Games are the exception (R5): there is no per-game
 * detail route, so the "games" row is itself a leaf pointing at `/games` and gets no
 * children — pushing one row per game the way apps and docs do would link
 * somewhere that does not exist.
 *
 * Every row comes out `status: "PUBLISHED"` (R14): file-backed content has no draft
 * state, and `buildNavTree`/`assertNavInvariants` still filter on that field from
 * their Prisma-era days, so this keeps every row passing through that filter until a
 * later task retires it.
 */
export async function listNavRows(locale: string): Promise<NavRow[]> {
  const rows: NavRow[] = [];

  navGroups.forEach((group, order) => {
    if (group.id === "games") {
      rows.push({
        id: group.id,
        parentId: null,
        order,
        status: "PUBLISHED",
        kind: "APP",
        href: `/${locale}/games`,
        labels: Object.entries(group.labels).map(([loc, value]) => ({ locale: loc, value })),
      });
      return;
    }
    rows.push(containerRow(group.id, group.labels, order));
  });

  const apps = await listApps(locale);
  apps.forEach((app, order) => rows.push(childRow(app, order, "apps", `/${locale}/apps`, "APP", locale)));

  const docs = await listDocs(locale);
  docs.forEach((doc, order) =>
    rows.push(childRow({ slug: doc.slug, name: doc.title }, order, "docs", `/${locale}/docs`, "DOC", locale)),
  );

  return rows;
}
