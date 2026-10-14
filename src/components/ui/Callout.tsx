import type { ReactNode } from "react";
import styles from "./Callout.module.css";

export type CalloutTone = "note" | "warning";

export type CalloutProps = {
  tone?: CalloutTone;
  /** Short label at the top of the block, e.g. "Lưu ý" or "Trạng thái". */
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Note block. Use `tone="warning"` when the page describes something that does not
 * exist yet — design-rules §7 requires being honest about the current state.
 */
export function Callout({ tone = "note", title, children, className }: CalloutProps) {
  return (
    <aside
      className={className ? `${styles.callout} ${className}` : styles.callout}
      data-tone={tone}
    >
      {title ? <strong className={styles.title}>{title}</strong> : null}
      <div className={styles.body}>{children}</div>
    </aside>
  );
}
