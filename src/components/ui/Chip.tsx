import type { ReactNode } from "react";
import styles from "./Chip.module.css";

export type ChipProps = {
  children: ReactNode;
  className?: string;
};

/** Neutral secondary label: technology name, permission scope, keyword. */
export function Chip({ children, className }: ChipProps) {
  return (
    <span className={className ? `${styles.chip} ${className}` : styles.chip}>{children}</span>
  );
}
