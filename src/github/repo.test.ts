import { describe, expect, it } from "vitest";
import { parseRepoUrl, repoWebUrl } from "./repo";

describe("parseRepoUrl", () => {
  it("reads owner and name from a github.com URL", () => {
    expect(parseRepoUrl("https://github.com/LeVanAnhDuc/web-game-duck-caro")).toEqual({
      owner: "LeVanAnhDuc",
      name: "web-game-duck-caro",
    });
  });

  it("tolerates a trailing slash and a .git suffix", () => {
    expect(parseRepoUrl("https://github.com/o/r/")).toEqual({ owner: "o", name: "r" });
    expect(parseRepoUrl("https://github.com/o/r.git")).toEqual({ owner: "o", name: "r" });
  });

  it("rejects anything that is not a github.com repository root", () => {
    expect(parseRepoUrl(null)).toBeNull();
    expect(parseRepoUrl("")).toBeNull();
    expect(parseRepoUrl("https://gitlab.com/o/r")).toBeNull();
    expect(parseRepoUrl("https://github.com/o")).toBeNull();
    expect(parseRepoUrl("https://github.com/o/r/tree/main")).toBeNull();
    expect(parseRepoUrl("http://github.com/o/r")).toBeNull();
  });
});

describe("repoWebUrl", () => {
  it("builds the canonical repository URL", () => {
    expect(repoWebUrl({ owner: "o", name: "r" })).toBe("https://github.com/o/r");
  });
});
