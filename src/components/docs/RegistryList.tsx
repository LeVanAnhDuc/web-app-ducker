import { Badge } from "@/components/ui/Badge";
import type { AppCard, Integration } from "@/content";
import styles from "./RegistryList.module.css";

export type RegistryListProps = {
  entries: AppCard[];
  /** `/vi/apps` or `/vi/games`; each row links to `${basePath}/${slug}`. */
  basePath: string;
  /** Translated status labels — a raw integration key is never shown. */
  statusLabels: Record<Integration, string>;
};

/**
 * The overview list: one hairline-ruled row per entry (MASTER.md §4 — the
 * registry row, not a card grid). A `connected` entry with a `parent` is drawn
 * as a branch under it, the one place the ecosystem's structure is visible.
 */
export function RegistryList({ entries, basePath, statusLabels }: RegistryListProps) {
  return (
    <ul className={styles.list} role="list">
      {entries.map((entry) => (
        <li key={entry.slug} className={styles.item} role="listitem">
          <a className={styles.row} href={`${basePath}/${entry.slug}`} data-branch={entry.parent ? "yes" : "no"}>
            <span className={styles.swatch} data-status={entry.integration} aria-hidden="true" />
            <span className={styles.text}>
              <span className={styles.name}>{entry.name}</span>
              {entry.tagline ? (
                <span className={styles.tagline} data-testid="tagline">
                  {entry.tagline}
                </span>
              ) : null}
            </span>
            <span className={styles.slug}>{entry.slug}</span>
            <Badge kind={entry.integration}>{statusLabels[entry.integration]}</Badge>
          </a>
        </li>
      ))}
    </ul>
  );
}
