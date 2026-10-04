import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

import { createAnchorAllocator } from "./slug";

/**
 * Kết xuất Markdown thành HTML đã sanitize, khối mã đã tô màu.
 *
 * Nội dung hôm nay do một người viết, nhưng khi nối IDMS sẽ là nhiều người.
 * Lúc đó không ai nhớ quay lại thêm sanitize, nên sanitize nằm sẵn trong
 * đường ống ngay từ đầu.
 */

// ---------------------------------------------------------------------------
// 1. Bỏ HTML thô trong Markdown
// ---------------------------------------------------------------------------

/**
 * Thẻ mà nội dung bên trong cũng phải biến mất, không chỉ riêng cặp thẻ.
 * `<script>alert(1)</script>` mà chỉ bỏ hai thẻ thì chuỗi `alert(1)` còn lại
 * dưới dạng văn bản — vô hại nhưng bẩn, và cho thấy bộ lọc chưa hiểu cấu trúc.
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

/** Hình dạng tối thiểu của một nút mdast mà bộ lọc cần biết. */
type MdastNode = { type: string; value?: unknown; children?: unknown };

const closingTagPattern = (tag: string) => new RegExp(`</\\s*${tag}\\s*>`, "i");

/**
 * Xoá mọi nút `html` khỏi cây mdast, kèm nội dung nằm giữa cặp thẻ nguy hiểm.
 *
 * `remark-rehype` mặc định đã bỏ nút `html`, nhưng nó chỉ bỏ đúng nút đó —
 * văn bản kẹp giữa `<script>` và `</script>` vẫn sống sót vì đó là nút `text`
 * riêng. Hàm này quét theo cặp thẻ nên dọn được cả phần thân.
 */
function stripRawHtml(node: MdastNode): void {
  if (!Array.isArray(node.children)) return;

  const kept: MdastNode[] = [];
  /** Đang ở trong cặp thẻ nguy hiểm nào, `null` là không ở trong cặp nào. */
  let insideTag: string | null = null;

  for (const child of node.children as MdastNode[]) {
    if (child.type === "html") {
      const raw = String(child.value ?? "");

      if (insideTag) {
        if (closingTagPattern(insideTag).test(raw)) insideTag = null;
        continue;
      }

      const openTag = /^<\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(raw)?.[1]?.toLowerCase();
      // Khối HTML gọn trong một nút (`<script>…</script>`) không mở cặp mới.
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
 * Shiki tô màu bằng cách bọc từng token trong `<span>` mang `style`, và
 * rehype-pretty-code bọc khối mã trong `<figure>` kèm các thuộc tính `data-*`.
 * Schema mặc định của rehype-sanitize (theo GitHub) không biết những thứ đó:
 * nó không có `figure`, chỉ cho `className` dạng `language-*` trên `code`, và
 * không cho `style` ở bất cứ đâu. Vì sanitize chạy **sau** khi tô màu, giữ
 * nguyên schema mặc định sẽ xoá sạch màu vừa sinh ra.
 *
 * Nới lỏng chỉ đúng những gì đường ống của chính ta tạo ra. `<script>`,
 * handler nội tuyến và giao thức `javascript:` vẫn bị chặn như cũ.
 */
const codeAttributes = ["className", "style", "data*"];

const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "figure", "figcaption"],
  attributes: {
    ...defaultSchema.attributes,
    // Thay hẳn định nghĩa cũ `[["className", /^language-./]]`: sanitize lấy
    // định nghĩa **đầu tiên** khớp tên, nên để lại bản hạn chế thì bản rộng
    // phía sau không bao giờ được dùng.
    code: [...codeAttributes],
    pre: [...codeAttributes, "tabIndex"],
    span: [...codeAttributes],
    figure: [...codeAttributes],
    figcaption: [...codeAttributes],
    div: [...(defaultSchema.attributes?.div ?? []), ...codeAttributes],
  },
};

// ---------------------------------------------------------------------------
// 3. Đường ống
// ---------------------------------------------------------------------------

/**
 * Hai chủ đề sinh ra biến CSS `--shiki-light` / `--shiki-dark` thay vì mã màu
 * cứng, đúng quy tắc "mọi màu qua biến CSS" và ba trạng thái chủ đề của
 * design-rules. CSS toàn cục cần một lần khai báo:
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
  // Nền do token thiết kế quyết định, không để chủ đề shiki ghi đè.
  keepBackground: false,
  defaultLang: "plaintext",
  transformers: [
    {
      name: "keep-source",
      /**
       * Shiki cắt mã thành từng token nằm trong `<span>` riêng, nên `pnpm install`
       * không còn là một chuỗi liền trong HTML. Giữ lại mã nguyên bản trên `<pre>`
       * để nút Sao chép và chỉ mục tìm kiếm vẫn lấy được đúng những gì tác giả gõ.
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
