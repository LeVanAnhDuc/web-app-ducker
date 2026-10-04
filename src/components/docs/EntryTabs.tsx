import styles from "./EntryTabs.module.css";

export type EntryTabsProps = {
  /** Accessible name of the strip, e.g. "Nội dung của Ducker ID". */
  label: string;
  readmeHref: string;
  releasesHref: string;
  current: "readme" | "releases";
  labels: { readme: string; releases: string };
};

/**
 * README · Releases. Real links to two URLs (ADR-0023): no client state, each tab
 * statically rendered, either one shareable.
 */
export function EntryTabs({ label, readmeHref, releasesHref, current, labels }: EntryTabsProps) {
  return (
    <nav className={styles.tabs} aria-label={label}>
      <a className={styles.tab} href={readmeHref} aria-current={current === "readme" ? "page" : undefined}>
        {labels.readme}
      </a>
      <a className={styles.tab} href={releasesHref} aria-current={current === "releases" ? "page" : undefined}>
        {labels.releases}
      </a>
    </nav>
  );
}
