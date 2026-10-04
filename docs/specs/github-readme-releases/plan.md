# README and Release Tabs from GitHub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every app and game with a `repo:` shows its GitHub README and its GitHub releases in two link-tabs, games get the same overview/detail shape as apps, and `/apps` and `/games` become overview pages that the top tabs open.

**Architecture:** A new `src/github/` module is the only code that calls the GitHub REST API. It never throws; it returns `ok | empty | unavailable`. Pages render statically and refresh through ISR (`revalidate = 3600`). The README goes through the existing `renderMarkdown`, extended with two options: rewrite relative URLs, and drop the first H1. The nav tree gains an "Overview" leaf as the first child of the apps and games groups, and games become a container like apps.

**Tech Stack:** Next.js 16.3 App Router (no `cacheComponents`), next-intl, unified/remark/rehype, vitest + Testing Library (jsdom), Playwright, CSS Modules on the site's **current** tokens.

**Spec:** [`design.md`](design.md) — read it before any task.

## Global Constraints

- **Visual tokens:** use the site's current tokens and CSS Modules (`--line`, `--muted`, `--ink`, `--surface`, `--accent`, `--t-*`, `--lh-*`, `--tap`). The approved mockup (claude.ai artifact `WZxq881LFMAH7SC44rk4PU`) is a **layout** reference only; "Ink and state" repaint is a separate branch.
- **Overview rows:** a hairline-ruled registry row (status swatch · name + tagline · slug · status badge). Not a card grid.
- **Tab labels:** vi `README` / `Bản phát hành`; en `README` / `Releases`.
- **ISR:** every detail route exports the literal `export const revalidate = 3600;`. Next requires it to be statically analysable, so do not import the number from another module.
- `pnpm build` must still succeed with **no** environment variable. `GITHUB_TOKEN` is optional.
- `src/github/` is the only module that may mention `api.github.com`. `src/content/` stays the only door to `content/` and `fs`.
- Component tests use `fireEvent`, never `userEvent.type`. Run vitest with `--maxWorkers=1`.
- Every visible string goes through next-intl, in both `vi.json` and `en.json` with identical keys (`messages.test.ts` enforces this).
- Code, comments and commit messages are in English. Conventional Commits; scopes used below: `github`, `markdown`, `content`, `docs-shell`, `registry`, `apps`, `games`, `docs`, `ci`.
- Display names are never slugs (MASTER §5); the slug is mono, secondary.

## Review Focus

1. **The `/releases` URL is not in the nav tree.** `findTrail` matches exact hrefs, so passing the releases pathname empties the sidebar and un-highlights the top tab. Pages must pass the entry's README href, and `TopBar` must normalise the pathname. Tested in Task 4 (`navHref`) and Task 6 (e2e: sidebar and top tab active on `/releases`).
2. **README URLs that are not plain relative paths.** `#anchor`, `mailto:`, `https://…`, protocol-relative `//…`, a leading `/`, `../` above the root, and a README stored in a subdirectory (`docs/README.md`). Tested in Task 1 (`absolutizeUrl`).
3. **GitHub answers with something unexpected.** A 200 with a non-array releases body, a README without `content`, or an `html_url` without `/blob/`. Each must become `unavailable`, never a throw that fails the build. Tested in Task 2.
4. **An entry without `repo:`** (Tier List, Task Management, Duck Strike) and a non-GitHub `repo:`. No tab strip, the `.mdx` body renders, and `/releases` returns 404. Tested in Task 5 (`entryHasRepo` / `parseRepoUrl`) and Task 6 (e2e on Tier List).
5. **A release with an empty body, or a name identical to its tag.** The body renders nothing, with no "undefined"; the name is not repeated beside the tag. Tested in Task 2 (`parseReleases`) and Task 5 (`ReleaseList`).

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/github/repo.ts` (new) | `RepoRef`, `parseRepoUrl`, `repoWebUrl` |
| `src/github/urls.ts` (new) | `absolutizeUrl` — README-relative → GitHub URL |
| `src/github/client.ts` (new) | `githubJson` (token, ISR hint, never throws), `Fetched<T>`, `REVALIDATE_SECONDS` |
| `src/github/readme.ts` (new) | `getReadme`, `parseReadme` |
| `src/github/releases.ts` (new) | `getReleases`, `parseReleases` |
| `src/github/index.ts` (new) | public surface |
| `src/github/boundary.test.ts` (new) | nothing outside `src/github/` mentions `api.github.com` |
| `src/lib/markdown.ts` | `renderMarkdown(md, options?)` — `rewriteUrl`, `dropFirstH1` |
| `content/nav.ts` | `overview` labels on the apps and games groups |
| `src/content/nav.ts` | games become a container with children; Overview leaf first in apps and games |
| `src/content/nav-tree.ts` | `navHref(pathname)` — strips a trailing `/releases` |
| `src/content/registry.ts` | `EntryGroup`, `getEntry`, `listEntries` |
| `src/components/docs/RegistryList.tsx` + `.module.css` (new) | overview rows |
| `src/components/docs/EntryTabs.tsx` + `.module.css` (new) | README · Releases link strip |
| `src/components/docs/ReleaseList.tsx` + `.module.css` (new) | `<details>` per release |
| `src/components/docs/GithubNotice.tsx` + `.module.css` (new) | empty / unavailable box |
| `src/components/docs/AppCard.tsx` | `basePath` prop so games link to `/games/<slug>` |
| `src/components/docs/GameCard.tsx` + test | **deleted** |
| `src/components/docs/TopBar.tsx` | uses `navHref(pathname)` |
| `src/app/[locale]/(public)/_entry/entry-page.tsx` (new) | shared server rendering for overview and detail routes |
| `src/app/[locale]/(public)/apps/page.tsx`, `games/page.tsx` | overview inside `DocsShell` |
| `src/app/[locale]/(public)/apps/[slug]/page.tsx` | README tab (rewritten) |
| `src/app/[locale]/(public)/apps/[slug]/releases/page.tsx` (new) | Releases tab |
| `src/app/[locale]/(public)/games/[slug]/page.tsx` (new) | README tab |
| `src/app/[locale]/(public)/games/[slug]/releases/page.tsx` (new) | Releases tab |
| `src/app/[locale]/(public)/page.tsx` | home: `AppCard` for games too |
| `src/i18n/messages/{vi,en}.json` | `entry.*` keys, games copy |
| `e2e/entry-tabs.spec.ts` (new), `e2e/registry.spec.ts` | flows |
| `.env.example`, `.github/workflows/ci.yml` | `GITHUB_TOKEN` |
| docs: ADR-0023, `scope.md`, `invariants.md`, `glossary.md`, `README.md`, `backlog.md`, `design.md` | traceability |

`src/app/[locale]/(public)/_entry/` is a private folder: Next does not route `_`-prefixed folders.

---

### Task 1: `src/github/` — repository reference and URL absolutising (pure)

**Files:**
- Create: `src/github/repo.ts`, `src/github/urls.ts`
- Test: `src/github/repo.test.ts`, `src/github/urls.test.ts`

**Interfaces:**
- Produces:
  - `type RepoRef = { owner: string; name: string }`
  - `parseRepoUrl(url: string | null | undefined): RepoRef | null`
  - `repoWebUrl(repo: RepoRef): string` → `https://github.com/<owner>/<name>`
  - `type ReadmeLocation = { repo: RepoRef; branch: string; path: string }`
  - `absolutizeUrl(url: string, kind: "link" | "image", at: ReadmeLocation): string`

- [ ] **Step 1: Write the failing tests**

`src/github/repo.test.ts`:
```ts
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
```

`src/github/urls.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm vitest run --maxWorkers=1 src/github`
Expected: FAIL — `Cannot find module './repo'` and `'./urls'`.

- [ ] **Step 3: Implement**

`src/github/repo.ts`:
```ts
/** A GitHub repository, as named by an entry's `repo:` frontmatter. */
export type RepoRef = { owner: string; name: string };

const REPO_ROOT = /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/;

/**
 * The repository a frontmatter `repo:` URL names, or `null` when it is not the
 * root of a github.com repository. Only the root is accepted: a `/tree/…` URL
 * would make every README link resolve against the wrong place.
 */
export function parseRepoUrl(url: string | null | undefined): RepoRef | null {
  if (!url) return null;
  const match = REPO_ROOT.exec(url.trim());
  return match ? { owner: match[1]!, name: match[2]! } : null;
}

export function repoWebUrl(repo: RepoRef): string {
  return `https://github.com/${repo.owner}/${repo.name}`;
}
```

`src/github/urls.ts`:
```ts
import type { RepoRef } from "./repo";

/** Where a README lives, which is what its relative URLs are relative to. */
export type ReadmeLocation = { repo: RepoRef; branch: string; path: string };

/** A scheme (`https:`, `mailto:`), a protocol-relative URL or an in-page anchor. */
const NOT_RELATIVE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/**
 * Turns a URL written inside a README into one that works on this site.
 *
 * A README on GitHub resolves `docs/a.png` against its own directory on its own
 * branch. Rendered here, the same string would resolve against a Ducker page and
 * 404. Links go to the blob view, so a reader lands on GitHub's rendering; images
 * go to raw.githubusercontent.com, because a blob URL serves HTML, not the image.
 */
