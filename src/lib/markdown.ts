import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

import { createAnchorAllocator } from "./slug";

/**
 * Renders Markdown to sanitised HTML with highlighted code blocks.
 *
 * Content has one author today, but will have many if it is ever opened up.
 * By then nobody remembers to come back and add sanitising, so it sits in the
 * pipeline from the start.
 */

// ---------------------------------------------------------------------------
// 1. Drop raw HTML from the Markdown
// ---------------------------------------------------------------------------

/**
 * Tags whose inner content must disappear too, not just the tag pair.
 * Removing only the two tags of `<script>alert(1)</script>` leaves `alert(1)` behind
 * as text — harmless but dirty, and a sign the filter does not understand structure.
 */
const DANGEROUS_RAW_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "noscript",
  "template",
  "textarea",
  "form",
  "svg",
  "math",
]);

/** The minimal shape of an mdast node that the filter needs to know. */
type MdastNode = { type: string; value?: unknown; children?: unknown };

const closingTagPattern = (tag: string) => new RegExp(`</\\s*${tag}\\s*>`, "i");

/**
 * Removes every `html` node from the mdast tree, plus the content between dangerous tag pairs.
 *
 * `remark-rehype` already drops `html` nodes by default, but only that node —
 * the text between `<script>` and `</script>` survives because it is a separate
 * `text` node. This function scans by tag pair, so it clears the body as well.
 */
function stripRawHtml(node: MdastNode): void {
  if (!Array.isArray(node.children)) return;

  const kept: MdastNode[] = [];
  /** Which dangerous tag pair we are inside; `null` means none. */
  let insideTag: string | null = null;

  for (const child of node.children as MdastNode[]) {
    if (child.type === "html") {
      const raw = String(child.value ?? "");

      if (insideTag) {
        if (closingTagPattern(insideTag).test(raw)) insideTag = null;
        continue;
      }

      const openTag = /^<\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(raw)?.[1]?.toLowerCase();
      // An HTML block contained in one node (`<script>…</script>`) does not open a new pair.
      if (openTag && DANGEROUS_RAW_TAGS.has(openTag) && !closingTagPattern(openTag).test(raw)) {
        insideTag = openTag;
      }
      continue;
    }

    if (insideTag) continue;

    stripRawHtml(child);
    kept.push(child);
  }

  node.children = kept;
}

function remarkStripRawHtml() {
  return (tree: unknown) => {
    stripRawHtml(tree as MdastNode);
  };
}

// ---------------------------------------------------------------------------
// 2. Schema sanitize
// ---------------------------------------------------------------------------

/**
 * Shiki highlights by wrapping each token in a `<span>` carrying `style`, and
 * rehype-pretty-code wraps the code block in a `<figure>` with `data-*` attributes.
 * rehype-sanitize's default schema (GitHub's) knows none of that: it has no
 * `figure`, only allows `className` of the form `language-*` on `code`, and
 * allows `style` nowhere. Since sanitising runs **after** highlighting, keeping
 * the default schema would wipe out the colours just produced.
 *
 * Loosen exactly what our own pipeline produces and nothing more. `<script>`,
 * inline handlers and the `javascript:` protocol are still blocked as before.
 */
const codeAttributes = ["className", "style", "data*"];

const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "figure", "figcaption"],
  attributes: {
    ...defaultSchema.attributes,
    // Replace the old `[["className", /^language-./]]` definition outright: sanitize
    // uses the **first** definition matching the name, so leaving the restrictive one
    // in place means the broader one after it is never used.
    code: [...codeAttributes],
    pre: [...codeAttributes, "tabIndex"],
    span: [...codeAttributes],
    figure: [...codeAttributes],
    figcaption: [...codeAttributes],
    div: [...(defaultSchema.attributes?.div ?? []), ...codeAttributes],
  },
};

// ---------------------------------------------------------------------------
// 3. Pipeline
// ---------------------------------------------------------------------------

/**
 * Two themes emit the CSS variables `--shiki-light` / `--shiki-dark` instead of
 * hard-coded colours, in line with the "every colour through a CSS variable" rule
 * and the three theme states. Global CSS needs one declaration:
 *
 * ```css
 * .shiki, .shiki span { color: var(--shiki-light); }
 * @media (prefers-color-scheme: dark) {
 *   :root:not([data-theme="light"]) .shiki,
 *   :root:not([data-theme="light"]) .shiki span { color: var(--shiki-dark); }
 * }
 * :root[data-theme="dark"] .shiki,
 * :root[data-theme="dark"] .shiki span { color: var(--shiki-dark); }
 * ```
 */
