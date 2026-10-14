// src/styles/tokens.test.ts
import { readFileSync, readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";

const css = readFileSync("src/styles/tokens.css", "utf8");

describe("design token", () => {
  it("defines the full light palette on bare :root", () => {
    const root = css.slice(css.indexOf(":root {"), css.indexOf("@media"));
    for (const name of ["--bg","--surface","--line","--ink","--muted","--accent",
                        "--st-core","--st-connected","--st-standalone","--st-planned","--st-private"]) {
      expect(root).toContain(name);
    }
  });

  it("wraps the dark block in :root:not([data-theme=\"light\"])", () => {
    expect(css).toContain('prefers-color-scheme: dark');
    expect(css).toContain(':root:not([data-theme="light"])');
  });

  it("has a [data-theme=\"dark\"] block so the toggle wins in both directions", () => {
    expect(css).toContain(':root[data-theme="dark"]');
  });

  it("every token declared in the dark block already exists on bare :root", () => {
    const light = css.slice(0, css.indexOf("@media"));
    const darkNames = [...css.slice(css.indexOf("@media")).matchAll(/(--[a-z0-9-]+):/g)].map(m => m[1]);
    for (const n of new Set(darkNames)) expect(light).toContain(`${n}:`);
  });

  it("uses no webfont", () => {
    expect(css).not.toMatch(/@font-face|fonts\.googleapis|next\/font/);
  });

  it("body leading is no less than 1.7 because Vietnamese diacritics stack", () => {
    const lh = Number(/--lh-body:\s*([\d.]+)/.exec(css)![1]);
    expect(lh).toBeGreaterThanOrEqual(1.7);
  });
});

describe("v3 type scale and tap targets", () => {
  it("body text is 16px — the norm across 4 of 5 major docs sites measured", () => {
    expect(/--t-md:\s*16px/.test(css)).toBe(true);
  });

  it("has a --tap token for the WCAG 2.2 SC 2.5.8 target size", () => {
    const tap = Number(/--tap:\s*(\d+)px/.exec(css)![1]);
    expect(tap).toBeGreaterThanOrEqual(24);
  });

  it("has a serif font for headings", () => {
    expect(css).toMatch(/--serif:/);
  });

  it("Georgia is NOT in the serif stack — it lacks precomposed Vietnamese glyphs", () => {
    const serif = /--serif:([^;]+);/.exec(css)![1];
    expect(serif).not.toMatch(/Georgia/i);
  });

  it("tokens that change role with the theme: --eyebrow exists in all three blocks", () => {
    expect(css.match(/--eyebrow:/g)!.length).toBe(3);
  });

  it("the old purple is gone", () => {
    expect(css).not.toMatch(/#4B2ED4|#9B7CFF/i);
  });
});

/* ------------------------------------------------------------------
   The type scale must be FOLLOWED, not merely declared.

   The tests above only read tokens.css: they prove the scale exists,
   not that any component uses it. Six spots once slipped through that
   gap (AppCard.name 14.5px, FeatureGrid.name 13.5px, UploadDropzone.title
   12.5px, AppHero.slug 10.5px, TopBar.brandMark 10px, AdminShell.scope
   10px) — a green scale while the UI still had ad-hoc sizes below the floor.
   ------------------------------------------------------------------ */

const SCALE = Object.fromEntries(
  [...css.matchAll(/(--t-[a-z0-9]+):\s*([\d.]+)px/g)].map((m) => [m[1], Number(m[2])]),
);

/** The smallest font size for prose. */
const FLOOR = 14;
/** The only exception: UPPERCASE mono labels read larger than their nominal size. */
const MONO_UPPER_MIN = 11;

/** Every `*.module.css` under `src`, as a relative path with `/` separators. */
function moduleStylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return moduleStylesheets(full);
    return entry.name.endsWith(".module.css") ? [full] : [];
  });
}

/**
 * Legacy debt — files NOT yet brought onto the scale, skipped on purpose so this
 * test does not block other work. The list may only shrink, never grow: fix a
 * file and delete its line here. A NEW file is not on the list, so it is checked
 * from its first line.
 */
const KNOWN_DEBT = new Set<string>([]);

type Finding = { file: string; selector: string; size: number; why: string };

/**
 * One innermost declaration block: this regex skips an enclosing `@media { … }`
 * because the body match `[^{}]*` contains no braces.
 */
function findings(file: string, source: string): Finding[] {
  const out: Finding[] = [];

  for (const [, selector, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const mono = /var\(--mono\)/.test(body);
    const upper = /text-transform:\s*uppercase/.test(body);

    for (const [, raw] of body.matchAll(/font-size:\s*([^;]+);/g)) {
      const token = /var\((--t-[a-z0-9]+)\)/.exec(raw);
      const size = token ? SCALE[token[1]] : Number(/^([\d.]+)px$/.exec(raw.trim())?.[1]);
      if (!Number.isFinite(size)) continue;

      const at = { file, selector: selector.trim().split("\n").pop()!.trim(), size };

      if (!Number.isInteger(size) && size !== 11.5) {
        out.push({ ...at, why: "off-scale fractional size — the scale is integers only (11.5px is the mono exception)" });
      } else if (size < MONO_UPPER_MIN) {
        out.push({ ...at, why: `below ${MONO_UPPER_MIN}px — no size may go lower than that` });
      } else if (size < MONO_UPPER_MIN + 1 && !(mono && upper)) {
        out.push({ ...at, why: "11–11.5px is reserved for UPPERCASE mono labels" });
      } else if (size < FLOOR && !mono) {
        out.push({ ...at, why: `below the ${FLOOR}px floor and not a mono label — prose starts at ${FLOOR}px` });
      }
    }
  }

  return out;
}

describe("components follow the type scale", () => {
  it("no file uses a font size off the scale or below the floor", () => {
    const bad = moduleStylesheets("src")
      .filter((file) => !KNOWN_DEBT.has(file))
      .flatMap((file) => findings(file, readFileSync(file, "utf8")))
      .map((f) => `${f.file} · ${f.selector} · ${f.size}px — ${f.why}`);

    expect(bad).toEqual([]);
  });

  /*
   * Deliberately does NOT assert "every file on the debt list still violates".
   * That check keeps the list from rotting, but it goes red the moment another session
   * finishes cleaning a file — and turning someone else's work red for a reason unrelated
   * to their change is the higher cost. This only guards against path typos:
   * a mistyped line would silently exempt exactly zero files.
   */
  it("every path on the legacy debt list exists", () => {
    const all = new Set(moduleStylesheets("src"));
    expect([...KNOWN_DEBT].filter((file) => !all.has(file))).toEqual([]);
  });
});