export function absolutizeUrl(url: string, kind: "link" | "image", at: ReadmeLocation): string {
  if (url === "" || NOT_RELATIVE.test(url)) return url;

  const dir = at.path.includes("/") ? at.path.slice(0, at.path.lastIndexOf("/") + 1) : "";
  // A throwaway origin gives us the URL spec's own `./`, `../` and `/` resolution,
  // including clamping `../` at the root, instead of re-implementing it.
  const resolved = new URL(url, `https://readme.invalid/${dir}`);
  const repoPath = resolved.pathname.replace(/^\//, "");
  const { owner, name } = at.repo;
  const base =
    kind === "image"
      ? `https://raw.githubusercontent.com/${owner}/${name}/${at.branch}/`
      : `https://github.com/${owner}/${name}/blob/${at.branch}/`;
  return `${base}${repoPath}${resolved.search}${resolved.hash}`;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm vitest run --maxWorkers=1 src/github`
Expected: PASS (all tests in both files).

- [ ] **Step 5: Commit**

```bash
git add src/github/repo.ts src/github/repo.test.ts src/github/urls.ts src/github/urls.test.ts
git commit -m "feat(github): parse repository URLs and absolutise README-relative links"
```

---

### Task 2: `src/github/` — the API client, README, releases and the boundary test

**Files:**
- Create: `src/github/client.ts`, `src/github/readme.ts`, `src/github/releases.ts`, `src/github/index.ts`, `src/github/boundary.test.ts`
- Test: `src/github/readme.test.ts`, `src/github/releases.test.ts`, `src/github/client.test.ts`

**Interfaces:**
- Consumes: `RepoRef`, `parseRepoUrl`, `repoWebUrl`, `absolutizeUrl`, `ReadmeLocation` (Task 1)
- Produces:
  - `type Fetched<T> = { status: "ok"; data: T } | { status: "empty" } | { status: "unavailable" }`
  - `const REVALIDATE_SECONDS = 3600`
  - `type Readme = { markdown: string; branch: string; path: string; htmlUrl: string }`
  - `getReadme(repo: RepoRef): Promise<Fetched<Readme>>` (never `empty`; a repo with no README is `unavailable`)
  - `parseReadme(body: unknown): Readme | null`
  - `type Release = { tag: string; name: string | null; publishedAt: string; body: string; htmlUrl: string }`
  - `getReleases(repo: RepoRef): Promise<Fetched<Release[]>>`, newest first, drafts dropped
  - `parseReleases(items: unknown[]): Release[]`
  - `index.ts` re-exports all of the above plus Task 1's exports.

- [ ] **Step 1: Write the failing tests**

`src/github/client.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { githubJson } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("githubJson", () => {
  it("sends the token when GITHUB_TOKEN is set", async () => {
    vi.stubEnv("GITHUB_TOKEN", "t0k");
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await githubJson("/repos/o/r/readme");
    const init = fetchMock.mock.calls[0]![1] as RequestInit & { headers: Record<string, string> };
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.github.com/repos/o/r/readme");
    expect(init.headers.Authorization).toBe("Bearer t0k");
  });

  it("calls anonymously when GITHUB_TOKEN is empty", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}", { status: 200 }));
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
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    expect(await githubJson("/x")).toEqual({ ok: false, status: "network" });
  });

  it("reports a malformed body instead of throwing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 200 })));
    expect(await githubJson("/x")).toEqual({ ok: false, status: "parse" });
  });
});
```

`src/github/readme.test.ts`:
```ts
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
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      content: b64("hello"), path: "README.md", html_url: "https://github.com/o/r/blob/main/README.md",
    })));
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
```

`src/github/releases.test.ts`:
```ts
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
    expect(parseReleases([rel({ tag_name: undefined }), rel({ published_at: null, created_at: null }), 7])).toEqual([]);
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
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    await getReleases(repo);
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.github.com/repos/o/r/releases?per_page=100");
  });
});
```

`src/github/boundary.test.ts`:
```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ADR-0019 §4: a server-side dependency comes back with a test that enforces
 * its boundary. `src/github/` is the only module that talks to the GitHub API,
 * so it is the only place the API host may appear.
 */
const SRC = join(process.cwd(), "src");
const OWN = join(SRC, "github") + sep;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("GitHub boundary", () => {
  it("only src/github/ mentions api.github.com", () => {
    const offenders = walk(SRC)
      .filter((file) => /\.(ts|tsx)$/.test(file) && !file.startsWith(OWN))
      .filter((file) => readFileSync(file, "utf8").includes("api.github.com"))
      .map((file) => relative(process.cwd(), file));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm vitest run --maxWorkers=1 src/github`
Expected: FAIL on missing `./client`, `./readme`, `./releases`. The boundary test passes already, which is correct: nothing mentions the host yet.

- [ ] **Step 3: Implement**

`src/github/client.ts`:
```ts
/**
 * The one place this site talks to the GitHub REST API (ADR-0023).
 *
 * Nothing here throws. A build that cannot reach GitHub still has to produce
 * every page — GitHub being down degrades one tab, it does not fail a deploy.
 */
const GITHUB_API = "https://api.github.com";

/** How long a fetched README or release list is reused — the same hour as the routes' ISR. */
export const REVALIDATE_SECONDS = 3600;

export type Fetched<T> = { status: "ok"; data: T } | { status: "empty" } | { status: "unavailable" };

export type JsonResult = { ok: true; body: unknown } | { ok: false; status: number | "network" | "parse" };

export async function githubJson(path: string): Promise<JsonResult> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // Optional: anonymous calls get 60 an hour, which one build (~38 calls) fits
  // under — barely. With a token it is 5,000.
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${GITHUB_API}${path}`, {
      headers,
      // Also caches in `next dev`, where every request re-renders the page and
      // would otherwise spend the anonymous hourly budget in a few clicks.
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch {
    return { ok: false, status: "network" };
  }
  if (!response.ok) return { ok: false, status: response.status };
  try {
    return { ok: true, body: await response.json() };
  } catch {
    return { ok: false, status: "parse" };
  }
}

/** One line per failure, naming the repository — a swallowed error would read as "no README". */
export function warnUnavailable(what: string, repo: { owner: string; name: string }, status: number | string): void {
  console.warn(`[github] ${what} unavailable for ${repo.owner}/${repo.name}: ${status}`);
}
```

`src/github/readme.ts`:
```ts
import { githubJson, warnUnavailable, type Fetched } from "./client";
import type { RepoRef } from "./repo";

export type Readme = { markdown: string; branch: string; path: string; htmlUrl: string };

/**
 * The README endpoint's JSON, reduced to what rendering needs.
 *
 * The branch comes from `html_url` (`…/blob/<branch>/<path>`) rather than from a
 * second call for the repository's default branch: one request per repository
 * keeps a build inside the anonymous rate limit. Cutting the known `/<path>`
 * off the end keeps branch names that contain a slash intact.
 */
export function parseReadme(body: unknown): Readme | null {
  if (typeof body !== "object" || body === null) return null;
  const { content, path, html_url: htmlUrl } = body as Record<string, unknown>;
  if (typeof content !== "string" || typeof path !== "string" || typeof htmlUrl !== "string") return null;

  const marker = "/blob/";
  const start = htmlUrl.indexOf(marker);
  const suffix = `/${path}`;
  if (start < 0 || !htmlUrl.endsWith(suffix)) return null;
  const branch = htmlUrl.slice(start + marker.length, htmlUrl.length - suffix.length);
  if (branch === "") return null;

  return { markdown: Buffer.from(content, "base64").toString("utf8"), branch, path, htmlUrl };
}

/** Never `empty`: a repository without a README answers 404, which is `unavailable`. */
export async function getReadme(repo: RepoRef): Promise<Fetched<Readme>> {
  const result = await githubJson(`/repos/${repo.owner}/${repo.name}/readme`);
  if (!result.ok) {
    warnUnavailable("README", repo, result.status);
    return { status: "unavailable" };
  }
  const readme = parseReadme(result.body);
  if (!readme) {
    warnUnavailable("README", repo, "malformed body");
    return { status: "unavailable" };
  }
  return { status: "ok", data: readme };
}
```

`src/github/releases.ts`:
```ts
import { githubJson, warnUnavailable, type Fetched } from "./client";
import type { RepoRef } from "./repo";

export type Release = {
  tag: string;
  /** `null` when GitHub's name is empty or just repeats the tag. */
  name: string | null;
  /** ISO 8601, UTC (I11). */
  publishedAt: string;
  body: string;
  htmlUrl: string;
};

export function parseReleases(items: unknown[]): Release[] {
  const out: Release[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    if (r.draft === true) continue;
    if (typeof r.tag_name !== "string" || typeof r.html_url !== "string") continue;
    const publishedAt =
      typeof r.published_at === "string" ? r.published_at : typeof r.created_at === "string" ? r.created_at : null;
    if (publishedAt === null) continue;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    out.push({
      tag: r.tag_name,
      name: name !== "" && name !== r.tag_name ? name : null,
      publishedAt,
      body: typeof r.body === "string" ? r.body : "",
      htmlUrl: r.html_url,
    });
  }
  // ISO 8601 strings in the same zone sort correctly as plain strings.
  return out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** The 100 most recent releases; the largest repository today has 24. */
export async function getReleases(repo: RepoRef): Promise<Fetched<Release[]>> {
  const result = await githubJson(`/repos/${repo.owner}/${repo.name}/releases?per_page=100`);
  if (!result.ok) {
    warnUnavailable("releases", repo, result.status);
    return { status: "unavailable" };
  }
  if (!Array.isArray(result.body)) {
    warnUnavailable("releases", repo, "malformed body");
    return { status: "unavailable" };
  }
  const releases = parseReleases(result.body);
  return releases.length === 0 ? { status: "empty" } : { status: "ok", data: releases };
}
```

`src/github/index.ts`:
```ts
// src/github/index.ts
//
// The only door to the GitHub API (ADR-0023), as `src/content/` is the only door
// to `content/`. `boundary.test.ts` keeps it that way.
export { REVALIDATE_SECONDS, type Fetched } from "./client";
export { getReadme, parseReadme, type Readme } from "./readme";
export { getReleases, parseReleases, type Release } from "./releases";
export { parseRepoUrl, repoWebUrl, type RepoRef } from "./repo";
export { absolutizeUrl, type ReadmeLocation } from "./urls";
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `pnpm vitest run --maxWorkers=1 src/github && pnpm typecheck`
Expected: PASS; `tsc` clean. Next's global `fetch` typing accepts `next: { revalidate }`. If `tsc` rejects it, the `next-env.d.ts` reference is missing from the include list — check `tsconfig.json` rather than casting.

- [ ] **Step 5: Commit**

```bash
git add src/github
git commit -m "feat(github): fetch READMEs and releases behind a never-throwing boundary"
```

---

### Task 3: `renderMarkdown` options — rewrite URLs, drop the first H1

**Files:**
- Modify: `src/lib/markdown.ts` (the processor section, around lines 155–185)
- Test: `src/lib/markdown.test.ts` (append)

**Interfaces:**
- Produces: `type RenderOptions = { rewriteUrl?: (url: string, kind: "link" | "image") => string; dropFirstH1?: boolean }` and `renderMarkdown(md: string, options?: RenderOptions): Promise<string>`. Existing callers are unchanged.

- [ ] **Step 1: Write the failing tests** (append to `src/lib/markdown.test.ts`)

```ts
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
```

- [ ] **Step 2: Run and confirm the failure**

Run: `pnpm vitest run --maxWorkers=1 src/lib/markdown.test.ts`
Expected: FAIL — `rewriteUrl` is never called; the first H1 is still present.

- [ ] **Step 3: Implement** — in `src/lib/markdown.ts`, replace the `processor` constant and `renderMarkdown` with:

```ts
// ---------------------------------------------------------------------------
// 3b. README transforms (ADR-0023)
// ---------------------------------------------------------------------------

export type RenderOptions = {
  /** Called for every link, image and reference definition. README-relative URLs need it. */
  rewriteUrl?: (url: string, kind: "link" | "image") => string;
  /** The README's own title repeats the page hero; drop the first top-level H1. */
  dropFirstH1?: boolean;
};

type UrlNode = { type: string; url?: unknown; depth?: unknown; children?: unknown };

function rewriteUrls(node: UrlNode, rewrite: NonNullable<RenderOptions["rewriteUrl"]>): void {
  if (typeof node.url === "string") {
    if (node.type === "image") node.url = rewrite(node.url, "image");
    else if (node.type === "link" || node.type === "definition") node.url = rewrite(node.url, "link");
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children as UrlNode[]) rewriteUrls(child, rewrite);
  }
}

function remarkReadme(options: RenderOptions) {
  return (tree: unknown) => {
    const root = tree as UrlNode;
    if (options.dropFirstH1 && Array.isArray(root.children)) {
      const children = root.children as UrlNode[];
      const index = children.findIndex((c) => c.type === "heading" && c.depth === 1);
      if (index >= 0) children.splice(index, 1);
    }
    if (options.rewriteUrl) rewriteUrls(root, options.rewriteUrl);
  };
}

/**
 * Mandatory order: parse → gfm → rehype → highlight → **sanitize** → stringify.
 * Sanitizing before highlighting strips the shiki `<span>`s it just made.
 * The README transform runs on the markdown tree, before any of that, so the
 * sanitizer still sees — and still vets — every rewritten URL.
 */
function createProcessor(options: RenderOptions) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStripRawHtml)
    .use(remarkReadme, options)
    .use(remarkRehype)
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify);
}

