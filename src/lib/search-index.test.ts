// src/lib/search-index.test.ts
import { describe, it, expect } from "vitest";
import { stripMarkdown, buildSearchIndex } from "./search-index";

describe("stripMarkdown", () => {
  it("strips heading and emphasis markers", () => {
    expect(stripMarkdown("## Tính năng\n\n**đậm** và *nghiêng*")).toBe("Tính năng đậm và nghiêng");
  });
  it("drops code blocks — shell commands pollute search results", () => {
    expect(stripMarkdown("Chạy:\n\n```bash\nnpm install\n```\n\nXong.")).toBe("Chạy: Xong.");
  });
  it("keeps link text, drops the URL", () => {
    expect(stripMarkdown("[GitHub](https://github.com/a/b)")).toBe("GitHub");
  });
});

describe("buildSearchIndex", () => {
  const input = {
    apps: [{ slug: "ducker-id", name: "Ducker ID",
             sections: [{ title: "Là gì", body: "Giao diện của IDMS." }] }],
    games: [{ slug: "duck-flap", name: "Duck Flap",
              sections: [{ title: "", body: "Vượt ống nước." }] }],
    docs: [{ slug: "tich-hop-oauth", title: "Tích hợp OAuth",
             sections: [{ title: "Luồng", body: "Năm bước." }] }],
    locale: "vi",
  };

  it("builds hrefs with the locale prefix", () => {
    const idx = buildSearchIndex(input);
    expect(idx.map(d => d.href)).toEqual(["/vi/apps/ducker-id", "/vi/games/duck-flap", "/vi/docs/tich-hop-oauth"]);
  });

  it("uses the display name as the title, not the slug", () => {
    expect(buildSearchIndex(input)[0].title).toBe("Ducker ID");
  });

  it("merges every section's content into one searchable string", () => {
    expect(buildSearchIndex(input)[0].text).toContain("Giao diện của IDMS");
    expect(buildSearchIndex(input)[0].text).toContain("Là gì");
  });
});
