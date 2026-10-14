import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { buildSitemap } from "./sitemap";

let root: string;
const base = new URL("https://ducker.test");

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "ducker-sitemap-"));
  const write = (group: string, file: string, name: string) => {
    mkdirSync(join(root, group), { recursive: true });
    writeFileSync(join(root, group, file), `---\nname: ${name}\nstatus: core\norder: 1\n---\nBody.`);
  };
  write("apps", "ducker-id.vi.mdx", "Ducker ID");
  write("games", "duck-flap.vi.mdx", "Duck Flap");
  write("docs", "getting-started.vi.mdx", "Getting Started");
});

describe("buildSitemap", () => {
  it("lists every public page once per locale, as absolute URLs", async () => {
    const urls = (await buildSitemap(base, root)).map((e) => e.url);
    for (const locale of ["vi", "en"]) {
      expect(urls).toEqual(
        expect.arrayContaining([
          `https://ducker.test/${locale}`,
          `https://ducker.test/${locale}/apps`,
          `https://ducker.test/${locale}/games`,
          `https://ducker.test/${locale}/apps/ducker-id`,
          `https://ducker.test/${locale}/games/duck-flap`,
          `https://ducker.test/${locale}/docs/getting-started`,
        ]),
      );
    }
    expect(urls).toHaveLength(12);
  });

  it("carries the same hreflang set as the page, x-default on the default locale", async () => {
    const entry = (await buildSitemap(base, root)).find((e) => e.url === "https://ducker.test/en/apps/ducker-id");
    expect(entry?.alternates?.languages).toEqual({
      vi: "https://ducker.test/vi/apps/ducker-id",
      en: "https://ducker.test/en/apps/ducker-id",
      "x-default": "https://ducker.test/vi/apps/ducker-id",
    });
  });

  it("leaves Releases tabs out", async () => {
    expect((await buildSitemap(base, root)).some((e) => e.url.endsWith("/releases"))).toBe(false);
  });
});