const defaultProcessor = createProcessor({});

/** Markdown → sanitised HTML with highlighted code. Vietnamese diacritics survive. */
export async function renderMarkdown(md: string, options?: RenderOptions): Promise<string> {
  const processor = options ? createProcessor(options) : defaultProcessor;
  const file = await processor.process(md);
  return String(file);
}
```
Keep the existing Vietnamese doc comment above the old `processor` only if it still describes the code. The English comment above replaces it, so delete the old one.

- [ ] **Step 4: Run all markdown tests**

Run: `pnpm vitest run --maxWorkers=1 src/lib/markdown.test.ts`
Expected: PASS — the new tests and every pre-existing sanitiser test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown.ts src/lib/markdown.test.ts
git commit -m "feat(markdown): let callers rewrite URLs and drop the leading H1"
```

---

### Task 4: content layer — `getEntry`, games in the nav, Overview leaves, `navHref`

**Files:**
- Modify: `content/nav.ts`, `src/content/nav.ts`, `src/content/nav-tree.ts`, `src/content/registry.ts`, `src/components/docs/TopBar.tsx:58`
- Test: `src/content/nav.test.ts`, `src/content/nav-tree.test.ts` (append), `src/content/registry.test.ts` (append)

**Interfaces:**
- Produces:
  - `type EntryGroup = "apps" | "games"` (from `src/content/registry.ts`, re-exported by `@/content`)
  - `getEntry(group: EntryGroup, slug: string, locale: string, root?: string): Promise<AppDetail | null>`; `getApp` becomes `getEntry("apps", …)`
  - `listEntries(group: EntryGroup, locale: string, root?: string): Promise<AppCard[]>`
  - `navHref(pathname: string): string` (from `src/content/nav-tree.ts`): strips one trailing `/releases`
  - Nav rows: `apps:overview` and `games:overview` (kind `APP`, order `-1`, href `/${locale}/apps` and `/${locale}/games`); one `games:<slug>` child per game, href `/${locale}/games/<slug>`

- [ ] **Step 1: Write the failing tests**

In `src/content/nav.test.ts`, extend the registry mock:
```ts
vi.mock("./registry", () => ({
  listApps: vi.fn(async () => [
    { slug: "ducker-id", name: "Ducker ID" },
    { slug: "match-cv", name: "Match CV" },
  ]),
  listGames: vi.fn(async () => [
    { slug: "web-game-duck-caro", name: "Duck Caro" },
    { slug: "web-game-duck-flap", name: "Duck Flap" },
  ]),
}));
```
Then replace the `R4` apps test and the `R5` games test with:
```ts
  it("opens the apps group with an Overview leaf, then every app (R4)", async () => {
    const tree = buildNavTree(await listNavRows("vi"), "vi", "vi");
    const apps = tree.find((n) => n.id === "apps")!;
    expect(apps.children.map((c) => c.href)).toEqual([
      "/vi/apps",
      "/vi/apps/ducker-id",
      "/vi/apps/match-cv",
    ]);
    expect(apps.children[0]!.label).toBe("Tổng quan");
    expect(apps.children.every((c) => c.kind === "APP")).toBe(true);
  });

  it("makes games a container shaped like apps — R5 is retired", async () => {
    const tree = buildNavTree(await listNavRows("en"), "en", "vi");
    const games = tree.find((n) => n.id === "games")!;
    expect(games.kind).toBe("CONTAINER");
    expect(games.href).toBeNull();
    expect(games.children.map((c) => c.href)).toEqual([
      "/en/games",
      "/en/games/web-game-duck-caro",
      "/en/games/web-game-duck-flap",
    ]);
    expect(games.children[0]!.label).toBe("Overview");
  });

  it("points each top tab at its overview", async () => {
    const tree = buildNavTree(await listNavRows("vi"), "vi", "vi");
    expect(tree.map((n) => firstLeafHref(n))).toEqual(["/vi/apps", "/vi/games", "/vi/docs/getting-started"]);
  });

  it("gives docs no Overview leaf — there is no /docs page", async () => {
    const rows = await listNavRows("vi");
    expect(rows.some((r) => r.id === "docs:overview")).toBe(false);
  });
```
Change the import to `import { buildNavTree, firstLeafHref } from "./nav-tree";`.

