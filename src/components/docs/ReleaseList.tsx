import styles from "./ReleaseList.module.css";

export type ReleaseItem = {
  tag: string;
  name: string | null;
  /** Already formatted in the page's locale. */
  dateLabel: string;
  /** TOC target, unique per page. */
  anchor: string;
  /** Sanitised HTML of the release notes; may be empty. */
  html: string;
};

export type ReleaseListProps = { releases: ReleaseItem[]; latestLabel: string };

/** Newest first; only the newest open (spec D4). Native `<details>`, so it works with no JavaScript. */
export function ReleaseList({ releases, latestLabel }: ReleaseListProps) {
  return (
    <div className={styles.list}>
      {releases.map((release, index) => (
        <details key={release.tag} id={release.anchor} className={styles.release} open={index === 0}>
          <summary className={styles.summary}>
            <span className={styles.tag}>{release.tag}</span>
            {release.name ? <span className={styles.name}>{release.name}</span> : null}
            {index === 0 ? <span className={styles.latest}>{latestLabel}</span> : null}
            <span className={styles.spacer} />
            <span className={styles.date}>{release.dateLabel}</span>
          </summary>
          {release.html ? (
            <div className={styles.notes} dangerouslySetInnerHTML={{ __html: release.html }} />
          ) : null}
        </details>
      ))}
    </div>
  );
}
