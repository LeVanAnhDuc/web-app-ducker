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
