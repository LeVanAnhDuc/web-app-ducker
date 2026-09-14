import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildToc, getDocPage, listDocs } from "./docs";

describe("buildToc", () => {
  it("takes level-2 headings only", () => {
    const toc = buildToc("# Title\n\n## One\n\ntext\n\n### Deep\n\n## Two\n");
    expect(toc).toEqual([
      { anchor: "one", title: "One" },
      { anchor: "two", title: "Two" },
    ]);
  });

  it("disambiguates a repeated heading instead of emitting a duplicate anchor", () => {
    const toc = buildToc("## Cài đặt\n\n## Cài đặt\n");
    expect(toc.map((t) => t.anchor)).toEqual(["cai-dat", "cai-dat-2"]);
  });

  it("does not collide an explicit '-2' heading with a disambiguated one", () => {
    // "Cài đặt", "Cài đặt", "Cài đặt 2" naively slugify to
    // ["cai-dat", "cai-dat-2", "cai-dat-2"] — a duplicate, because the counter only
    // disambiguates against other headings sharing the same slug base and never
    // checks anchors already emitted under a different base.
    const toc = buildToc("## Cài đặt\n\n## Cài đặt\n\n## Cài đặt 2\n");
    const anchors = toc.map((t) => t.anchor);
    expect(anchors).toHaveLength(3);
    expect(new Set(anchors).size).toBe(3);
    expect(anchors[0]).toBe("cai-dat");
  });

  it("disambiguates the same heading repeated three times", () => {
    const toc = buildToc("## Cài đặt\n\n## Cài đặt\n\n## Cài đặt\n");
    expect(toc.map((t) => t.anchor)).toEqual(["cai-dat", "cai-dat-2", "cai-dat-3"]);
  });

  it("ignores a '##' line inside a fenced code block", () => {
    const markdown = [
      "## Before",
      "",
      "```bash",
      "## install dependencies",
      "pnpm install",
      "```",
      "",
      "## After",
      "",
    ].join("\n");
    const toc = buildToc(markdown);
    expect(toc).toEqual([
      { anchor: "before", title: "Before" },
      { anchor: "after", title: "After" },
    ]);
  });

  it("falls back to a stable non-empty anchor for a symbol-only heading", () => {
    const toc = buildToc("## ???\n");
    expect(toc).toHaveLength(1);
    expect(toc[0]!.anchor).not.toBe("");
    expect(toc[0]!.anchor.length).toBeGreaterThan(0);
  });
});

describe("getDocPage", () => {
  it("returns null for an unknown slug", async () => {
    expect(await getDocPage("nope", "vi")).toBeNull();
  });
});

let fixtureRoot: string;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "ducker-docs-"));
  mkdirSync(join(fixtureRoot, "docs"), { recursive: true });
  const write = (f: string, name: string, order: number) =>
    writeFileSync(
      join(fixtureRoot, "docs", f),
      `---\nname: ${name}\nstatus: core\norder: ${order}\n---\n## Heading\nDoc body.`,
    );
  write("getting-started.vi.mdx", "Getting Started", 10);
  write("getting-started.en.mdx", "Getting Started", 10);
  write("faq.vi.mdx", "Frequently Asked Questions", 20);
  write("api-reference.en.mdx", "API Reference", 30); // en only
});

describe("listDocs", () => {
  it("returns each doc with its slug and authored title", async () => {
    const docs = await listDocs("vi", fixtureRoot);
    expect(docs).toEqual([
      { slug: "getting-started", title: "Getting Started" },
      { slug: "faq", title: "Frequently Asked Questions" },
    ]);
  });

  it("uses the fallback locale when the requested locale is not available", async () => {
    const docs = await listDocs("en", fixtureRoot);
    // faq only exists in vi, so it falls back to the default locale
    expect(docs.map((d) => d.slug)).toEqual(["getting-started", "faq", "api-reference"]);
  });

  it("maintains the order from the frontmatter", async () => {
    const docs = await listDocs("vi", fixtureRoot);
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0]?.slug).toBe("getting-started");
  });
});
