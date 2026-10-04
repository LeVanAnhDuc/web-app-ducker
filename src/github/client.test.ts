import { afterEach, describe, expect, it, vi } from "vitest";
import { githubJson } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("githubJson", () => {
  it("sends the token when GITHUB_TOKEN is set", async () => {
    vi.stubEnv("GITHUB_TOKEN", "t0k");
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await githubJson("/repos/o/r/readme");
    const init = fetchMock.mock.calls[0]![1] as RequestInit & { headers: Record<string, string> };
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.github.com/repos/o/r/readme");
    expect(init.headers.Authorization).toBe("Bearer t0k");
  });

  it("calls anonymously when GITHUB_TOKEN is empty", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await githubJson("/x");
    const init = fetchMock.mock.calls[0]![1] as RequestInit & { headers: Record<string, string> };
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("reports a non-2xx status instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("rate limited", { status: 403 })));
    expect(await githubJson("/x")).toEqual({ ok: false, status: 403 });
  });

  it("reports a network error instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    expect(await githubJson("/x")).toEqual({ ok: false, status: "network" });
  });

  it("reports a malformed body instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 200 })));
    expect(await githubJson("/x")).toEqual({ ok: false, status: "parse" });
  });
});
