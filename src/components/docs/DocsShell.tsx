import type { ReactNode } from "react";
import styles from "./DocsShell.module.css";

export type DocsShellProps = {
  /** Left column. When omitted, the grid reserves no space for it. */
  sidebar?: ReactNode;
  /** Middle column: the article content. */
  main: ReactNode;
  /** Right column. When omitted, the grid reserves no space for it. */
  toc?: ReactNode;
};

/**
 * Three-column layout of every docs page: navigation · content · table of
 * contents. Shared by app pages and guide pages.
 *
 * The data decides the column count, not a fixed layout: a page with no table
 * of contents gets a two-column grid rather than an empty 178px strip on the
 * right. Callers pass `undefined` when there is nothing to render — `Toc`
 * returns `null` when empty, but the element still exists in the tree, so the
 * grid cannot tell on its own.
 *
 * At 980px all three collapse into one column: the table of contents moves to
 * the top of the article and the navigation column is hidden entirely — the
 * caller renders `NavDrawer` at the top of the article in its place. The
 * `sidebar` prop is passed the same at every width; only CSS decides which
 * widths show it.
 */
export function DocsShell({ sidebar, main, toc }: DocsShellProps) {
  return (
    <div
      className={styles.shell}
      data-sidebar={sidebar ? "yes" : "no"}
      data-toc={toc ? "yes" : "no"}
    >
      {sidebar ? <div className={styles.sidebarSlot}>{sidebar}</div> : null}
      <div className={styles.mainSlot}>{main}</div>
      {toc ? <div className={styles.tocSlot}>{toc}</div> : null}
    </div>
  );
}
