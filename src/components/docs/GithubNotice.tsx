import styles from "./GithubNotice.module.css";

export type GithubNoticeProps = {
  /** `empty` is a fact (no releases yet); `unavailable` is a failure worth announcing. */
  tone: "empty" | "unavailable";
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
};

export function GithubNotice({ tone, title, body, actionLabel, actionHref }: GithubNoticeProps) {
  return (
    <div className={styles.notice} data-tone={tone} role={tone === "unavailable" ? "status" : undefined}>
      <p className={styles.title}>{title}</p>
      <p className={styles.body}>{body}</p>
      <a className={styles.action} href={actionHref} rel="noreferrer" target="_blank">
        {actionLabel}
      </a>
    </div>
  );
}
