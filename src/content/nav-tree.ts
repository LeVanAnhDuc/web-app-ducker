/**
 * The navigation tree: build it from a flat row list, find a trail through it.
 *
 * Pure — no filesystem, no Next.js. `listNavRows` (`src/content/nav.ts`) builds the
 * flat rows from `content/nav.ts` and the entry readers, then hands them here
 * (ADR-0018). Root nodes (`parentId = null`) are the top tab strip; the open tab's
 * descendants are the left sidebar. URLs stay flat — the tree only drives how
 * navigation is drawn. Invariants: `docs/03-design/invariants.md`.
 */

/** The three node kinds. A `CONTAINER` has no page of its own; `APP` and `DOC` are leaves. */
export const navKindValues = ["CONTAINER", "APP", "DOC"] as const;
export type NavKind = (typeof navKindValues)[number];

/**
 * A value whose language has been chosen.
 *
 * `locale` is the language `value` is actually in, not the one asked for.
 * `isFallback` lets a page show a "not yet in <language>" badge — honest to the
 * reader, and a to-translate list in its own right.
 */
export type Translated<T> = {
  value: T;
  locale: string;
  isFallback: boolean;
};

/**
 * Picks the translation for `want`, falling back to `fallback` when it is missing.
 *
 * Returns `null` when the default is missing too. Never invent a label from the
 * slug: "ducker-id" where "Ducker ID" belongs looks like real data and slips past
 * every check, while an absent item is noticed at once.
 */
export function resolveTranslation<T extends { locale: string }>(
  rows: T[],
  want: string,
  fallback: string,
): Translated<T> | null {
  const wanted = rows.find((row) => row.locale === want);
  if (wanted) return { value: wanted, locale: want, isFallback: false };

  const defaulted = rows.find((row) => row.locale === fallback);
  if (defaulted) return { value: defaulted, locale: fallback, isFallback: true };

  return null;
}

/** One flat row, carrying every translation needed to pick its label. Built by `listNavRows` (`src/content/nav.ts`). */
export type NavRow = {
  id: string;
  parentId: string | null;
  order: number;
  kind: NavKind;
  /** Candidate labels by locale: a CONTAINER's come from `content/nav.ts`, an
   *  APP's or DOC's from the `name` frontmatter of its `.mdx` file. */
  labels: { locale: string; value: string }[];
  /** `null` for a CONTAINER. */
  href: string | null;
};

export type NavTreeNode = {
  id: string;
  kind: NavKind;
  label: string;
  href: string | null;
  isFallback: boolean;
  children: NavTreeNode[];
};

/** Siblings sort by `order`, then by `id`, so equal orders do not swap between two builds. */
function bySiblingOrder(a: NavRow, b: NavRow): number {
  return a.order - b.order || a.id.localeCompare(b.id);
}

/**
 * Throws when `rows` contain a cycle (I3).
 *
 * A cycle is never reachable from a root — each node has one parent, so a node
 * inside a loop has no root ancestor. Walking down from the roots, the tree builds
 * fine and the whole loop quietly vanishes. Walking *up* each row's parent chain
 * turns the cycle into an error instead of missing data.
 */
function assertNoCycle(rows: NavRow[]): void {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const safe = new Set<string>();

  for (const start of rows) {
    const walked = new Set<string>();
    let current: NavRow | undefined = start;

    while (current && !safe.has(current.id)) {
      if (walked.has(current.id)) {
        throw new Error(
          `Nav node "${current.id}" is its own descendant — the tree has a cycle. ` +
            `Fix the parent of one node in the loop (${[...walked].join(" → ")}).`,
        );
      }
      walked.add(current.id);
      current = current.parentId === null ? undefined : byId.get(current.parentId);
    }

    for (const id of walked) safe.add(id);
  }
}

