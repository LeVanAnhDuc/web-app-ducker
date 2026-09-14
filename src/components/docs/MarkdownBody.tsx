import { CodeBlock } from "@/components/ui/CodeBlock";
// Reuses SectionBody's stylesheet on purpose: the file-backed content model
// (ADR-0018) has one flat markdown body per page instead of a list of CMS
// `Section` records, so `SectionBody.tsx` (the per-section component, with its
// own heading, anchor and fallback notice) is gone — but the prose/code/table
// classes it drew from predate that model and still describe exactly the
// markup this component produces. Reusing the class names avoids inventing a
// second, near-identical stylesheet for the same shapes (constraint: no new CSS
// in this task).
import styles from "./SectionBody.module.css";

export type MarkdownBodyLabels = {
  /** Tên gọi hộp cuộn của khối mã, cho trình đọc màn hình. */
  code: string;
  /** Tên gọi hộp cuộn của bảng. */
  table: string;
};

export type MarkdownBodyProps = {
  /** HTML đã kết xuất và sanitize từ `renderMarkdown`, headings đã gắn id. */
  html: string;
  labels: MarkdownBodyLabels;
};

/** A slice of the body once code blocks and tables that need their own scroll box are split out. */
type Part =
  | { kind: "prose"; html: string; key: string }
  | { kind: "code"; html: string; key: string }
  | { kind: "table"; html: string; key: string };

/**
 * Code blocks (the `<figure>` rehype-pretty-code produces) and GFM tables
 * (`<table>`) sit at the outer level of the rendered HTML, never nested inside
 * one another, so a regular expression is enough to split them out — no need
 * to rebuild the DOM tree.
 */
const SCROLLABLE_BLOCK = /<figure data-rehype-pretty-code-figure(?:="")?>[\s\S]*?<\/figure>|<table>[\s\S]*?<\/table>/g;

/**
 * rehype-pretty-code already puts `tabindex="0"` on `<pre>`; `CodeBlock` also
 * takes focus on its own wrapper. Keeping both turns every code block into two
 * Tab stops for the same scroll region. Drop the inner one, keep the one with
 * `role="region"` and a name.
 */
function dropInnerTabIndex(html: string): string {
  return html.replace(/(<pre\b[^>]*?)\stabindex="0"/g, "$1");
}

function splitParts(html: string): Part[] {
  const parts: Part[] = [];
  let cursor = 0;

  for (const match of html.matchAll(SCROLLABLE_BLOCK)) {
    const start = match.index;
    if (start > cursor) {
      parts.push({ kind: "prose", html: html.slice(cursor, start), key: `p${cursor}` });
    }

    parts.push({
      kind: match[0].startsWith("<table") ? "table" : "code",
      html: match[0],
      key: `b${start}`,
    });
    cursor = start + match[0].length;
  }

  if (cursor < html.length) {
    parts.push({ kind: "prose", html: html.slice(cursor), key: `p${cursor}` });
  }

  return parts;
}

/**
 * The rendered body of an app or doc page (R3): one call per page instead of
 * one `SectionBody` per CMS section, since there is only one markdown body to
 * render now. Markdown is rendered server-side by the caller (`renderMarkdown`)
 * and passed in as `html` — this component only splits it into scrollable
 * parts and wraps them.
 */
export function MarkdownBody({ html, labels }: MarkdownBodyProps) {
  return (
    <>
      {splitParts(html).map((part) => {
        if (part.kind === "code") {
          return (
            <CodeBlock
              key={part.key}
              className={styles.code}
              html={dropInnerTabIndex(part.html)}
              label={labels.code}
            />
          );
        }

        if (part.kind === "table") {
          return (
            <div
              key={part.key}
              className={styles.tableScroll}
              role="region"
              aria-label={labels.table}
              tabIndex={0}
              dangerouslySetInnerHTML={{ __html: part.html }}
            />
          );
        }

        return (
          <div
            key={part.key}
            className={styles.prose}
            // HTML has already been through sanitize in `renderMarkdown`; this is
            // that pipeline's own output, not a string sent straight from a user.
            dangerouslySetInnerHTML={{ __html: part.html }}
          />
        );
      })}
    </>
  );
}
