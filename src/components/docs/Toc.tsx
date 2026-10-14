import type { TocItem } from "@/content";
import styles from "./Toc.module.css";

export type TocProps = {
  /** Table of contents built in the data layer; anchors already checked for uniqueness. */
  items: TocItem[];
  /** Block heading, already translated, e.g. "Trong trang". */
  title: string;
};

/**
 * On-page table of contents — the right column on wide screens, a collapsible
 * block at the top of the article on phones.
 *
 * Two decisions worth recording:
 *
 * 1. **No items means nothing is rendered.** An empty frame headed "Trong
 *    trang" looks like a broken table of contents, not a short page.
 * 2. **`<details open>` rather than two copies for two screen sizes.** One list
 *    of links serves both layouts, so one copy can never have an entry the other
 *    lacks. Open by default: the reader sees the article's structure at once,
 *    and the page still works before JavaScript loads.
 */
export function Toc({ items, title }: TocProps) {
  if (items.length === 0) return null;

  return (
    <nav className={styles.toc} aria-label={title}>
      <details className={styles.box} open>
        <summary className={styles.summary}>{title}</summary>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.anchor}>
              <a className={styles.link} href={`#${item.anchor}`}>
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