Append to `src/content/nav-tree.test.ts`:
```ts
describe("navHref", () => {
  it("maps a releases tab onto its entry's nav href", () => {
    expect(navHref("/vi/apps/web-app-ducker-id/releases")).toBe("/vi/apps/web-app-ducker-id");
    expect(navHref("/en/games/web-game-duck-caro/releases")).toBe("/en/games/web-game-duck-caro");
  });

  it("leaves every other path alone", () => {
    for (const path of ["/vi/apps", "/vi/apps/x", "/vi/docs/releases-guide", "/vi/apps/releases"]) {
      expect(navHref(path)).toBe(path);
    }
  });
});
```
(Add `navHref` to that file's import from `./nav-tree`.)

Append to `src/content/registry.test.ts` (it reads the real `content/` tree):
```ts
describe("getEntry", () => {
  it("finds a game, which getApp never did", async () => {
    const game = await getEntry("games", "web-game-duck-caro", "vi");
    expect(game?.name).toBe("Duck Caro");
    expect(game?.repoUrl).toBe("https://github.com/LeVanAnhDuc/web-game-duck-caro");
  });

  it("does not cross groups", async () => {
    expect(await getEntry("apps", "web-game-duck-caro", "vi")).toBeNull();
  });

  it("keeps getApp working as before", async () => {
    expect((await getApp("web-app-ducker-id", "vi"))?.name).toBe("Ducker ID");
  });
});
```
(Add `getEntry`, `getApp` to that file's import if missing.)

- [ ] **Step 2: Run and confirm the failures**

Run: `pnpm vitest run --maxWorkers=1 src/content`
Expected: FAIL — no Overview rows, games still a leaf, `navHref` and `getEntry` not exported.

- [ ] **Step 3: Implement**

`content/nav.ts`:
```ts
// content/nav.ts
//
// The navigation tree's top level, hand-written. Three groups; their children are
// derived from the content files (`src/content/nav.ts`) so adding an app, game or doc
// never means editing this file. A group with `overview` gets an Overview leaf as
// its first child, pointing at `/<locale>/<id>` — the page its top tab opens.
export type NavGroup = {
  id: "apps" | "games" | "docs";
  labels: Record<string, string>;
  overview?: Record<string, string>;
};

export const navGroups: NavGroup[] = [
  { id: "apps", labels: { vi: "Ứng dụng", en: "Applications" }, overview: { vi: "Tổng quan", en: "Overview" } },
  { id: "games", labels: { vi: "Trò chơi", en: "Games" }, overview: { vi: "Tổng quan", en: "Overview" } },
  { id: "docs", labels: { vi: "Tài liệu", en: "Documentation" } },
];
```
Before saving, run `grep -rn "navGroups\|\.group\b" src content` and fix any reader of the removed `group` field. If one exists, use `id`, which carries the same value.

`src/content/nav.ts`: replace `listNavRows` and its doc comment with:
```ts
/**
 * Navigation rows for one locale, built from the content files.
 *
 * Apps and games are containers whose children come from the registry reader,
 * each opened by an Overview leaf (`content/nav.ts`) so `firstLeafHref` points
 * the top tab at `/apps` or `/games`. Games used to be a childless leaf (R5)
 * because they had no detail route; ADR-0023 gave them one.
 *
 * Every row comes out `status: "PUBLISHED"` (R14): file-backed content has no
 * draft state, and `buildNavTree` still filters on that field.
 */
export async function listNavRows(locale: string): Promise<NavRow[]> {
  const rows: NavRow[] = [];

  navGroups.forEach((group, order) => {
    rows.push(containerRow(group.id, group.labels, order));
    if (group.overview) {
      rows.push({
        id: `${group.id}:overview`,
        parentId: group.id,
        // Before every entry, whose orders start at 0.
        order: -1,
        status: "PUBLISHED",
        kind: "APP",
        href: `/${locale}/${group.id}`,
        labels: Object.entries(group.overview).map(([loc, value]) => ({ locale: loc, value })),
      });
    }
  });

  const [apps, games, docs] = await Promise.all([listApps(locale), listGames(locale), listDocs(locale)]);
  apps.forEach((app, order) => rows.push(childRow(app, order, "apps", `/${locale}/apps`, "APP", locale)));
  games.forEach((game, order) => rows.push(childRow(game, order, "games", `/${locale}/games`, "APP", locale)));
  docs.forEach((doc, order) =>
    rows.push(childRow({ slug: doc.slug, name: doc.title }, order, "docs", `/${locale}/docs`, "DOC", locale)),
  );

  return rows;
}
```
Update the import: `import { listApps, listGames } from "./registry";`.

`src/content/nav-tree.ts`: add after `firstLeafHref`:
```ts
/**
 * The nav-tree href a pathname belongs to.
 *
 * An entry's Releases tab (`/<locale>/<group>/<slug>/releases`) is not a node of
 * its own — it is the same entry as the README tab. `findTrail` matches exact
 * strings (I20), so without this the sidebar empties and no top tab lights up
 * on every Releases page, with nothing erroring.
 */
export function navHref(pathname: string): string {
  return pathname.replace(/^(\/[^/]+\/(?:apps|games)\/[^/]+)\/releases$/, "$1");
}
```

`src/content/registry.ts`: replace `getApp` (and its comment) with:
```ts
/** The two groups that have detail pages; docs have their own reader. */
export type EntryGroup = "apps" | "games";

export async function listEntries(group: EntryGroup, locale: string, root?: string): Promise<AppCard[]> {
  return (await readGroup(group, locale, root)).map(toCard);
}

export async function getEntry(
  group: EntryGroup,
  slug: string,
  locale: string,
  root?: string,
): Promise<AppDetail | null> {
  const entry = await readOne(group, slug, locale, root);
  if (!entry) return null;
  return {
    ...toCard(entry),
    body: entry.body,
    features: entry.data.features.map((f) => ({
      title: f.title,
      description: f.description ?? null,
      icon: f.icon ?? null,
    })),
    locale: entry.locale,
    isFallback: entry.isFallback,
  };
}

export async function getApp(slug: string, locale: string, root?: string): Promise<AppDetail | null> {
  return getEntry("apps", slug, locale, root);
}
```
Make `listApps` and `listGames` call `listEntries("apps"|"games", …)`.

`src/components/docs/TopBar.tsx` line 58:
```ts
  const activeTabId = findTrail(tree, navHref(pathname))[0]?.id;
```
and add `navHref` to its import from `@/content/nav-tree`. Update the comment above it: the overview pages are now in the tree, so "danh sách ứng dụng" no longer belongs in its list of pages outside the tree. Rewrite the comment in English while you are there.

- [ ] **Step 4: Run the content tests and typecheck**

Run: `pnpm vitest run --maxWorkers=1 src/content && pnpm typecheck`
Expected: PASS; `tsc` clean.

- [ ] **Step 5: Commit**

```bash
git add content/nav.ts src/content src/components/docs/TopBar.tsx
git commit -m "feat(content): give games detail pages in the nav and open each group on an overview"
```

---

### Task 5: components — `RegistryList`, `EntryTabs`, `ReleaseList`, `GithubNotice`; `AppCard.basePath`; delete `GameCard`

**Files:**
- Create: `src/components/docs/{RegistryList,EntryTabs,ReleaseList,GithubNotice}.tsx` and a `.module.css` beside each
- Modify: `src/components/docs/AppCard.tsx`, `src/components/docs/AppCard.test.tsx`
- Delete: `src/components/docs/GameCard.tsx`, `src/components/docs/GameCard.test.tsx`
- Test: `src/components/docs/{RegistryList,EntryTabs,ReleaseList,GithubNotice}.test.tsx`

**Interfaces:**
- Consumes: `AppCard` type, `Integration` (`@/content`); `Badge` (`@/components/ui/Badge`)
- Produces:
  - `RegistryList({ entries: AppCard[]; basePath: string; statusLabels: Record<Integration, string> })`. `basePath` is e.g. `/vi/apps`; rows link to `${basePath}/${slug}`. Root is `role="list"`, each row `role="listitem"`, the tagline has `data-testid="tagline"`.
  - `EntryTabs({ label: string; readmeHref: string; releasesHref: string; current: "readme" | "releases"; labels: { readme: string; releases: string } })`
  - `ReleaseList({ releases: { tag: string; name: string | null; dateLabel: string; anchor: string; html: string }[]; latestLabel: string })`
  - `GithubNotice({ title: string; body: string; actionLabel: string; actionHref: string; tone: "empty" | "unavailable" })`
  - `AppCard` gains an optional `basePath?: string`; the default stays `/${locale}/apps`

- [ ] **Step 1: Write the failing tests**

`src/components/docs/RegistryList.test.tsx`:
```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RegistryList } from "./RegistryList";

const labels = { core: "Lõi", connected: "Đã nối", standalone: "Độc lập", planned: "Dự kiến nối", private: "Repo riêng tư" };
const entry = (over: Partial<Parameters<typeof RegistryList>[0]["entries"][number]>) => ({
  slug: "web-app-ducker-id", name: "Ducker ID", tagline: "Một tài khoản", integration: "core" as const,
  techStack: [], repoUrl: null, isRepoPrivate: false, parent: null, ...over,
});

describe("RegistryList", () => {
  it("renders one list item per entry, linking to the detail page", () => {
    render(<RegistryList entries={[entry({}), entry({ slug: "web-app-match-cv", name: "Match CV", integration: "connected", parent: "web-app-ducker-id" })]} basePath="/vi/apps" statusLabels={labels} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Ducker ID/ })).toHaveAttribute("href", "/vi/apps/web-app-ducker-id");
  });

  it("shows the translated status, never the raw key", () => {
    render(<RegistryList entries={[entry({ integration: "planned", tagline: null })]} basePath="/vi/apps" statusLabels={labels} />);
    expect(screen.getByText("Dự kiến nối")).toBeInTheDocument();
    expect(screen.queryByText("planned")).toBeNull();
  });

  it("invents no tagline when the entry has none", () => {
    render(<RegistryList entries={[entry({ tagline: null })]} basePath="/vi/apps" statusLabels={labels} />);
    expect(screen.queryByTestId("tagline")).toBeNull();
  });

  it("keeps the slug secondary — it is not inside the name", () => {
    render(<RegistryList entries={[entry({})]} basePath="/vi/apps" statusLabels={labels} />);
    expect(screen.getByText("Ducker ID")).not.toHaveTextContent("web-app-ducker-id");
    expect(screen.getByText("web-app-ducker-id")).toBeInTheDocument();
  });
});
```

`src/components/docs/EntryTabs.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntryTabs } from "./EntryTabs";

const props = {
  label: "Nội dung của Ducker ID",
  readmeHref: "/vi/apps/x",
  releasesHref: "/vi/apps/x/releases",
  labels: { readme: "README", releases: "Bản phát hành" },
};

describe("EntryTabs", () => {
  it("is a named nav of two real links", () => {
    render(<EntryTabs {...props} current="readme" />);
    expect(screen.getByRole("navigation", { name: "Nội dung của Ducker ID" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "README" })).toHaveAttribute("href", "/vi/apps/x");
    expect(screen.getByRole("link", { name: "Bản phát hành" })).toHaveAttribute("href", "/vi/apps/x/releases");
  });

  it("marks only the current tab with aria-current", () => {
    render(<EntryTabs {...props} current="releases" />);
    expect(screen.getByRole("link", { name: "Bản phát hành" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "README" })).not.toHaveAttribute("aria-current");
  });
});
```

`src/components/docs/ReleaseList.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReleaseList } from "./ReleaseList";

const r = (tag: string, over: Partial<{ name: string | null; html: string }> = {}) => ({
  tag, name: null, dateLabel: "13 thg 9, 2026", anchor: `release-${tag}`, html: "<p>notes</p>", ...over,
});

describe("ReleaseList", () => {
  it("opens only the newest release", () => {
    const { container } = render(<ReleaseList releases={[r("v1.6.8"), r("v1.6.7"), r("v1.6.6")]} latestLabel="Mới nhất" />);
    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(3);
    expect([...details].map((d) => d.open)).toEqual([true, false, false]);
  });

  it("labels the newest as latest and gives every release its anchor", () => {
    const { container } = render(<ReleaseList releases={[r("v1.6.8"), r("v1.6.7")]} latestLabel="Mới nhất" />);
    expect(screen.getAllByText("Mới nhất")).toHaveLength(1);
    expect(container.querySelector('[id="release-v1.6.7"]')).not.toBeNull();
  });

  it("shows a distinct name beside the tag, and nothing for an empty body", () => {
    const { container } = render(<ReleaseList releases={[r("v2.0.0", { name: "Hot-seat", html: "" })]} latestLabel="Mới nhất" />);
    expect(screen.getByText("Hot-seat")).toBeInTheDocument();
    expect(container.textContent).not.toContain("undefined");
  });
});
```

`src/components/docs/GithubNotice.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GithubNotice } from "./GithubNotice";

describe("GithubNotice", () => {
  it("names the problem and links to GitHub", () => {
    render(<GithubNotice tone="unavailable" title="Chưa lấy được README" body="Thử lại sau." actionLabel="Mở kho trên GitHub" actionHref="https://github.com/o/r" />);
    expect(screen.getByRole("status")).toHaveTextContent("Chưa lấy được README");
    expect(screen.getByRole("link", { name: "Mở kho trên GitHub" })).toHaveAttribute("href", "https://github.com/o/r");
  });

  it("is a plain region, not a live status, when the state is simply empty", () => {
    render(<GithubNotice tone="empty" title="Chưa có bản phát hành nào" body="…" actionLabel="Releases" actionHref="https://github.com/o/r/releases" />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Chưa có bản phát hành nào")).toBeInTheDocument();
  });
});
```

Append to `src/components/docs/AppCard.test.tsx`:
```tsx
  it("links into the group named by basePath — games are not apps", () => {
    render(<AppCard app={base} locale="vi" basePath="/vi/games" />);
    expect(screen.getByRole("link", { name: /Manage Gym/ })).toHaveAttribute("href", "/vi/games/app-manage-gym");
  });
```

- [ ] **Step 2: Run and confirm the failures**

Run: `pnpm vitest run --maxWorkers=1 src/components/docs`
Expected: FAIL — the four modules are missing; `basePath` is ignored.

- [ ] **Step 3: Implement**

`src/components/docs/RegistryList.tsx`:
```tsx
import { Badge } from "@/components/ui/Badge";
import type { AppCard, Integration } from "@/content";
import styles from "./RegistryList.module.css";

export type RegistryListProps = {
  entries: AppCard[];
  /** `/vi/apps` or `/vi/games`; each row links to `${basePath}/${slug}`. */
  basePath: string;
  /** Translated status labels — a raw integration key is never shown. */
  statusLabels: Record<Integration, string>;
};

/**
 * The overview list: one hairline-ruled row per entry (MASTER.md §4 — the
 * registry row, not a card grid). A `connected` entry with a `parent` is drawn
 * as a branch under it, the one place the ecosystem's structure is visible.
 */
export function RegistryList({ entries, basePath, statusLabels }: RegistryListProps) {
  return (
    <ul className={styles.list} role="list">
      {entries.map((entry) => (
        <li key={entry.slug} className={styles.item} role="listitem">
          <a className={styles.row} href={`${basePath}/${entry.slug}`} data-branch={entry.parent ? "yes" : "no"}>
            <span className={styles.swatch} data-status={entry.integration} aria-hidden="true" />
            <span className={styles.text}>
              <span className={styles.name}>{entry.name}</span>
              {entry.tagline ? (
                <span className={styles.tagline} data-testid="tagline">
                  {entry.tagline}
                </span>
              ) : null}
            </span>
            <span className={styles.slug}>{entry.slug}</span>
            <Badge kind={entry.integration}>{statusLabels[entry.integration]}</Badge>
          </a>
        </li>
      ))}
    </ul>
  );
}
```

`src/components/docs/RegistryList.module.css` — before writing it, open `src/components/ui/Badge.module.css` and `src/styles/tokens.css` and use the per-status colour variables they already define for the swatch. The names below are placeholders for those variables; replace each `var(--status-…)` with the real token name you found.
```css
/* Overview rows — MASTER.md §4's registry row, drawn with the site's current
   tokens (the "Ink and state" repaint is a separate branch). */

.list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--line);
}

.item {
  border-bottom: 1px solid var(--line);
}

.row {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) minmax(0, 18rem) auto;
  align-items: center;
  gap: 16px;
  min-height: var(--tap);
  padding: 14px 12px;
  color: var(--ink);
  text-decoration: none;
  transition: background-color 150ms ease;
}

.row:hover {
  background: var(--surface);
}

.row:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

/* A connected app hangs under its identity provider. */
.row[data-branch="yes"] {
  padding-left: 36px;
}

.swatch {
  width: 10px;
  height: 10px;
}

.swatch[data-status="core"] { background: var(--status-core); }
.swatch[data-status="connected"] { background: var(--status-connected); }
.swatch[data-status="standalone"] { background: var(--status-standalone); }
.swatch[data-status="planned"] { background: var(--status-planned); }
.swatch[data-status="private"] { background: var(--status-private); }

.text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name {
  font-size: var(--t-md);
  font-weight: 600;
  line-height: var(--lh-head);
}

.tagline {
  font-size: var(--t-sm);
  line-height: 1.7;
  color: var(--muted);
}

.slug {
  font-family: var(--mono);
  font-size: var(--t-2xs);
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .row {
    grid-template-columns: 10px minmax(0, 1fr) auto;
  }

  .slug {
    grid-column: 2 / -1;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
```
`.name` is a `<span>`, not a heading, so I14 does not apply.

`src/components/docs/EntryTabs.tsx`:
```tsx
import styles from "./EntryTabs.module.css";

export type EntryTabsProps = {
  /** Accessible name of the strip, e.g. "Nội dung của Ducker ID". */
  label: string;
  readmeHref: string;
  releasesHref: string;
  current: "readme" | "releases";
  labels: { readme: string; releases: string };
};

/**
 * README · Releases. Real links to two URLs (ADR-0023): no client state, each tab
 * statically rendered, either one shareable.
 */
export function EntryTabs({ label, readmeHref, releasesHref, current, labels }: EntryTabsProps) {
  return (
    <nav className={styles.tabs} aria-label={label}>
      <a className={styles.tab} href={readmeHref} aria-current={current === "readme" ? "page" : undefined}>
        {labels.readme}
      </a>
      <a className={styles.tab} href={releasesHref} aria-current={current === "releases" ? "page" : undefined}>
        {labels.releases}
      </a>
    </nav>
  );
}
```

`src/components/docs/EntryTabs.module.css`:
```css
.tabs {
  display: flex;
  gap: 24px;
  margin: 28px 0 12px;
  border-bottom: 1px solid var(--line);
}

.tab {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap);
  padding: 0 2px;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: var(--t-sm);
  color: var(--muted);
  text-decoration: none;
  transition: color 150ms ease, border-color 150ms ease;
}

.tab:hover {
  color: var(--ink);
}

.tab[aria-current="page"] {
  color: var(--ink);
  font-weight: 600;
  border-bottom-color: var(--ink);
}

@media (max-width: 720px) {
  .tabs {
    gap: 0;
  }

  .tab {
    flex: 1 1 0;
    justify-content: center;
  }
}
```

`src/components/docs/ReleaseList.tsx`:
```tsx
import styles from "./ReleaseList.module.css";

export type ReleaseItem = {
  tag: string;
  name: string | null;
  /** Already formatted in the page's locale. */
  dateLabel: string;
  /** TOC target, unique per page. */
  anchor: string;
  /** Sanitised HTML of the release notes; may be empty. */
  html: string;
};

export type ReleaseListProps = { releases: ReleaseItem[]; latestLabel: string };

/** Newest first; only the newest open (spec D4). Native `<details>`, so it works with no JavaScript. */
export function ReleaseList({ releases, latestLabel }: ReleaseListProps) {
  return (
    <div className={styles.list}>
      {releases.map((release, index) => (
        <details key={release.tag} id={release.anchor} className={styles.release} open={index === 0}>
          <summary className={styles.summary}>
            <span className={styles.tag}>{release.tag}</span>
            {release.name ? <span className={styles.name}>{release.name}</span> : null}
            {index === 0 ? <span className={styles.latest}>{latestLabel}</span> : null}
            <span className={styles.spacer} />
            <span className={styles.date}>{release.dateLabel}</span>
          </summary>
          {release.html ? (
            <div className={styles.notes} dangerouslySetInnerHTML={{ __html: release.html }} />
          ) : null}
        </details>
      ))}
    </div>
  );
}
```

`src/components/docs/ReleaseList.module.css`:
```css
.list {
  border-top: 1px solid var(--line);
}

.release {
  border-bottom: 1px solid var(--line);
  scroll-margin-top: 16px;
}

.summary {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: var(--tap);
  padding: 8px;
  cursor: pointer;
  list-style: none;
}

.summary::-webkit-details-marker {
  display: none;
}

.summary::before {
  content: "";
  width: 7px;
  height: 7px;
  border-right: 2px solid var(--muted);
  border-bottom: 2px solid var(--muted);
  transform: rotate(-45deg);
  transition: transform 200ms ease;
}

.release[open] > .summary::before {
  transform: rotate(45deg);
}

.summary:hover {
  background: var(--surface);
}

.tag {
  font-family: var(--mono);
  font-size: var(--t-sm);
  font-weight: 600;
}

.name {
  font-size: var(--t-sm);
}

.latest {
  padding: 1px 8px;
  border: 1px solid var(--ink);
  border-radius: 3px;
  font-size: var(--t-2xs);
  font-weight: 600;
}

.spacer {
  flex: 1 1 auto;
}

.date {
  font-size: var(--t-sm);
  color: var(--muted);
}

.notes {
  padding: 0 8px 20px 27px;
  max-width: 66ch;
  font-size: var(--t-md);
  line-height: var(--lh-body);
}

.notes h3 {
  margin: 16px 0 6px;
  font-size: var(--t-md);
}

.notes code {
  font-family: var(--mono);
  font-size: var(--t-2xs);
  color: var(--muted);
}

@media (prefers-reduced-motion: reduce) {
  .summary::before {
    transition: none;
  }
}
```
`.notes h3` sets size only, no weight or tracking (I14).

`src/components/docs/GithubNotice.tsx`:
```tsx
import styles from "./GithubNotice.module.css";

export type GithubNoticeProps = {
  /** `empty` is a fact (no releases yet); `unavailable` is a failure worth announcing. */
  tone: "empty" | "unavailable";
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
};

export function GithubNotice({ tone, title, body, actionLabel, actionHref }: GithubNoticeProps) {
  return (
    <div className={styles.notice} data-tone={tone} role={tone === "unavailable" ? "status" : undefined}>
      <p className={styles.title}>{title}</p>
      <p className={styles.body}>{body}</p>
      <a className={styles.action} href={actionHref} rel="noreferrer" target="_blank">
        {actionLabel}
      </a>
    </div>
  );
}
```

`src/components/docs/GithubNotice.module.css`:
```css
.notice {
  max-width: 66ch;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
}

.notice[data-tone="unavailable"] {
  border-color: var(--muted);
}

.title {
  margin: 0 0 8px;
  font-size: var(--t-lg);
  font-weight: 600;
  line-height: var(--lh-head);
}

.body {
  margin: 0 0 16px;
  font-size: var(--t-md);
  line-height: var(--lh-body);
  color: var(--muted);
}

.action {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap);
  padding: 0 16px;
  border: 1px solid var(--muted);
  border-radius: 3px;
  font-size: var(--t-sm);
  color: var(--ink);
  text-decoration: none;
  transition: background-color 150ms ease;
}

.action:hover {
  background: var(--bg);
}
```

`src/components/docs/AppCard.tsx`: add the prop and use it:
```tsx
  /** Group prefix for the name link; defaults to `/${locale}/apps`. Games pass `/${locale}/games`. */
  basePath?: string;
```
```tsx
export function AppCard({ app, locale, statusLabel, repoLabel, basePath }: AppCardProps) {
  const detailHref = `${basePath ?? `/${locale}/apps`}/${app.slug}`;
```
and use `href={detailHref}` on the name link.

Delete `GameCard.tsx` and `GameCard.test.tsx` with `git rm`. Task 6 fixes the two pages that import it, so `typecheck` will fail until then. That is expected; run only vitest in Step 4.

- [ ] **Step 4: Run the component tests**

Run: `pnpm vitest run --maxWorkers=1 src/components/docs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/docs
git commit -m "feat(registry): add overview rows, entry tabs, release list and GitHub notices"
```

---

### Task 6: pages — overviews, four detail routes, home, strings, e2e

**Files:**
- Create: `src/app/[locale]/(public)/_entry/entry-page.tsx`, `_entry/entry-page.module.css`, `src/app/[locale]/(public)/apps/[slug]/releases/page.tsx`, `src/app/[locale]/(public)/games/[slug]/page.tsx`, `src/app/[locale]/(public)/games/[slug]/releases/page.tsx`, `e2e/entry-tabs.spec.ts`
- Modify: `src/app/[locale]/(public)/apps/page.tsx`, `apps/[slug]/page.tsx`, `games/page.tsx`, `(public)/page.tsx`, `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`, `e2e/registry.spec.ts`
- Delete: `apps/page.module.css`, `games/page.module.css` if nothing else imports them (check with grep)

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces (from `_entry/entry-page.tsx`):
  - `overviewStaticParams()`, `overviewMetadata(group, locale)`, `OverviewPage({ group, locale })`
  - `detailStaticParams(group, { requireRepo }: { requireRepo: boolean })`, `detailMetadata(group, locale, slug, tab)`, `DetailPage({ group, locale, slug, tab })`

- [ ] **Step 1: Add the strings** to both message files, under a new top-level `entry` key. Also replace `games.description`.

`vi.json`:
```json
"entry": {
  "tabsLabel": "Nội dung của {name}",
  "readme": "README",
  "releases": "Bản phát hành",
  "readmeSource": "Lấy từ {path} của kho, nhánh {branch}.",
  "viewOriginal": "Xem bản gốc trên GitHub",
  "readmeUnavailableTitle": "Chưa lấy được README từ GitHub",
  "releasesUnavailableTitle": "Chưa lấy được bản phát hành từ GitHub",
  "unavailableBody": "GitHub không trả về nội dung cho kho này. Trang sẽ thử lại ở lần làm mới tiếp theo; trong lúc chờ, bạn đọc bản gốc trên GitHub.",
  "openRepo": "Mở kho trên GitHub",
  "releasesCount": "{count, plural, other {# bản phát hành}}, mới nhất ở trên.",
  "latest": "Mới nhất",
  "releasesEmptyTitle": "Chưa có bản phát hành nào",
  "releasesEmptyBody": "Kho này chưa phát hành phiên bản nào trên GitHub. Khi có, chúng sẽ hiện ở đây trong vòng một giờ.",
  "releasesOnGithub": "Trang Releases trên GitHub",
  "overviewLabel": "Điều hướng {group}"
}
```
`games.description` (vi): `"Danh sách trò chơi trong hệ sinh thái, mỗi trò có README và lịch sử phát hành lấy từ GitHub."`

`en.json`:
```json
"entry": {
  "tabsLabel": "Contents of {name}",
  "readme": "README",
  "releases": "Releases",
  "readmeSource": "From the repository's {path}, branch {branch}.",
  "viewOriginal": "View the original on GitHub",
  "readmeUnavailableTitle": "Could not load the README from GitHub",
  "releasesUnavailableTitle": "Could not load releases from GitHub",
  "unavailableBody": "GitHub returned nothing for this repository. The page tries again at its next refresh; meanwhile, read the original on GitHub.",
  "openRepo": "Open the repository on GitHub",
  "releasesCount": "{count, plural, one {# release} other {# releases}}, newest first.",
  "latest": "Latest",
  "releasesEmptyTitle": "No releases yet",
  "releasesEmptyBody": "This repository has not published a release on GitHub. When it does, it shows up here within the hour.",
  "releasesOnGithub": "Releases page on GitHub",
  "overviewLabel": "{group} navigation"
}
```
`games.description` (en): `"The games in the ecosystem, each with its README and release history from GitHub."`

Run: `pnpm vitest run --maxWorkers=1 src/i18n` → PASS (same keys, no empty values).

- [ ] **Step 2: Write the shared page module** `src/app/[locale]/(public)/_entry/entry-page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { AppHero } from "@/components/docs/AppHero";
import { DocsShell } from "@/components/docs/DocsShell";
import { EntryTabs } from "@/components/docs/EntryTabs";
import { GithubNotice } from "@/components/docs/GithubNotice";
import { MarkdownBody } from "@/components/docs/MarkdownBody";
import { NavDrawer } from "@/components/docs/NavDrawer";
import { RegistryList } from "@/components/docs/RegistryList";
import { ReleaseList } from "@/components/docs/ReleaseList";
import { Sidebar } from "@/components/docs/Sidebar";
import { Toc } from "@/components/docs/Toc";
import { buildToc, getEntry, getNavTree, listEntries, type EntryGroup } from "@/content";
import { findTrail } from "@/content/nav-tree";
import { absolutizeUrl, getReadme, getReleases, parseRepoUrl, repoWebUrl } from "@/github";
import { defaultLocale, locales } from "@/i18n/locales";
import { attachHeadingIds, renderMarkdown } from "@/lib/markdown";
import { slugify } from "@/lib/slug";
import styles from "./entry-page.module.css";

/**
 * Shared rendering for `/apps`, `/games` and their detail routes (ADR-0023).
 * Route files stay thin because `revalidate` must be a literal in each of them.
 */

export type Tab = "readme" | "releases";

async function statusLabels(locale: string) {
  const t = await getTranslations({ locale });
  return {
    core: t("status.core"),
    connected: t("status.connected"),
    planned: t("status.planned"),
    standalone: t("status.standalone"),
    private: t("status.private"),
  };
}

function alternates(path: (locale: string) => string, locale: string): Metadata["alternates"] {
  return {
    canonical: path(locale),
    languages: {
      ...Object.fromEntries(locales.map((code) => [code, path(code)])),
      "x-default": path(defaultLocale),
    },
  };
}

/** Sidebar for whatever node `navHref` is — the README href for both tabs (Review Focus 1). */
async function sidebarFor(locale: string, navHref: string, label: string) {
  const t = await getTranslations({ locale });
  const trail = findTrail(await getNavTree(locale), navHref);
  const nodes = trail[0]?.children ?? [];
  return {
    trail,
    nodes,
    sidebar: nodes.length > 0 ? <Sidebar nodes={nodes} activeHref={navHref} label={label} /> : undefined,
    drawer: (
      <NavDrawer nodes={nodes} activeHref={navHref} labels={{ open: label, close: t("search.close") }} />
    ),
  };
}

// --- Overview ---------------------------------------------------------------

export function overviewStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function overviewMetadata(group: EntryGroup, locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale });
  return {
    title: `${t(`${group}.title`)} — ${t("brand.name")}`,
    description: t(`${group}.description`),
    alternates: alternates((code) => `/${code}/${group}`, locale),
  };
}

export async function OverviewPage({ group, locale }: { group: EntryGroup; locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const entries = await listEntries(group, locale);
  const href = `/${locale}/${group}`;
  const { sidebar, drawer } = await sidebarFor(locale, href, t("sidebar.label"));

  return (
    <DocsShell
      sidebar={sidebar}
      main={
        <div className={styles.main}>
          <div className={styles.drawer}>{drawer}</div>
          <h1 className={styles.title}>{t(`${group}.title`)}</h1>
          <p className={styles.lede}>{t(`${group}.lede`)}</p>
          <p className={styles.count}>{t(`${group}.eyebrow`, { count: entries.length })}</p>
          {entries.length > 0 ? (
            <RegistryList entries={entries} basePath={href} statusLabels={await statusLabels(locale)} />
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{t(`${group}.emptyTitle`)}</p>
              <p className={styles.emptyBody}>{t(`${group}.emptyBody`)}</p>
            </div>
          )}
        </div>
      }
    />
  );
}

// --- Detail -----------------------------------------------------------------

export async function detailStaticParams(group: EntryGroup, { requireRepo }: { requireRepo: boolean }) {
  const entries = await listEntries(group, defaultLocale);
  // Same rule as DetailPage: a private repository gets no tabs, so no Releases route.
  const hasRepo = (e: (typeof entries)[number]) => !e.isRepoPrivate && parseRepoUrl(e.repoUrl) !== null;
  const slugs = entries.filter((e) => !requireRepo || hasRepo(e)).map((e) => e.slug);
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function detailMetadata(group: EntryGroup, locale: string, slug: string, tab: Tab): Promise<Metadata> {
  const [t, entry] = await Promise.all([getTranslations({ locale }), getEntry(group, slug, locale)]);
  if (!entry) return { title: `${t("notFound.title")} — ${t("brand.name")}` };
  const suffix = tab === "releases" ? "/releases" : "";
  const tabTitle = tab === "releases" ? ` · ${t("entry.releases")}` : "";
  return {
    title: `${entry.name}${tabTitle} — ${t("brand.name")}`,
    description: entry.tagline ?? undefined,
    alternates: alternates((code) => `/${code}/${group}/${slug}${suffix}`, locale),
  };
}

function formatDate(iso: string, locale: string): string {
  // UTC on purpose (I11): the build server's zone must not shift a date by a day.
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
}

export async function DetailPage({
  group,
  locale,
  slug,
  tab,
}: {
  group: EntryGroup;
  locale: string;
  slug: string;
  tab: Tab;
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const entry = await getEntry(group, slug, locale);
  if (!entry) notFound();

  const repo = entry.isRepoPrivate ? null : parseRepoUrl(entry.repoUrl);
  // No repository, no Releases tab (spec §5): that URL is a 404, not an empty page.
  if (tab === "releases" && !repo) notFound();

  const readmeHref = `/${locale}/${group}/${slug}`;
  const { trail, sidebar, drawer } = await sidebarFor(locale, readmeHref, t("sidebar.label"));
  const crumb = trail.length > 1 ? trail.slice(0, -1).map((n) => n.label).join(" · ") : t(`${group}.title`);
  const labels = { code: t("a11y.codeBlock"), table: t("a11y.table") };

  let body: ReactNode;
  let toc: { anchor: string; title: string }[] = [];

  if (!repo) {
    // Spec §5's one exception to D1: no repository, so the authored body is all there is.
    toc = buildToc(entry.body);
    body = <MarkdownBody html={attachHeadingIds(await renderMarkdown(entry.body), toc)} labels={labels} />;
  } else if (tab === "readme") {
    const readme = await getReadme(repo);
    if (readme.status === "ok") {
      const at = { repo, branch: readme.data.branch, path: readme.data.path };
      toc = buildToc(readme.data.markdown);
      const html = await renderMarkdown(readme.data.markdown, {
        dropFirstH1: true,
        rewriteUrl: (url, kind) => absolutizeUrl(url, kind, at),
      });
      body = (
        <>
          <p className={styles.source}>
            {t("entry.readmeSource", { path: readme.data.path, branch: readme.data.branch })}{" "}
            <a href={readme.data.htmlUrl} rel="noreferrer" target="_blank">
              {t("entry.viewOriginal")}
            </a>
          </p>
          <MarkdownBody html={attachHeadingIds(html, toc)} labels={labels} />
        </>
      );
    } else {
      body = (
        <GithubNotice
          tone="unavailable"
          title={t("entry.readmeUnavailableTitle")}
          body={t("entry.unavailableBody")}
          actionLabel={t("entry.openRepo")}
          actionHref={repoWebUrl(repo)}
        />
      );
    }
  } else {
    const releases = await getReleases(repo);
    if (releases.status === "ok") {
      const items = await Promise.all(
        releases.data.map(async (r) => ({
          tag: r.tag,
          name: r.name,
          dateLabel: formatDate(r.publishedAt, locale),
          anchor: `release-${slugify(r.tag)}`,
          html: r.body ? await renderMarkdown(r.body) : "",
        })),
      );
      toc = items.map((i) => ({ anchor: i.anchor, title: i.tag }));
      body = (
        <>
          <p className={styles.source}>{t("entry.releasesCount", { count: items.length })}</p>
          <ReleaseList releases={items} latestLabel={t("entry.latest")} />
        </>
      );
    } else {
      body = (
        <GithubNotice
          tone={releases.status === "empty" ? "empty" : "unavailable"}
          title={t(releases.status === "empty" ? "entry.releasesEmptyTitle" : "entry.releasesUnavailableTitle")}
          body={t(releases.status === "empty" ? "entry.releasesEmptyBody" : "entry.unavailableBody")}
          actionLabel={t(releases.status === "empty" ? "entry.releasesOnGithub" : "entry.openRepo")}
          actionHref={releases.status === "empty" ? `${repoWebUrl(repo)}/releases` : repoWebUrl(repo)}
        />
      );
    }
  }

  const status = await statusLabels(locale);

  return (
    <DocsShell
      sidebar={sidebar}
      toc={toc.length > 0 ? <Toc items={toc} title={t("toc.title")} /> : undefined}
      main={
        <article className={styles.main}>
          <AppHero
            app={entry}
            locale={locale}
            crumb={crumb}
            labels={{
              status: status[entry.integration],
              privateRepo: t("app.privateRepo"),
              repo: t("app.viewRepoOnGithub"),
              fallback: t("fallback.notice"),
            }}
            drawer={drawer}
          />
          {repo ? (
            <EntryTabs
              label={t("entry.tabsLabel", { name: entry.name })}
              readmeHref={readmeHref}
              releasesHref={`${readmeHref}/releases`}
              current={tab}
              labels={{ readme: t("entry.readme"), releases: t("entry.releases") }}
            />
          ) : null}
          {body}
        </article>
      }
    />
  );
}
```
Check the existing `apps/[slug]/page.tsx` for the class it puts on `<article>` (`styles.main` from `apps/[slug]/page.module.css`). Copy those rules into `_entry/entry-page.module.css` as `.main`, and add:
```css
.source {
  margin: 0 0 24px;
  font-size: var(--t-xs);
  color: var(--muted);
}

.source a {
  color: inherit;
}

.title {
  margin: 0 0 12px;
  font-size: var(--t-2xl);
  line-height: var(--lh-head);
  text-wrap: balance;
}

.lede {
  margin: 0 0 8px;
  max-width: 58ch;
  font-size: var(--t-md);
  line-height: var(--lh-body);
  color: var(--muted);
}

.count {
  margin: 0 0 28px;
  font-size: var(--t-sm);
  color: var(--muted);
}

.drawer:empty {
  display: none;
}
```
Take `.empty`, `.emptyTitle` and `.emptyBody` verbatim from the current `apps/page.module.css`. `.title` declares no weight or tracking (I14). For the overview's padding, reuse the existing `.main` padding from `apps/[slug]/page.module.css` so overview and detail align.

The repo link stays in `AppHero` and now reads "Xem trên GitHub" (`app.viewRepoOnGithub`). The old "Repo giao diện" label described a monorepo split that no longer exists.

- [ ] **Step 3: Write the six route files**

`src/app/[locale]/(public)/apps/page.tsx` (entire file):
```tsx
import type { Metadata } from "next";
import { OverviewPage, overviewMetadata, overviewStaticParams } from "../_entry/entry-page";

type PageParams = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return overviewStaticParams();
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  return overviewMetadata("apps", (await params).locale);
}

export default async function AppsPage({ params }: PageParams) {
  return <OverviewPage group="apps" locale={(await params).locale} />;
}
```
`src/app/[locale]/(public)/games/page.tsx`: the same file with `"games"` and `GamesPage`.

`src/app/[locale]/(public)/apps/[slug]/page.tsx` (entire file):
```tsx
import type { Metadata } from "next";
import { DetailPage, detailMetadata, detailStaticParams } from "../../_entry/entry-page";

// ISR: the README is re-fetched at most once an hour (ADR-0023). Must stay a literal.
export const revalidate = 3600;

type PageParams = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return detailStaticParams("apps", { requireRepo: false });
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  return detailMetadata("apps", locale, slug, "readme");
}

export default async function AppPage({ params }: PageParams) {
  const { locale, slug } = await params;
  return <DetailPage group="apps" locale={locale} slug={slug} tab="readme" />;
}
```
`src/app/[locale]/(public)/apps/[slug]/releases/page.tsx`: the same, with import path `../../../_entry/entry-page`, `requireRepo: true`, tab `"releases"` and `AppReleasesPage`.
`src/app/[locale]/(public)/games/[slug]/page.tsx` and `games/[slug]/releases/page.tsx`: the same two files with `"games"`, `GamePage` and `GameReleasesPage`.

The deleted `apps/[slug]/page.tsx` imported `FeatureGrid`. If nothing else imports `FeatureGrid` now (`grep -rn FeatureGrid src`), `git rm` it and its CSS: the spec hides it and no content declares `features`.

- [ ] **Step 4: Home page** — in `src/app/[locale]/(public)/page.tsx` replace the `GameCard` import and usage:
```tsx
              <AppCard
                key={game.slug}
                app={game}
                locale={locale}
                basePath={`/${locale}/games`}
                statusLabel={statusLabels[game.integration]}
                repoLabel={t("app.viewRepoOnGithub")}
              />
```
Remove the `GameCard` import, and update the comment at line ~49 that names `GameCard`.

- [ ] **Step 5: Typecheck, unit tests, build**

Run: `pnpm typecheck && pnpm test:run && pnpm lint && pnpm build`
Expected: all green. In the `next build` route table, the four detail routes show as ISR (`●` with a revalidate column of 1h); `/[locale]/apps` and `/[locale]/games` show as static. If `build` fails on a missing CSS module, a deleted `page.module.css` was still imported — restore it or move the import.

- [ ] **Step 6: Write the e2e spec** `e2e/entry-tabs.spec.ts`:
```ts
// e2e/entry-tabs.spec.ts
//
// Overview → detail → Releases, for apps and games (ADR-0023). GitHub's answer
// is whatever it was at build time, so every assertion here holds for both an
// `ok` and an `unavailable` README/release list — the structure is under test,
// not GitHub's uptime.
import { expect, test } from "@playwright/test";

test("the Games tab opens the games overview, first in its sidebar", async ({ page }) => {
  await page.goto("/vi");
  await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Trò chơi" }).click();
  await expect(page).toHaveURL(/\/vi\/games$/);
  await expect(page.getByRole("heading", { level: 1, name: "Trò chơi" })).toBeVisible();
  const sidebar = page.getByRole("navigation", { name: "Điều hướng tài liệu" }).first();
  await expect(sidebar.getByRole("link").first()).toHaveText("Tổng quan");
});

test("an overview row opens the detail page on its README tab", async ({ page }) => {
  await page.goto("/vi/games");
  await page.getByRole("listitem").filter({ hasText: "Duck Caro" }).getByRole("link").click();
  await expect(page).toHaveURL(/\/vi\/games\/web-game-duck-caro$/);
  const tabs = page.getByRole("navigation", { name: "Nội dung của Duck Caro" });
  await expect(tabs.getByRole("link", { name: "README" })).toHaveAttribute("aria-current", "page");
});

test("the Releases tab keeps the sidebar and the active top tab", async ({ page }) => {
  await page.goto("/vi/games/web-game-duck-caro/releases");
  const tabs = page.getByRole("navigation", { name: "Nội dung của Duck Caro" });
  await expect(tabs.getByRole("link", { name: "Bản phát hành" })).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Trò chơi" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Điều hướng tài liệu" }).first()).toContainText("Duck Caro");
  // Either the list or the notice — never an empty tab.
  await expect(page.locator("details, [role=status]").first()).toBeVisible();
});

test("an entry with no repository has no tabs and no Releases page", async ({ page }) => {
  await page.goto("/vi/apps/web-app-tier-list");
  await expect(page.getByRole("heading", { level: 1, name: "Tier List" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: /Nội dung của/ })).toHaveCount(0);
  const response = await page.goto("/vi/apps/web-app-tier-list/releases");
  expect(response?.status()).toBe(404);
});
```
In `e2e/registry.spec.ts`, the `/vi/apps` test still holds: a row is a `listitem` with `data-testid="tagline"`. Leave it unchanged unless it fails, and if it does, read why before editing it.

- [ ] **Step 7: Run e2e**

Run: `pnpm e2e` (after the `pnpm build` from Step 5)
Expected: every spec passes, including `a11y-tap-target.spec.ts`. That spec scans tap targets, and the new tabs and rows use `min-height: var(--tap)` for it.

- [ ] **Step 8: Look at it**

Run `pnpm dev` and open `/vi/apps`, `/vi/apps/web-app-ducker-id`, `/vi/apps/web-app-ducker-id/releases`, `/vi/games/web-game-duck-caro/releases` and `/vi/apps/web-app-calculate-badminton`, at 1440 and 375 wide. Compare the layout to the mockup: sidebar with Overview first, hero, tab strip, README or release list, TOC. Badminton must show the unavailable notice.

- [ ] **Step 9: Commit**

```bash
git add -A src e2e
git commit -m "feat(apps): show each entry's README and releases from GitHub, and give games the same pages"
```

---

### Task 7: documentation, environment and CI

**Files:**
- Create: `docs/decisions/0023-readme-and-releases-from-github.md`
- Modify: `docs/02-requirements/scope.md`, `docs/03-design/invariants.md`, `docs/01-product/glossary.md`, `docs/04-state/backlog.md`, `docs/specs/github-readme-releases/design.md`, `README.md`, `.env.example`, `.github/workflows/ci.yml`

- [ ] **Step 1: ADR-0023.** Follow the shape of `0022-deploy-from-actions-not-vercel-git.md` (header with Date / Status / Related, then Context, Decision, Rejected alternatives, Consequences). Content:
  - Context: hand-written bodies duplicated READMEs and went stale; no release history anywhere.
  - Decision: for entries with a `repo:`, README and releases come from the GitHub REST API at build time and refresh through ISR every 3600 s; `src/github/` is the only caller and never throws; amends ADR-0018 §2 for those entries; frontmatter stays the source of name, status, order, tagline and stack; the search index stays file-built.
  - Rejected: client-side fetching (per-viewer rate limit, no SEO, a loading state on every visit); build-only (a redeploy per README edit); one URL with client tabs (24 release bodies in every page, TOC swapped on the client); `?tab=` (reading `searchParams` forces dynamic rendering and loses ISR); keeping the last good copy on a failed refresh (needs storage the site does not have).
  - Consequences: the build depends on the network but never fails on it; ~38 requests per build, so set `GITHUB_TOKEN`; README text is not searchable; ISR needs a server host (ADR-0022's Vercel). Revisit when a static-only host is chosen.

- [ ] **Step 2: `scope.md`.** Add rows in the existing table style:
  - `FR-25 | README tab — an entry with a repo shows its GitHub README, relative links absolutised | US-… | done`
  - `FR-26 | Releases tab — every release newest first, newest open; empty and unavailable states | done`
  - `FR-27 | Games detail pages, and /apps and /games as overview pages opened by the top tabs | done`
  Copy the US column from the nearest existing row about app pages. Do not invent a journey ID.

- [ ] **Step 3: `invariants.md`.** Add:
  - `I21 | src/github/ is the only module that calls the GitHub API, and it never throws | A throw fails the build whenever GitHub is down; a second caller escapes the token and the cache. Guarded by src/github/boundary.test.ts`
  - `I22 | A Releases URL is mapped to its README href before findTrail (navHref) | Otherwise the sidebar empties and no top tab is active on every Releases page`
  - Under the R-notes (where R5 is recorded — `grep -rn "R5" docs`), mark R5 retired, referencing ADR-0023.

- [ ] **Step 4: `glossary.md`.** Add Overview (`Tổng quan` · `apps:overview`/`games:overview` · `/apps`, `/games`), README tab (`README` · `tab="readme"`), Releases tab (`Bản phát hành` / `Releases` · `tab="releases"`), in the file's existing table shape.

- [ ] **Step 5: `design.md`.** Bring the spec in line with what was built:
  - §5 Overview: "card grid" → "registry rows (MASTER.md §4)".
  - §6: the README call uses the default JSON media type (base64 `content`), not `raw+json`.
  - §9 E2E: "GitHub replaced by fixtures" → "assertions hold for both `ok` and `unavailable`".
  - Add a short "Decisions taken during implementation" list with the three pre-merge decisions: rows instead of cards; current tokens rather than the mockup's palette; tab labels.

- [ ] **Step 6: `README.md`.** In `## Features`, add one bullet in the existing style: `- **README and releases from GitHub** — every app and game page shows its repository's README and release history, refreshed hourly; games now have their own pages`. Refresh the test count if the README states one: take it from the last `pnpm test:run` output, never estimate.

- [ ] **Step 7: `.env.example`.** Append:
```bash
# Optional. A GitHub token raises the API limit from 60 to 5,000 requests an hour
# for fetching READMEs and releases (ADR-0023). One build makes about 38 calls.
# No scopes are needed — every repository read is public.
GITHUB_TOKEN=
```
Also update the header line "The site needs none." to "The site needs none to build; `GITHUB_TOKEN` is optional."

- [ ] **Step 8: CI.** In `.github/workflows/ci.yml`, give the `pnpm build` step (line ~88) and the `pnpm e2e` step an env block:
```yaml
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
The Actions-provided token can read public repositories, so no new secret is needed.

- [ ] **Step 9: `backlog.md`.** Under §In progress, replace any stale lines about this feature with: the branch name, "code + docs complete, PR open, awaiting merge", and the open item that `web-app-calculate-badminton` returns 404 until its `repo:` is fixed. Update the header's `Updated:` line.

- [ ] **Step 10: Run the docs regenerator if present, and verify**

Run: `bash .claude/scripts/docs-regen.sh 2>/dev/null || true`, then `git diff --stat`. The ADR index in `docs/decisions/README.md` must now list ADR-0023. If the script is absent, add the row by hand inside the auto markers only if there are no markers.

- [ ] **Step 11: Commit**

```bash
git add docs README.md .env.example .github/workflows/ci.yml
git commit -m "docs(decisions): record README and releases from GitHub as ADR-0023"
```

---

### Task 8: final verification and pull request

- [ ] **Step 1:** `pnpm typecheck && pnpm lint && pnpm test:run && pnpm build && pnpm e2e` — all green, and quote the summary lines. A vitest timeout is not a real failure until it repeats with `--maxWorkers=1` on the failing file (CLAUDE.md trap 2).
- [ ] **Step 2:** `pnpm release:next` — the previewed version is a minor bump: `feat` commits, no `!`.
- [ ] **Step 3:** Push the branch, open the PR against `main`, and include `🤖 Generated with [Claude Code](https://claude.com/claude-code)` at the end of the body. Wait for CI.
- [ ] **Step 4:** **Stop before merging** and report to the user the decisions taken on their behalf (the user asked for this). Merge only after they answer.
