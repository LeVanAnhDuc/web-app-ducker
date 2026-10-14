import type { ReactNode } from "react";
import styles from "./DataTable.module.css";

export type DataTableProps = {
  /** Table content: `<caption>`, `<thead>`, `<tbody>`. */
  children: ReactNode;
  /** Name of the scroll box, used as its accessible name. */
  label?: string;
  className?: string;
};

/** Data table, always inside its own horizontal scroll box. */
export function DataTable({ children, label = "Bảng dữ liệu", className }: DataTableProps) {
  return (
    <div
      className={className ? `${styles.scroll} ${className}` : styles.scroll}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      <table className={styles.table}>{children}</table>
    </div>
  );
}