/**
 * Builds the tree from the flat list.
 *
 * Tolerates bad data in two deliberately different ways:
 *
 * - **An orphan is dropped, silently.** A missing parent means the branch has no
 *   way in; dropping it keeps the rest of the navigation. Crashing the whole tree
 *   over one stray node costs too much.
 * - **A cycle throws.** No rendering of it is correct, and dropping it silently
 *   would lose a branch without anyone knowing.
 *
 * A node with no label in either the wanted or the default locale is dropped too,
 * with its branch: never use a slug or id as a stand-in label.
 */
export function buildNavTree(rows: NavRow[], locale: string, fallback: string): NavTreeNode[] {
  assertNoCycle(rows);

  const byId = new Map(rows.map((row) => [row.id, row]));
  const childrenOf = new Map<string | null, NavRow[]>();

  for (const row of rows) {
    // Parent not in the list → orphan; the whole branch goes.
    if (row.parentId !== null && !byId.has(row.parentId)) continue;
    const siblings = childrenOf.get(row.parentId);
    if (siblings) siblings.push(row);
    else childrenOf.set(row.parentId, [row]);
  }

  for (const siblings of childrenOf.values()) siblings.sort(bySiblingOrder);

  // `path` is the ancestor chain of the node being built. `assertNoCycle` has
  // already ruled out every cycle, so this never fires; it stays as a last guard so
  // a bug in this function itself throws instead of hanging the page.
  const path = new Set<string>();

  const build = (row: NavRow): NavTreeNode | null => {
    if (path.has(row.id)) {
      throw new Error(`Nav node "${row.id}" appears twice on one path — the tree has a cycle.`);
    }
    path.add(row.id);
    try {
      const children = (childrenOf.get(row.id) ?? [])
        .map(build)
        .filter((child): child is NavTreeNode => child !== null);

      const label = resolveTranslation(row.labels, locale, fallback);
      if (!label) return null;

      return {
        id: row.id,
        kind: row.kind,
        label: label.value.value,
        href: row.href,
        isFallback: label.isFallback,
        children,
      };
    } finally {
      path.delete(row.id);
    }
  };

  return (childrenOf.get(null) ?? [])
    .map(build)
    .filter((node): node is NavTreeNode => node !== null);
}

/**
 * The path from a root to the node with the given `href` — which tab is open and
 * which branches start expanded. Empty when nothing matches.
 */
export function findTrail(tree: NavTreeNode[], href: string): NavTreeNode[] {
  for (const node of tree) {
    if (node.href === href) return [node];
    const deeper = findTrail(node.children, href);
    if (deeper.length > 0) return [node, ...deeper];
  }
  return [];
}

/**
 * The first leaf in tree order — where a top tab points, since a `CONTAINER` has no
 * page of its own. `null` when the branch has no leaf; the tab is then not drawn.
 */
export function firstLeafHref(node: NavTreeNode): string | null {
  if (node.href !== null) return node.href;
  for (const child of node.children) {
    const href = firstLeafHref(child);
    if (href !== null) return href;
  }
  return null;
}

/**
 * The top tab strip: one tab per root, pointing at its first leaf.
 *
 * A root with no leaf (its `content/` folder is empty) gets no tab. There used to
 * be a `/[locale]/n/[id]` route to fall back on; it could only ever redirect to
 * this same first leaf or 404, so a tab that leads nowhere is simply not drawn.
 */
export function topTabs(tree: NavTreeNode[]): { id: string; label: string; href: string }[] {
  return tree.flatMap((node) => {
    const href = firstLeafHref(node);
    return href === null ? [] : [{ id: node.id, label: node.label, href }];
  });
}

/**
 * The nav-tree href a pathname belongs to.
 *
 * An entry's Releases tab (`/<locale>/<group>/<slug>/releases`) is not a node of
 * its own — it is the same entry as the README tab. `findTrail` matches exact
 * strings (I20), so without this the sidebar empties and no top tab lights up
 * on every Releases page, with nothing erroring.
 */
export function navHref(pathname: string): string {
  return pathname.replace(/^(\/[^/]+\/(?:apps|games)\/[^/]+)\/releases$/, "$1");
}
