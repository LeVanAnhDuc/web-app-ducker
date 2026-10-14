import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildContentSearchIndex, GET } from "./route";

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "ducker-search-index-"));
  mkdirSync(join(root, "apps"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  mkdirSync(join(root, "games"), { recursive: true });

  const writeApp = (f: string, name: string, order: number, body: string) =>
    writeFileSync(join(root, "apps", f), `---\nname: ${name}\nstatus: core\norder: ${order}\n---\n${body}`);
  const writeDoc = (f: string, name: string, order: number, body: string) =>
    writeFileSync(join(root, "docs", f), `---\nname: ${name}\nstatus: core\norder: ${order}\n---\n${body}`);

  writeApp("ducker-id.vi.mdx", "Ducker ID", 10, "Nha cung cap danh tinh.");
  writeApp("ducker-id.en.mdx", "Ducker ID", 10, "Identity provider for the ecosystem.");

  writeFileSync(
    join(root, "games", "duck-flap.vi.mdx"),
    `---
name: Duck Flap
status: standalone
order: 10
---
Vuot ong nuoc.`,
  );

  writeDoc("getting-started.vi.mdx", "Bat dau", 10, "Huong dan bat dau.");
  writeDoc("getting-started.en.mdx", "Getting Started", 10, "Getting started guide.");
  // en-only: no `getting-started`-style vi sibling, so there is no default-locale
  // file for this slug at all — this is the I-1 case.
  writeDoc("api-reference.en.mdx", "API Reference", 20, "English only reference document.");
});

describe("buildContentSearchIndex", () => {
  it("builds locale-prefixed hrefs for apps and docs", async () => {
    const index = await buildContentSearchIndex("en", root);
    const app = index.find((d) => d.kind === "app");
    expect(app?.href).toBe("/en/apps/ducker-id");
    const doc = index.find((d) => d.kind === "doc" && d.href === "/en/docs/getting-started");
    expect(doc).toBeDefined();
  });

  it("maps app and doc body text into the search text", async () => {
    const index = await buildContentSearchIndex("en", root);
    const app = index.find((d) => d.kind === "app");
    expect(app?.text).toContain("Identity provider for the ecosystem");
  });

  it("includes an English-only document in the English index (I-1)", async () => {
    const index = await buildContentSearchIndex("en", root);
    const apiRef = index.find((d) => d.href === "/en/docs/api-reference");
    expect(apiRef).toBeDefined();
    expect(apiRef?.title).toBe("API Reference");
    expect(apiRef?.text).toContain("English only reference document");
  });

  it("includes games, linked to their detail pages (FR-27)", async () => {
    const index = await buildContentSearchIndex("en", root);
    const game = index.find((d) => d.kind === "game");
    expect(game?.href).toBe("/en/games/duck-flap");
    expect(game?.title).toBe("Duck Flap");
    expect(game?.text).toContain("Vuot ong nuoc");
  });

  it("does not include the English-only document in the Vietnamese index", async () => {
    const index = await buildContentSearchIndex("vi", root);
    expect(index.some((d) => d.href === "/vi/docs/api-reference")).toBe(false);
  });
});

describe("GET", () => {
  const call = (locale: string) =>
    GET(new Request(`http://x/api/search-index/${locale}`), { params: Promise.resolve({ locale }) });

  it("answers 404 for a locale that is not enabled", async () => {
    // Otherwise it serves the default locale's content under `/xx/...` hrefs,
    // every one of which is a 404 page.
    expect((await call("xx")).status).toBe(404);
  });

  it("answers 200 with an array for an enabled locale", async () => {
    const res = await call("vi");
    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });
});