const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark" },
  // The design tokens own the background; the shiki theme must not override it.
  keepBackground: false,
  defaultLang: "plaintext",
  transformers: [
    {
      name: "keep-source",
      /**
       * Shiki splits code into tokens, each in its own `<span>`, so `pnpm install`
       * is no longer one contiguous string in the HTML. Keep the original source on `<pre>`
       * so the Copy button and the search index still get exactly what the author typed.
       */
      pre(node) {
        node.properties["data-code"] = this.source;
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 3b. README transforms (ADR-0023)
// ---------------------------------------------------------------------------

export type RenderOptions = {
  /** Called for every link, image and reference definition. README-relative URLs need it. */
  rewriteUrl?: (url: string, kind: "link" | "image") => string;
  /** The README's own title repeats the page hero; drop the first top-level H1. */
  dropFirstH1?: boolean;
};

type UrlNode = { type: string; url?: unknown; depth?: unknown; children?: unknown };

function rewriteUrls(node: UrlNode, rewrite: NonNullable<RenderOptions["rewriteUrl"]>): void {
  if (typeof node.url === "string") {
    if (node.type === "image") node.url = rewrite(node.url, "image");
    else if (node.type === "link" || node.type === "definition") node.url = rewrite(node.url, "link");
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children as UrlNode[]) rewriteUrls(child, rewrite);
  }
}

function remarkReadme(options: RenderOptions) {
  return (tree: unknown) => {
    const root = tree as UrlNode;
    if (options.dropFirstH1 && Array.isArray(root.children)) {
      const children = root.children as UrlNode[];
      const index = children.findIndex((c) => c.type === "heading" && c.depth === 1);
      if (index >= 0) children.splice(index, 1);
    }
    if (options.rewriteUrl) rewriteUrls(root, options.rewriteUrl);
  };
}

/**
 * Mandatory order: parse → gfm → rehype → highlight → **sanitize** → stringify.
 * Sanitizing before highlighting strips the shiki `<span>`s it just made.
 * The README transform runs on the markdown tree, before any of that, so the
 * sanitizer still sees — and still vets — every rewritten URL.
 */
function createProcessor(options: RenderOptions) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStripRawHtml)
    .use(remarkReadme, options)
    .use(remarkRehype)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify);
}

const defaultProcessor = createProcessor({});

// ---------------------------------------------------------------------------
// 3c. TOC from the rendered tree (READMEs)
// ---------------------------------------------------------------------------

export type RenderedToc = { anchor: string; title: string }[];

type HastNode = { type: string; tagName?: string; value?: unknown; properties?: Record<string, unknown>; children?: unknown };

function textOf(node: HastNode): string {
  if (node.type === "text" && typeof node.value === "string") return node.value;
  return Array.isArray(node.children) ? (node.children as HastNode[]).map(textOf).join("") : "";
}

/**
 * Stamps every rendered `<h2>` with an anchor and records it, in one pass.
 *
 * `buildToc` + `attachHeadingIds` pair a regex scan of the markdown with the
 * Nth rendered `<h2>`. That holds for authored `.mdx`, not for a third-party
 * README: a setext heading, a `## ` inside an HTML comment or a quote makes the
 * two disagree and shifts every later anchor, silently. Reading the headings off
 * the tree the browser will get cannot disagree with it. Runs after the
 * sanitizer, which would otherwise prefix the ids it did not write.
 */
function rehypeCollectToc(toc: RenderedToc) {
  return (tree: unknown) => {
    const anchorFor = createAnchorAllocator();
    const visit = (node: HastNode) => {
      if (node.type === "element" && node.tagName === "h2") {
        const title = textOf(node).trim();
        const anchor = anchorFor(title);
        node.properties = { ...node.properties, id: anchor };
        toc.push({ anchor, title });
        return;
      }
      if (Array.isArray(node.children)) for (const child of node.children as HastNode[]) visit(child);
    };
    visit(tree as HastNode);
  };
}

/** `renderMarkdown`, plus the TOC read off the rendered `<h2>`s — for markdown this site did not write. */
export async function renderMarkdownWithToc(
  md: string,
  options: RenderOptions = {},
): Promise<{ html: string; toc: RenderedToc }> {
  const toc: RenderedToc = [];
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStripRawHtml)
    .use(remarkReadme, options)
    .use(remarkRehype)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeSanitize, schema)
    .use(rehypeCollectToc, toc)
    .use(rehypeStringify);
  const file = await processor.process(md);
  return { html: String(file), toc };
}

/** Markdown → sanitised HTML with highlighted code. Vietnamese diacritics survive. */
export async function renderMarkdown(md: string, options?: RenderOptions): Promise<string> {
  const processor = options ? createProcessor(options) : defaultProcessor;
  const file = await processor.process(md);
  return String(file);
}

// ---------------------------------------------------------------------------
// 4. TOC anchors
// ---------------------------------------------------------------------------

/**
 * Stamps every rendered `<h2>` with the matching table-of-contents anchor, in
 * document order.
 *
 * The file-backed content model (ADR-0018) has one flat markdown body per app
 * or doc page, and `buildToc` (`src/content/docs.ts`) derives the TOC by
 * scanning that same markdown for the same "## " lines, in the same order —
 * skipping anything inside a fenced code block, exactly as a markdown parser
 * would. That makes the Nth `<h2>` produced by `renderMarkdown` always the Nth
 * TOC entry, so this only needs to write the id in order; it never re-derives
 * the slug itself; that stays `buildToc`'s job so the two never disagree.
 *
 * Without this, the anchors `Toc` links to (`#<anchor>`) exist only in the
 * sidebar, not in the rendered page — every TOC link would jump nowhere.
 */
export function attachHeadingIds(html: string, toc: { anchor: string }[]): string {
  if (toc.length === 0) return html;

  let index = 0;
  return html.replace(/<h2(\s[^>]*)?>/g, (match, attrs: string | undefined) => {
    const item = toc[index];
    index += 1;
    // More `<h2>` tags than TOC entries should not happen — `buildToc` scans the
    // very same document — but leave an unmatched heading alone rather than
    // stamp it with the wrong anchor.
    if (!item) return match;
    return `<h2 id="${item.anchor}"${attrs ?? ""}>`;
  });
}
