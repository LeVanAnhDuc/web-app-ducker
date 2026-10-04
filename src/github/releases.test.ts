import { afterEach, describe, expect, it, vi } from "vitest";
import { getReleases, parseReleases } from "./releases";

const repo = { owner: "o", name: "r" };
const rel = (over: Record<string, unknown>) => ({
  tag_name: "v1.0.0",
  name: "v1.0.0",
  draft: false,
  published_at: "2026-09-10T00:00:00Z",
  body: "### Fixes\n\n- a",
  html_url: "https://github.com/o/r/releases/tag/v1.0.0",
  ...over,
});

afterEach(() => vi.unstubAllGlobals());

describe("parseReleases", () => {
  it("drops drafts and sorts newest first", () => {
    const out = parseReleases([
      rel({ tag_name: "v1.0.0", published_at: "2026-09-10T00:00:00Z" }),
      rel({ tag_name: "v2.0.0-draft", draft: true }),
      rel({ tag_name: "v1.1.0", name: "v1.1.0", published_at: "2026-09-12T00:00:00Z" }),
    ]);
    expect(out.map((r) => r.tag)).toEqual(["v1.1.0", "v1.0.0"]);
  });

  it("keeps a name only when it says something the tag does not", () => {
    const [same, different] = parseReleases([
      rel({ tag_name: "v1.0.0", name: "v1.0.0", published_at: "2026-09-12T00:00:00Z" }),
      rel({ tag_name: "v0.9.0", name: "Hot-seat", published_at: "2026-09-11T00:00:00Z" }),
    ]);
    expect(same!.name).toBeNull();
    expect(different!.name).toBe("Hot-seat");
  });

  it("turns a null body into an empty string", () => {
    expect(parseReleases([rel({ body: null })])[0]!.body).toBe("");
  });

  it("skips items without a tag or a date", () => {
    expect(
      parseReleases([rel({ tag_name: undefined }), rel({ published_at: null, created_at: null }), 7]),
    ).toEqual([]);
  });
});

describe("getReleases", () => {
  it("is empty when the repository has published nothing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([])));
    expect(await getReleases(repo)).toEqual({ status: "empty" });
  });

  it("is empty when every release is a draft", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([rel({ draft: true })])));
    expect(await getReleases(repo)).toEqual({ status: "empty" });
  });

  it("is unavailable when a 200 carries something other than an array", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "Not Found" })));
    expect(await getReleases(repo)).toEqual({ status: "unavailable" });
    warn.mockRestore();
  });

  it("is unavailable on a rate-limit 403", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 403 })));
    expect(await getReleases(repo)).toEqual({ status: "unavailable" });
    warn.mockRestore();
  });

  it("asks for 100 per page", async () => {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    await getReleases(repo);
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.github.com/repos/o/r/releases?per_page=100");
  });
});
