import { describe, expect, it } from "vitest";
import { absolutizeUrl, type ReadmeLocation } from "./urls";

const root: ReadmeLocation = { repo: { owner: "o", name: "r" }, branch: "main", path: "README.md" };
const nested: ReadmeLocation = { ...root, path: "docs/README.md" };

describe("absolutizeUrl", () => {
  it("points a relative link at the blob view on the README's branch", () => {
    expect(absolutizeUrl("docs/README.md", "link", root)).toBe(
      "https://github.com/o/r/blob/main/docs/README.md",
    );
  });

  it("points a relative image at raw.githubusercontent.com", () => {
    expect(absolutizeUrl("docs/assets/screenshot.png", "image", root)).toBe(
      "https://raw.githubusercontent.com/o/r/main/docs/assets/screenshot.png",
    );
  });

  it("resolves ./ and ../ against the README's own directory", () => {
    expect(absolutizeUrl("./a.md", "link", nested)).toBe("https://github.com/o/r/blob/main/docs/a.md");
    expect(absolutizeUrl("../b.md", "link", nested)).toBe("https://github.com/o/r/blob/main/b.md");
  });

  it("clamps ../ above the repository root to the root", () => {
    expect(absolutizeUrl("../../c.md", "link", root)).toBe("https://github.com/o/r/blob/main/c.md");
  });

  it("treats a leading slash as the repository root", () => {
    expect(absolutizeUrl("/LICENSE", "link", nested)).toBe("https://github.com/o/r/blob/main/LICENSE");
  });

  it("keeps the query and the fragment", () => {
    expect(absolutizeUrl("a.md#usage", "link", root)).toBe("https://github.com/o/r/blob/main/a.md#usage");
  });

  it("leaves absolute, protocol-relative, mailto and in-page URLs alone", () => {
    for (const url of ["https://x.dev/a", "//cdn.x/a.png", "mailto:a@b.c", "#features", ""]) {
      expect(absolutizeUrl(url, "link", root)).toBe(url);
    }
  });

  it("keeps a branch name that contains a slash", () => {
    expect(absolutizeUrl("a.png", "image", { ...root, branch: "release/v2" })).toBe(
      "https://raw.githubusercontent.com/o/r/release/v2/a.png",
    );
  });
});
