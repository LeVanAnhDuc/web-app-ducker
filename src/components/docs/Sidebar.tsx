import type { NavTreeNode } from "@/content/nav-tree";
import { NavTree } from "./NavTree";
import styles from "./Sidebar.module.css";

export type SidebarProps = {
  /**
   * Descendants of the open tab. Callers get them via
   * `findTrail(tree, activeHref)[0]?.children` — the root node is the top tab
   * strip, so it is not repeated here.
   */
  nodes: NavTreeNode[];
  /** Path of the current page, to mark the entry being viewed. */
  activeHref: string;
  /** Accessible name of the navigation region, already translated. */
  label: string;
};

/**
 * Left navigation column of a docs page.
 *
 * Now just a shell: a named `<nav>` wrapping `NavTree`. This component used to
 * take flat `groups`, with callers hard-coding the two groups "Lõi" and "Ứng
 * dụng vệ tinh"; now the structure comes from the navigation tree, so no code
 * knows any group name.
 *
 * No nodes means nothing is rendered — an empty column with a right border only
 * looks like a broken interface. That is also the path when a page is not
 * attached to the tree.
 */
export function Sidebar({ nodes, activeHref, label }: SidebarProps) {
  if (nodes.length === 0) return null;

  return (
    <nav className={styles.side} aria-label={label}>
      <NavTree nodes={nodes} activeHref={activeHref} />
    </nav>
  );
}
