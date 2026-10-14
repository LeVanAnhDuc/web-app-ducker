// src/lib/markdown.test.ts
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { attachHeadingIds, renderMarkdown, renderMarkdownWithToc } from "./markdown";

describe("renderMarkdown", () => {
  it("renders headings and paragraphs", async () => {
    expect(await renderMarkdown("## Tính năng\n\nNội dung.")).toContain("<h2");
  });

  it("strips script tags — content has one author today, many tomorrow", async () => {
    const html = await renderMarkdown('Xin chào <script>alert(1)</script>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
  });

  it("strips inline handlers", async () => {
    expect(await renderMarkdown('<img src="x" onerror="alert(1)">')).not.toContain("onerror");
  });

  it("blocks javascript: links", async () => {
    expect(await renderMarkdown("[bấm](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("keeps GFM tables", async () => {
    const html = await renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<table");
  });

  it("highlights code blocks", async () => {
    const html = await renderMarkdown("```bash\npnpm install\n```");
    expect(html).toContain("<pre");
    expect(html).toContain("pnpm install");
  });

  it("preserves Vietnamese diacritics", async () => {
    expect(await renderMarkdown("Biến môi trường của ứng dụng")).toContain("Biến môi trường của ứng dụng");
  });
});

// Guards the contract between the markdown output and the CSS. Added after looking
// at the page revealed monochrome code blocks: globals.css targeted `.shiki` by guess,
// and the real markup has no such class. Mismatched CSS raises no error, so a test must.
describe("contract with globals.css", () => {
  it("tokens carry the colour variables on the element the globals.css selector matches", async () => {
    const html = await renderMarkdown("```bash\npnpm install\n```");
    // The colour variables live in the inline `style`, not in a class.
    expect(html).toContain("--shiki-light");
    expect(html).toContain("--shiki-dark");
    // And their wrapper must carry `data-theme` — that is what the CSS hooks onto.
    expect(html).toMatch(/<code[^>]*data-theme=/);
  });

  it("emits no `shiki` class — do not write CSS against it", async () => {
    const html = await renderMarkdown("```bash\npnpm install\n```");
    expect(html).not.toMatch(/class="[^"]*\bshiki\b/);
  });

  it("globals.css targets code[data-theme], not .shiki", () => {
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

describe("renderMarkdownWithToc", () => {
  it("takes the TOC from the rendered h2s, so anchors cannot drift (third-party READMEs)", async () => {
    const md = [
      "<!-- ## Hidden -->",
      "",
      "Setext",
      "------",
      "",
      "> ## Quoted",
      "",
      "## Install",
    ].join("\n");
    const { html, toc } = await renderMarkdownWithToc(md);
    expect(toc.map((t) => t.title)).toEqual(["Setext", "Quoted", "Install"]);
    expect(html).toContain('<h2 id="install">Install</h2>');
    expect(html).toContain('<h2 id="setext">Setext</h2>');
    expect(html).not.toContain('id="hidden"');
  });

  it("disambiguates repeated headings the way buildToc does", async () => {
    const { toc } = await renderMarkdownWithToc("## Cài đặt\n\n## Cài đặt\n\n## Cài đặt 2");
    expect(toc.map((t) => t.anchor)).toEqual(["cai-dat", "cai-dat-2", "cai-dat-2-2"]);
  });

  it("still applies the README options", async () => {
    const { html } = await renderMarkdownWithToc("# Title\n\n## Part", { dropFirstH1: true });
    expect(html).not.toContain("Title");
  });
});
