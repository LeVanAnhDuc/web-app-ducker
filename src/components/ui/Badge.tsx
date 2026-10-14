import type { ReactNode } from "react";
import styles from "./Badge.module.css";

/** The five integration statuses shared across the site — see design-rules §2. */
export type StatusKind = "core" | "connected" | "planned" | "standalone" | "private";

export type BadgeProps = {
  kind: StatusKind;
  children: ReactNode;
  className?: string;
};

/**
 * Status badge. CSS picks the colour via `[data-kind]`; the component knows no
 * colour values — changing a status colour only touches `tokens.css`.
 */
export function Badge({ kind, children, className }: BadgeProps) {
  return (
    <span className={className ? `${styles.badge} ${className}` : styles.badge} data-kind={kind}>
      {children}
    </span>
  );
}
