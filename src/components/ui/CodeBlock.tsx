import styles from "./CodeBlock.module.css";

export type CodeBlockProps = {
  /** Highlighted, sanitized HTML produced by `renderMarkdown`. */
  html: string;
  /** Name of the scroll box, used as its accessible name. */
  label?: string;
  className?: string;
};

/**
 * Wraps a highlighted code block in its own horizontal scroll box.
 * `html` must be sanitized in the markdown layer before it gets here.
 */
export function CodeBlock({ html, label = "Khối mã", className }: CodeBlockProps) {
  return (
    <div
      className={className ? `${styles.scroll} ${className}` : styles.scroll}
      role="region"
      aria-label={label}
      tabIndex={0}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
