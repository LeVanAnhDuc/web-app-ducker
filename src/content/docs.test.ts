import { describe, expect, it } from "vitest";
import { buildToc, getDocPage } from "./docs";

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
});

describe("getDocPage", () => {
  it("returns null for an unknown slug", async () => {
    expect(await getDocPage("nope", "vi")).toBeNull();
  });
});
