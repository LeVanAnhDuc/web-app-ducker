import { readFileSync, existsSync } from "node:fs";
import { describe, it, expect } from "vitest";

/**
 * Both root layouts must mount the provider. Nothing else catches a layout that
 * forgot it — a component test mounts its own provider and passes happily while
 * the real document renders unthemed.
 *
 * Scanning source is the technique `src/server/auth/boundary.test.ts` already
 * uses for the three doors.
 */
const LAYOUTS = [
  "src/app/[locale]/(public)/layout.tsx",
  "src/app/[locale]/(admin)/admin/layout.tsx",
];

describe("theme wiring", () => {
  it.each(LAYOUTS)("%s mounts ThemeProvider", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source).toContain("<ThemeProvider>");
  });

  // next-themes sets data-theme before React hydrates, so the server HTML and
  // the hydrating DOM differ on purpose. Without this the console reds out.
  it.each(LAYOUTS)("%s keeps suppressHydrationWarning on <html>", (file) => {
    const source = readFileSync(file, "utf8");
    expect(source).toMatch(/<html[^>]*suppressHydrationWarning/);
  });

  it("the hand-rolled anti-flash script is gone", () => {
    expect(existsSync("src/components/ui/ThemeScript.tsx")).toBe(false);
  });

  it("nothing still exports it", () => {
    const index = readFileSync("src/components/ui/index.ts", "utf8");
    expect(index).not.toContain("ThemeScript");
  });
});
