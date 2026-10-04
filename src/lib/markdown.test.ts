// src/lib/markdown.test.ts
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { attachHeadingIds, renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("dựng tiêu đề và đoạn văn", async () => {
    expect(await renderMarkdown("## Tính năng\n\nNội dung.")).toContain("<h2");
  });

  it("loại bỏ thẻ script — nội dung hôm nay một người viết, mai nhiều người", async () => {
    const html = await renderMarkdown('Xin chào <script>alert(1)</script>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
  });

  it("loại bỏ handler nội tuyến", async () => {
    expect(await renderMarkdown('<img src="x" onerror="alert(1)">')).not.toContain("onerror");
  });

  it("chặn liên kết javascript:", async () => {
    expect(await renderMarkdown("[bấm](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("giữ bảng GFM", async () => {
    const html = await renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<table");
  });

  it("tô màu khối mã", async () => {
    const html = await renderMarkdown("```bash\npnpm install\n```");
    expect(html).toContain("<pre");
    expect(html).toContain("pnpm install");
  });

  it("giữ nguyên dấu tiếng Việt", async () => {
    expect(await renderMarkdown("Biến môi trường của ứng dụng")).toContain("Biến môi trường của ứng dụng");
  });
});

// Canh hợp đồng giữa markdown và CSS. Thêm sau khi xem tận mắt phát hiện khối mã
// ra đơn sắc: globals.css viết selector `.shiki` theo phỏng đoán, mà markup thật
// không có class đó. CSS không khớp thì không báo lỗi, nên phải có test.
describe("hợp đồng với globals.css", () => {
  it("token mang biến màu trên phần tử mà selector của globals.css khớp", async () => {
    const html = await renderMarkdown("```bash\npnpm install\n```");
    // Biến màu nằm ở `style` nội tuyến, không phải class.
    expect(html).toContain("--shiki-light");
    expect(html).toContain("--shiki-dark");
    // Và phần tử bọc chúng phải mang `data-theme` — đó là chỗ CSS bám vào.
    expect(html).toMatch(/<code[^>]*data-theme=/);
  });

  it("không sinh class `shiki` — đừng viết CSS bám vào nó", async () => {
    const html = await renderMarkdown("```bash\npnpm install\n```");
    expect(html).not.toMatch(/class="[^"]*\bshiki\b/);
  });

  it("globals.css bám vào code[data-theme], không bám vào .shiki", () => {
    const css = readFileSync("src/styles/globals.css", "utf8");
    expect(css).toContain("code[data-theme]");
    expect(css).not.toMatch(/^\s*\.shiki[\s,{]/m);
  });
});

describe("attachHeadingIds", () => {
  it("stamps each h2 with the matching TOC anchor, in document order", async () => {
    const html = await renderMarkdown("## First\n\nA.\n\n## Second\n\nB.");
    const stamped = attachHeadingIds(html, [{ anchor: "first" }, { anchor: "second" }]);
    expect(stamped).toContain('<h2 id="first">');
    expect(stamped).toContain('<h2 id="second">');
  });

  it("leaves the html untouched when there is no TOC", async () => {
    const html = await renderMarkdown("Nội dung không có tiêu đề.");
    expect(attachHeadingIds(html, [])).toBe(html);
  });

  it("leaves an unmatched heading alone rather than guess an anchor", async () => {
    const html = await renderMarkdown("## First\n\nA.\n\n## Second\n\nB.");
    // Fewer TOC entries than headings should not happen in practice, but the
    // second heading must stay as-is rather than receive a wrong id.
    const stamped = attachHeadingIds(html, [{ anchor: "first" }]);
    expect(stamped).toContain('<h2 id="first">');
    expect(stamped).toContain("<h2>Second</h2>");
  });
});

describe("renderMarkdown options", () => {
  it("passes every link and image URL through rewriteUrl with its kind", async () => {
    const seen: string[] = [];
    await renderMarkdown("[a](docs/a.md) ![s](shot.png)\n\n[ref][r]\n\n[r]: other.md", {
      rewriteUrl: (url, kind) => {
        seen.push(`${kind} ${url}`);
        return `https://example.test/${url}`;
      },
    });
    expect(seen.sort()).toEqual(["image shot.png", "link docs/a.md", "link other.md"]);
  });

  it("emits the rewritten URLs", async () => {
    const html = await renderMarkdown("[a](docs/a.md) ![s](shot.png)", {
      rewriteUrl: (url) => `https://example.test/${url}`,
    });
    expect(html).toContain('href="https://example.test/docs/a.md"');
    expect(html).toContain('src="https://example.test/shot.png"');
  });

  it("drops only the first top-level H1", async () => {
    const html = await renderMarkdown("# Project\n\nIntro\n\n# Second\n\n## Part", { dropFirstH1: true });
    expect(html).not.toContain("Project");
    expect(html).toContain("<h1>Second</h1>");
    expect(html).toContain("<h2>Part</h2>");
  });

  it("changes nothing without options", async () => {
    const html = await renderMarkdown("# Project\n\n[a](docs/a.md)");
    expect(html).toContain("<h1>Project</h1>");
    expect(html).toContain('href="docs/a.md"');
  });
});
