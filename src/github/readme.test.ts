import { afterEach, describe, expect, it, vi } from "vitest";
import { getReadme, parseReadme } from "./readme";

const repo = { owner: "o", name: "r" };
const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

afterEach(() => vi.unstubAllGlobals());

describe("parseReadme", () => {
  it("decodes the content and takes the branch from html_url", () => {
    expect(
      parseReadme({
        content: b64("# Title\n\nCờ caro"),
        path: "README.md",
        html_url: "https://github.com/o/r/blob/main/README.md",
      }),
    ).toEqual({
      markdown: "# Title\n\nCờ caro",
      branch: "main",
      path: "README.md",
      htmlUrl: "https://github.com/o/r/blob/main/README.md",
    });
  });

  it("keeps a branch that contains a slash", () => {
    const parsed = parseReadme({
      content: b64("x"),
      path: "docs/README.md",
      html_url: "https://github.com/o/r/blob/release/v2/docs/README.md",
    });
    expect(parsed?.branch).toBe("release/v2");
  });

  it("rejects a body missing content, path or a blob html_url", () => {
    expect(parseReadme(null)).toBeNull();
    expect(parseReadme({ path: "README.md", html_url: "https://github.com/o/r/blob/main/README.md" })).toBeNull();
    expect(parseReadme({ content: b64("x"), path: "README.md", html_url: "https://github.com/o/r" })).toBeNull();
  });
});

describe("getReadme", () => {
  it("returns ok with the parsed README", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          content: b64("hello"),
          path: "README.md",
          html_url: "https://github.com/o/r/blob/main/README.md",
        }),
      ),
    );
    const result = await getReadme(repo);
    expect(result.status).toBe("ok");
    expect(result.status === "ok" && result.data.markdown).toBe("hello");
  });

  it("is unavailable on 404 and logs one warning naming the repo", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    expect(await getReadme(repo)).toEqual({ status: "unavailable" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain("o/r");
    warn.mockRestore();
  });

  it("is unavailable when a 200 carries a malformed body", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "?" })));
    expect(await getReadme(repo)).toEqual({ status: "unavailable" });
    warn.mockRestore();
  });
});
