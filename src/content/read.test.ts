import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { readGroup, readOne } from "./read";

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "ducker-content-"));
  mkdirSync(join(root, "apps"), { recursive: true });
  const write = (f: string, name: string, order: number) =>
    writeFileSync(join(root, "apps", f), `---\nname: ${name}\nstatus: core\norder: ${order}\n---\nBody ${name}.`);
  write("alpha.vi.mdx", "Alpha", 10);
  write("alpha.en.mdx", "Alpha", 10);
  write("beta.vi.mdx", "Beta", 20);   // vi only — en must fall back
  write("node.js.vi.mdx", "Node.js", 30);  // dotted slug
  write("gamma.de.mdx", "Gamma", 40);      // only in third locale
});

describe("readGroup", () => {
  it("returns entries ordered by `order`", async () => {
    const rows = await readGroup("apps", "vi", root);
    expect(rows.map((r) => r.data.name)).toEqual(["Alpha", "Beta", "Node.js"]);
  });

  it("falls back to the default locale and flags it", async () => {
    const rows = await readGroup("apps", "en", root);
    const beta = rows.find((r) => r.data.name === "Beta");
    expect(beta?.isFallback).toBe(true);
    expect(beta?.locale).toBe("vi");
  });

  it("does not flag an entry that has the requested locale", async () => {
    const rows = await readGroup("apps", "en", root);
    expect(rows.find((r) => r.data.name === "Alpha")?.isFallback).toBe(false);
  });

  it("skips entries with no translation in the requested or default locale", async () => {
    const rows = await readGroup("apps", "en", root);
    const names = rows.map((r) => r.data.name);
    expect(names).not.toContain("Gamma");
  });
});

describe("readOne", () => {
  it("returns null for an unknown slug rather than throwing", async () => {
    expect(await readOne("apps", "nope", "vi", root)).toBeNull();
  });

  it("does not match a dotted slug by its prefix", async () => {
    const result = await readOne("apps", "node", "vi", root);
    expect(result).toBeNull();
  });

  it("matches a dotted slug by exact name", async () => {
    const result = await readOne("apps", "node.js", "vi", root);
    expect(result?.data.name).toBe("Node.js");
  });
});
