# File-backed registry — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Postgres/Prisma/Auth.js/R2 backend with content files in the
repository, delete the administration surface, and grow the catalogue from 6 entries to 22.

**Architecture:** The public components already consume plain types — `AppCard`,
`AppDetail`, `DocPageDetail`, `NavRow` — and the two heaviest helpers,
`buildSearchIndex()` and `buildNavTree()`, are already **pure functions that take data,
not a database**. So this is a data-source swap, not a rewrite: a new `src/content/`
module reads `content/**.mdx` and returns those same types, and the public pages change
one import line each. Everything Prisma-shaped is then deleted.

**Tech Stack:** Next.js 16 · gray-matter (frontmatter) · zod (already a dependency, see
`src/lib/schemas.ts`) · vitest · Playwright · pnpm 10

**Spec:** [`design.md`](design.md)

## Global Constraints

- **Toolchain is pnpm 10.** `pnpm install --frozen-lockfile`, `pnpm exec …`, never `npx`.
- **Vitest runs `--maxWorkers=1`.** A failure under a parallel run is not real until it
  repeats single-worker. Component tests use `fireEvent`, never `userEvent.type`.
- **`pnpm typecheck` is separate from tests.** A green suite does not prove `tsc` clean.
  Run `pnpm typecheck` and `pnpm build` before claiming any task complete.
- **Everything is written in English** — code, comments, identifiers, commit messages.
  Content files under `content/` carry Vietnamese and English product copy; that is data.
- **Display names are capitalised with spaces** (`Ducker ID`), slugs are secondary and
  mono. `MASTER.md` §5. Never derive a display name from a slug.
- **Never invent a description.** `Tier List`, `Task Management` and `Duck Strike` have
  none; they ship with `status: planned` and no `tagline`. ADR-0009.
- **The five status values are closed:** `core · connected · standalone · planned ·
  private`. A sixth must fail the build, not render unstyled.
- **Do not touch visual design in this branch.** No CSS module, no token, no colour.
  That is the second branch.

---

## File structure

| Path | Responsibility |
| --- | --- |
| `content/apps/<slug>.<locale>.mdx` | one application record per locale |
| `content/games/<slug>.<locale>.mdx` | one game record per locale |
| `content/docs/<slug>.<locale>.mdx` | one standalone guide per locale |
| `content/nav.ts` | the navigation tree, hand-written, typed |
| `src/content/frontmatter.ts` | zod schema + parse of one file's frontmatter |
| `src/content/read.ts` | filesystem walk, locale resolution, fallback |
| `src/content/registry.ts` | `listApps` · `listGames` · `getApp` — returns `AppCard` / `AppDetail` |
| `src/content/docs.ts` | `getDocPage` · `listDocSlugs` — returns `DocPageDetail` |
| `src/content/nav.ts` | `listNavRows()` → `NavRow[]`, feeding the existing `buildNavTree` |
| `src/content/index.ts` | the single public entry point the app imports |

**Deleted** (Tasks 8–9): `src/app/[locale]/(admin)/**`, `src/components/admin/**`,
`src/server/**`, `prisma/**`.

---

### Task 1: Frontmatter schema

**Files:**
- Create: `src/content/frontmatter.ts`
- Test: `src/content/frontmatter.test.ts`

**Interfaces:**
- Consumes: `statusValues`, `appKindValues` from `@/lib/schemas` (unchanged); `Integration` is redeclared here so `src/content/` never imports from `src/server/`.
- Produces: `entryFrontmatter` (zod schema), `type EntryFrontmatter`, `parseEntry(raw: string, file: string): { data: EntryFrontmatter; body: string }`

- [ ] **Step 1: Write the failing test**

```ts
// src/content/frontmatter.test.ts
import { describe, expect, it } from "vitest";
import { parseEntry } from "./frontmatter";

const ok = `---
name: Ducker ID
slug: web-app-ducker-id
status: core
repo: https://github.com/LeVanAnhDuc/web-app-ducker-id
tagline: Identity provider.
order: 10
---
Body text.`;

describe("parseEntry", () => {
  it("reads the frontmatter and keeps the body", () => {
    const { data, body } = parseEntry(ok, "apps/web-app-ducker-id.en.mdx");
    expect(data.name).toBe("Ducker ID");
    expect(data.status).toBe("core");
    expect(data.order).toBe(10);
    expect(body.trim()).toBe("Body text.");
  });

  it("allows a planned entry with no tagline and no repo", () => {
    const raw = `---\nname: Tier List\nstatus: planned\norder: 90\n---\n`;
    const { data } = parseEntry(raw, "apps/tier-list.vi.mdx");
    expect(data.tagline).toBeUndefined();
    expect(data.slug).toBeUndefined();
  });

  it("rejects a status outside the five, naming the file", () => {
    const raw = `---\nname: X\nstatus: archived\norder: 1\n---\n`;
    expect(() => parseEntry(raw, "apps/x.vi.mdx")).toThrow(/apps\/x\.vi\.mdx/);
    expect(() => parseEntry(raw, "apps/x.vi.mdx")).toThrow(/status/);
  });

  it("rejects a display name that is really a slug", () => {
    const raw = `---\nname: web-app-match-cv\nstatus: connected\norder: 1\n---\n`;
    expect(() => parseEntry(raw, "apps/match-cv.vi.mdx")).toThrow(/display name/i);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/content/frontmatter.test.ts --maxWorkers=1`
Expected: FAIL — `Failed to resolve import "./frontmatter"`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/content/frontmatter.ts
import matter from "gray-matter";
import { z } from "zod";

/** The five integration states. Closed on purpose: a sixth must fail the build
 *  rather than render an unstyled chip. MASTER.md §1. */
export const integrationValues = ["core", "connected", "standalone", "planned", "private"] as const;
export type Integration = (typeof integrationValues)[number];

export const entryFrontmatter = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  status: z.enum(integrationValues),
  repo: z.string().url().optional(),
  tagline: z.string().min(1).optional(),
  order: z.number().int(),
  techStack: z.array(z.string()).default([]),
  /** Only "connected" entries carry this; it draws the branch under Ducker ID. */
  parent: z.string().optional(),
});

export type EntryFrontmatter = z.infer<typeof entryFrontmatter>;

export function parseEntry(raw: string, file: string): { data: EntryFrontmatter; body: string } {
  const { data, content } = matter(raw);
  const parsed = entryFrontmatter.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`${file}: ${issue.path.join(".") || "frontmatter"} — ${issue.message}`);
  }
  // A slug in the name slot survives every type check and looks like real data
  // on the page, so it is caught here instead. MASTER.md §5.
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(parsed.data.name)) {
    throw new Error(`${file}: "${parsed.data.name}" is a slug, not a display name`);
  }
  return { data: parsed.data, body: content };
}
```

- [ ] **Step 4: Add the dependency and run the test**

Run: `pnpm add gray-matter && pnpm exec vitest run src/content/frontmatter.test.ts --maxWorkers=1`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/content/frontmatter.ts src/content/frontmatter.test.ts package.json pnpm-lock.yaml
git commit -m "feat(content): parse and validate entry frontmatter"
```

---

### Task 2: Reading the file tree with locale fallback

**Files:**
- Create: `src/content/read.ts`
- Test: `src/content/read.test.ts`

**Interfaces:**
- Consumes: `parseEntry`, `EntryFrontmatter` (Task 1); `defaultLocale`, `locales` from `@/i18n/locales.generated`.
- Produces: `readGroup(group: "apps" | "games" | "docs", locale: string): Promise<ReadEntry[]>` and `readOne(group, slug, locale): Promise<ReadEntry | null>`, where
  `type ReadEntry = { data: EntryFrontmatter; body: string; locale: string; isFallback: boolean; file: string }`.

`isFallback` is the whole point of this task: `FR-05` renders a "missing translation"
badge from it, and it is what `ADR-0003`'s translation table used to provide.

- [ ] **Step 1: Write the failing test**

```ts
// src/content/read.test.ts
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
});

describe("readGroup", () => {
  it("returns entries ordered by `order`", async () => {
    const rows = await readGroup("apps", "vi", root);
    expect(rows.map((r) => r.data.name)).toEqual(["Alpha", "Beta"]);
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
});

describe("readOne", () => {
  it("returns null for an unknown slug rather than throwing", async () => {
    expect(await readOne("apps", "nope", "vi", root)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/content/read.test.ts --maxWorkers=1`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/content/read.ts
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { defaultLocale } from "@/i18n/locales.generated";
import { parseEntry, type EntryFrontmatter } from "./frontmatter";

export type Group = "apps" | "games" | "docs";

export type ReadEntry = {
  data: EntryFrontmatter;
  body: string;
  /** The locale actually served — may differ from the one asked for. */
  locale: string;
  isFallback: boolean;
  file: string;
};

const CONTENT_ROOT = join(process.cwd(), "content");

/** `<slug>.<locale>.mdx` — the slug may itself contain dots, so split from the right. */
function splitName(file: string): { slug: string; locale: string } | null {
  const m = /^(.*)\.([a-z]{2})\.mdx$/.exec(file);
  return m ? { slug: m[1], locale: m[2] } : null;
}

export async function readGroup(group: Group, locale: string, root = CONTENT_ROOT): Promise<ReadEntry[]> {
  let files: string[];
  try {
    files = await readdir(join(root, group));
  } catch {
    return []; // a group with no directory is empty, not an error
  }

  const bySlug = new Map<string, Map<string, string>>();
  for (const file of files) {
    const parts = splitName(file);
    if (!parts) continue;
    if (!bySlug.has(parts.slug)) bySlug.set(parts.slug, new Map());
    bySlug.get(parts.slug)!.set(parts.locale, file);
  }

  const out: ReadEntry[] = [];
  for (const [slug, byLocale] of bySlug) {
    const served = byLocale.has(locale) ? locale : defaultLocale;
    const file = byLocale.get(served);
    if (!file) continue; // no default translation either — skip, never invent a label
    const raw = await readFile(join(root, group, file), "utf8");
    const { data, body } = parseEntry(raw, `${group}/${file}`);
    out.push({ data: { ...data, slug: data.slug ?? slug }, body, locale: served, isFallback: served !== locale, file });
  }
  return out.sort((a, b) => a.data.order - b.data.order);
}

export async function readOne(group: Group, slug: string, locale: string, root = CONTENT_ROOT): Promise<ReadEntry | null> {
  const all = await readGroup(group, locale, root);
  return all.find((e) => e.data.slug === slug || e.file.startsWith(`${slug}.`)) ?? null;
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run src/content/read.test.ts --maxWorkers=1`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/content/read.ts src/content/read.test.ts
git commit -m "feat(content): read the content tree with locale fallback"
```

---

### Task 3: The registry API — `AppCard` and `AppDetail`

**Files:**
- Create: `src/content/registry.ts`, `src/content/index.ts`
- Test: `src/content/registry.test.ts`

**Interfaces:**
- Consumes: `readGroup`, `readOne`, `ReadEntry` (Task 2); `buildToc` from `@/server/content/resolve` is **not** used — `resolve.ts` dies with the server layer, so the toc is rebuilt in Task 4 from markdown headings.
- Produces, re-exported from `src/content/index.ts`:
  - `listApps(locale: string): Promise<AppCard[]>`
  - `listGames(locale: string): Promise<AppCard[]>`
  - `getApp(slug: string, locale: string): Promise<AppDetail | null>`
  - types `AppCard`, `AppDetail`, `Integration` — **same field names as today's `src/server/content/queries.ts`**, so the public components need no edit beyond their import path.

- [ ] **Step 1: Write the failing test**

```ts
// src/content/registry.test.ts
import { describe, expect, it } from "vitest";
import { listApps, listGames, getApp } from "./registry";

describe("listApps", () => {
  it("returns every application in order, Ducker ID first", async () => {
    const apps = await listApps("vi");
    expect(apps).toHaveLength(10);
    expect(apps[0].name).toBe("Ducker ID");
    expect(apps[0].integration).toBe("core");
  });

  it("leaves tagline null for the three entries that have no description", async () => {
    const apps = await listApps("vi");
    const planned = apps.filter((a) => a.integration === "planned");
    expect(planned.map((a) => a.name).sort()).toEqual(["Task Management", "Tier List"]);
    expect(planned.every((a) => a.tagline === null)).toBe(true);
  });
});

describe("listGames", () => {
  it("returns the twelve duck games", async () => {
    const games = await listGames("vi");
    expect(games).toHaveLength(12);
    expect(games.find((g) => g.name === "Duck Strike")?.tagline).toBeNull();
  });
});

describe("getApp", () => {
  it("returns null for an unknown slug", async () => {
    expect(await getApp("no-such-app", "vi")).toBeNull();
  });
});
```

These assertions depend on the content files, which Task 6 writes. Expect them to fail
on counts until then — that is the point of writing them now.

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/content/registry.test.ts --maxWorkers=1`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/content/registry.ts
import { readGroup, readOne, type ReadEntry } from "./read";
import type { Integration } from "./frontmatter";

export type { Integration } from "./frontmatter";

export type AppCard = {
  slug: string;
  name: string;
  tagline: string | null;
  integration: Integration;
  techStack: string[];
  repoUrl: string | null;
  isRepoPrivate: boolean;
  /** True when this entry is drawn as a branch under the identity provider. */
  parent: string | null;
};

export type AppDetail = AppCard & {
  body: string;
  locale: string;
  isFallback: boolean;
};

function toCard(e: ReadEntry): AppCard {
  return {
    slug: e.data.slug!,
    name: e.data.name,
    tagline: e.data.tagline ?? null,
    integration: e.data.status,
    techStack: e.data.techStack,
    repoUrl: e.data.repo ?? null,
    isRepoPrivate: e.data.repo === undefined && e.data.status !== "planned",
    parent: e.data.parent ?? null,
  };
}

export async function listApps(locale: string): Promise<AppCard[]> {
  return (await readGroup("apps", locale)).map(toCard);
}

export async function listGames(locale: string): Promise<AppCard[]> {
  return (await readGroup("games", locale)).map(toCard);
}

export async function getApp(slug: string, locale: string): Promise<AppDetail | null> {
  const entry = (await readOne("apps", slug, locale)) ?? (await readOne("games", slug, locale));
  if (!entry) return null;
  return { ...toCard(entry), body: entry.body, locale: entry.locale, isFallback: entry.isFallback };
}
```

```ts
// src/content/index.ts
export * from "./registry";
export * from "./docs";
export * from "./nav";
export type { Integration } from "./frontmatter";
```

`src/content/index.ts` will not typecheck until Tasks 4 and 5 add `docs.ts` and `nav.ts`.
Create it in Task 5, not here — this step only writes `registry.ts`.

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run src/content/registry.test.ts --maxWorkers=1`
Expected: the `getApp` null case PASSES; the count assertions FAIL until Task 6.

- [ ] **Step 5: Commit**

```bash
git add src/content/registry.ts src/content/registry.test.ts
git commit -m "feat(content): registry reader returning AppCard and AppDetail"
```

---

### Task 4: Doc pages and the table of contents

**Files:**
- Create: `src/content/docs.ts`
- Test: `src/content/docs.test.ts`

**Interfaces:**
- Consumes: `readGroup`, `readOne` (Task 2).
- Produces: `getDocPage(slug, locale): Promise<DocPageDetail | null>`, `listDocSlugs(): Promise<string[]>`, `buildToc(markdown: string): TocItem[]`, types `DocPageDetail`, `TocItem = { anchor: string; title: string }`.

The old toc came from `section.anchor` columns. With markdown bodies it comes from `##`
headings, and duplicate anchors must be disambiguated — two sections called "Cài đặt"
previously collided and the old `resolve.ts` asserted against it.

- [ ] **Step 1: Write the failing test**

```ts
// src/content/docs.test.ts
import { describe, expect, it } from "vitest";
import { buildToc, getDocPage } from "./docs";

describe("buildToc", () => {
  it("takes level-2 headings only", () => {
    const toc = buildToc("# Title\n\n## One\n\ntext\n\n### Deep\n\n## Two\n");
    expect(toc).toEqual([
      { anchor: "one", title: "One" },
      { anchor: "two", title: "Two" },
    ]);
  });

  it("disambiguates a repeated heading instead of emitting a duplicate anchor", () => {
    const toc = buildToc("## Cài đặt\n\n## Cài đặt\n");
    expect(toc.map((t) => t.anchor)).toEqual(["cai-dat", "cai-dat-2"]);
  });
});

describe("getDocPage", () => {
  it("returns null for an unknown slug", async () => {
    expect(await getDocPage("nope", "vi")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run src/content/docs.test.ts --maxWorkers=1`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/content/docs.ts
import { slugify } from "@/lib/slug";
import { readGroup, readOne } from "./read";

export type TocItem = { anchor: string; title: string };

export type DocPageDetail = {
  slug: string;
  title: string;
  description: string | null;
  body: string;
  toc: TocItem[];
  locale: string;
  isFallback: boolean;
};

export function buildToc(markdown: string): TocItem[] {
  const seen = new Map<string, number>();
  const out: TocItem[] = [];
  for (const line of markdown.split("\n")) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const title = m[1];
    const base = slugify(title);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    out.push({ anchor: n === 1 ? base : `${base}-${n}`, title });
  }
  return out;
}

export async function listDocSlugs(): Promise<string[]> {
  const { defaultLocale } = await import("@/i18n/locales.generated");
  return (await readGroup("docs", defaultLocale)).map((e) => e.data.slug!);
}

export async function getDocPage(slug: string, locale: string): Promise<DocPageDetail | null> {
  const entry = await readOne("docs", slug, locale);
  if (!entry) return null;
  return {
    slug: entry.data.slug!,
    title: entry.data.name,
    description: entry.data.tagline ?? null,
    body: entry.body,
    toc: buildToc(entry.body),
    locale: entry.locale,
    isFallback: entry.isFallback,
  };
}
```

If `slugify` in `src/lib/slug.ts` does not strip Vietnamese diacritics (`Cài đặt` →
`cai-dat`), fix it there and add the case to `src/lib/slug.test.ts` — do not work around
it here.

- [ ] **Step 4: Run the tests**

Run: `pnpm exec vitest run src/content/docs.test.ts src/lib/slug.test.ts --maxWorkers=1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/docs.ts src/content/docs.test.ts src/lib/slug.ts src/lib/slug.test.ts
git commit -m "feat(content): doc page reader with a heading-derived toc"
```

---

### Task 5: Navigation and the search index, from files

**Files:**
- Create: `content/nav.ts`, `src/content/nav.ts`, `src/content/index.ts`
- Modify: `src/app/api/search-index/[locale]/route.ts`
- Test: `src/content/nav.test.ts`

**Interfaces:**
- Consumes: `listApps`, `listGames` (Task 3), `listDocSlugs` (Task 4); the existing pure
  `buildSearchIndex(input: SearchIndexInput): SearchDoc[]` from `@/lib/search-index` and
  `buildNavTree(rows, locale, fallback)` from — **note** — `@/server/content/nav`, which
  must be MOVED to `src/content/nav-tree.ts` in this task, since `src/server/` is deleted
  in Task 9. Move the file and its test unchanged; do not rewrite them.
- Produces: `listNavRows(locale: string): Promise<NavRow[]>`, `buildContentSearchIndex(locale: string): Promise<SearchDoc[]>`.

- [ ] **Step 1: Move the pure nav-tree helpers out of the server layer**

```bash
git mv src/server/content/nav.ts src/content/nav-tree.ts
git mv src/server/content/nav.test.ts src/content/nav-tree.test.ts
```

Then fix the import paths inside both files and in every consumer:
`rg -l "server/content/nav" src | xargs sed -i 's#@/server/content/nav#@/content/nav-tree#g'`

- [ ] **Step 2: Run the moved tests unchanged**

Run: `pnpm exec vitest run src/content/nav-tree.test.ts --maxWorkers=1`
Expected: PASS — identical results to before the move. If anything fails, the move broke
an import; fix the import, never the test.

- [ ] **Step 3: Write the failing test for the file-backed nav**

```ts
// src/content/nav.test.ts
import { describe, expect, it } from "vitest";
import { listNavRows } from "./nav";
import { buildNavTree } from "./nav-tree";

describe("listNavRows", () => {
  it("produces a tree with one root per group", async () => {
    const tree = buildNavTree(await listNavRows("vi"), "vi", "vi");
    expect(tree.map((n) => n.label)).toEqual(["Ứng dụng", "Trò chơi", "Tài liệu"]);
  });

  it("puts every app under the apps container", async () => {
    const tree = buildNavTree(await listNavRows("vi"), "vi", "vi");
    expect(tree[0].children).toHaveLength(10);
  });

  it("satisfies I5 — every container has a default-locale label", async () => {
    const rows = await listNavRows("vi");
    const containers = rows.filter((r) => r.kind === "CONTAINER");
    expect(containers.every((c) => c.labels.some((l) => l.locale === "vi" && l.label.length > 0))).toBe(true);
  });
});
```

- [ ] **Step 4: Write `content/nav.ts` and `src/content/nav.ts`**

```ts
// content/nav.ts — the tree, hand-written. Three containers; children are derived
// from the content files so adding an app never means editing this file.
export const navGroups = [
  { id: "apps", labels: { vi: "Ứng dụng", en: "Applications" }, group: "apps" as const },
  { id: "games", labels: { vi: "Trò chơi", en: "Games" }, group: "games" as const },
  { id: "docs", labels: { vi: "Tài liệu", en: "Documentation" }, group: "docs" as const },
];
```

```ts
// src/content/nav.ts
import { navGroups } from "../../content/nav";
import { listApps, listGames } from "./registry";
import { listDocSlugs } from "./docs";
import type { NavRow } from "./nav-tree";

export async function listNavRows(locale: string): Promise<NavRow[]> {
  const rows: NavRow[] = [];
  for (const [i, g] of navGroups.entries()) {
    rows.push({
      id: g.id,
      parentId: null,
      order: i,
      kind: "CONTAINER",
      href: null,
      labels: Object.entries(g.labels).map(([l, label]) => ({ locale: l, label })),
    });
  }
  const push = (items: { slug: string; name: string }[], parentId: string, base: string) =>
    items.forEach((it, i) =>
      rows.push({
        id: `${parentId}:${it.slug}`,
        parentId,
        order: i,
        kind: "APP",
        href: `${base}/${it.slug}`,
        labels: [{ locale, label: it.name }],
      }),
    );
  push(await listApps(locale), "apps", "/apps");
  push(await listGames(locale), "games", "/games");
  push((await listDocSlugs()).map((s) => ({ slug: s, name: s })), "docs", "/docs");
  return rows;
}
```

Match the `NavRow` field names to `src/content/nav-tree.ts` exactly — read that file
before writing this one; the shape above is the shape at the time of planning and the
moved file is authoritative.

- [ ] **Step 5: Point the search-index route at the files**

In `src/app/api/search-index/[locale]/route.ts`, replace the database read with
`buildSearchIndex` fed from `listApps` / `listGames` / the doc bodies. Keep it a route
handler, never `generateStaticParams` — `NFR-PERF-05`.

- [ ] **Step 6: Run the tests**

Run: `pnpm exec vitest run src/content src/lib/search-index.test.ts --maxWorkers=1`
Expected: PASS except the Task 6 content-count assertions.

- [ ] **Step 7: Commit**

```bash
git add content/nav.ts src/content src/app/api/search-index
git commit -m "feat(content): navigation rows and search index built from files"
```

---

### Task 6: Author the 22 catalogue entries

**Files:**
- Create: `content/apps/*.vi.mdx` (10), `content/games/*.vi.mdx` (12), `content/docs/*.vi.mdx` (4)

**Interfaces:**
- Consumes: the schema from Task 1.
- Produces: the data every later assertion counts.

**Source of every field — do not invent any of it.** Names and slugs come from the
workspace `CLAUDE.md` table; taglines are translated from each repository's own
`README.md` first prose line; the three entries whose own `overview.md` is 🔴 empty
(`Tier List`, `Task Management`, `Duck Strike`) get `status: planned`, no `repo`, no
`tagline`.

- [ ] **Step 1: Write the ten application files**

| `order` | `name` | `slug` | `status` | `parent` |
| --- | --- | --- | --- | --- |
| 10 | Ducker ID | `web-app-ducker-id` | core | — |
| 20 | Match CV | `web-app-match-cv` | connected | `web-app-ducker-id` |
| 30 | Shorten Link | `web-app-shorten-link` | connected | `web-app-ducker-id` |
| 40 | Ducker Flow Grid | `web-app-AI-workflow-automation-platform` | standalone | — |
| 50 | Manage Gym | `web-app-manage-gym` | standalone | — |
| 60 | AI Study Coach | `web-app-AI-study-coach` | standalone | — |
| 70 | Calculate Badminton | `web-app-calculate-badminton` | standalone | — |
| 80 | Ducker | `web-app-ducker` | standalone | — |
| 90 | Tier List | — | planned | — |
| 100 | Task Management | — | planned | — |

- [ ] **Step 2: Write the twelve game files**

`order` 10…120 in this sequence: Duck Caro, Duck Defense, Duck Drift, Duck Flap, Duck
Match, Duck Mines, Duck Push, Duck Runner, Duck Solitaire, Duck Stack, Duck Stomp, Duck
Strike. All `status: standalone` and `repo: https://github.com/LeVanAnhDuc/<slug>` except
**Duck Strike**, which is `status: planned` with no `repo` and no `tagline`.

- [ ] **Step 3: Move the four existing guides**

`ecosystem-overview`, `oauth-integration-guide`, `add-new-app-guide` and the `home`
record move out of `prisma/seed.ts` into `content/docs/*.vi.mdx`, body text preserved
verbatim. `home` was a deliberate draft that no route renders (`/docs/home` 404s on
purpose) — carry that forward by simply not creating `content/docs/home.vi.mdx`, and
delete `LANDING_DOC_SLUG` with the server layer. Note the removal in `backlog.md`; this
closes the open `FR-20` question by dropping it.

- [ ] **Step 4: Run the registry tests that were failing on counts**

Run: `pnpm exec vitest run src/content --maxWorkers=1`
Expected: PASS — 10 apps, 12 games, three entries with `tagline === null`.

- [ ] **Step 5: Commit**

```bash
git add content
git commit -m "feat(content): author the 22 catalogue entries"
```

---

### Task 7: Point the public pages at `src/content/`

**Files:**
- Modify: `src/app/[locale]/(public)/page.tsx`, `apps/page.tsx`, `apps/[slug]/page.tsx`, `docs/[slug]/page.tsx`, `layout.tsx`
- Create: `src/app/[locale]/(public)/games/page.tsx`
- Delete: `src/app/[locale]/(public)/apps/[slug]/preview/`
- Test: `e2e/registry.spec.ts`

**Interfaces:**
- Consumes: everything `src/content/index.ts` exports.
- Produces: the rendered routes `/`, `/apps`, `/apps/[slug]`, `/games`, `/docs/[slug]`.

- [ ] **Step 1: Write the failing e2e test**

```ts
// e2e/registry.spec.ts
import { expect, test } from "@playwright/test";

test("the home registry lists both groups", async ({ page }) => {
  await page.goto("/vi");
  await expect(page.getByRole("heading", { name: "Ứng dụng" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trò chơi" })).toBeVisible();
  await expect(page.getByText("Ducker ID")).toBeVisible();
  await expect(page.getByText("Duck Solitaire")).toBeVisible();
});

test("a planned entry shows no invented description", async ({ page }) => {
  await page.goto("/vi/apps");
  const row = page.getByRole("listitem").filter({ hasText: "Tier List" });
  await expect(row).toContainText("planned");
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm e2e --grep registry`
Expected: FAIL — the games group does not exist yet.

- [ ] **Step 3: Swap the imports and add the games route**

Each public page changes exactly one import — `@/server/content/queries` becomes
`@/content` — plus the home page gains a `listGames(locale)` call and a second group.
`preview/` is deleted outright: `FR-13` is retired, a draft is a branch.

- [ ] **Step 4: Run the full e2e suite**

Run: `pnpm e2e`
Expected: PASS. Any spec that drives `/admin` is deleted in Task 8, not fixed here.

- [ ] **Step 5: Commit**

```bash
git add src/app e2e
git commit -m "feat(registry): render apps and games from the content files"
```

---

### Task 8: Delete the administration surface

**Files:**
- Delete: `src/app/[locale]/(admin)/**` (58 files), `src/components/admin/**`, every `e2e/*admin*.spec.ts`, every `*.test.tsx` under `src/components/admin/`

- [ ] **Step 1: Delete**

```bash
git rm -r "src/app/[locale]/(admin)" src/components/admin
git rm e2e/admin-*.spec.ts 2>/dev/null || true
```

- [ ] **Step 2: Find what still references it**

Run: `rg -n "components/admin|/admin|requireAdmin|signOut" src e2e --glob '!*.md'`
Expected: only `src/server/auth/**`, which Task 9 deletes. Anything else is a real
dangling reference — fix it now.

- [ ] **Step 3: Typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(admin)!: remove the administration surface

Retires FR-06, FR-07, FR-08, FR-09, FR-10, FR-12, FR-13, FR-17 and FR-21.
See ADR-0019."
```

---

### Task 9: Delete the server layer, Prisma and the dependencies

**Files:**
- Delete: `src/server/**`, `prisma/**`
- Modify: `package.json`, `.env.example`, `prisma.config.ts`, `vitest.config.mts`, `playwright.config.ts`

- [ ] **Step 1: Delete**

```bash
git rm -r src/server prisma prisma.config.ts
pnpm remove @prisma/client @prisma/adapter-pg next-auth @aws-sdk/client-s3 bcryptjs
```

- [ ] **Step 2: Strip the `postinstall` hook**

`package.json`'s `postinstall` runs `prisma generate`. Remove it; there is no schema.

- [ ] **Step 3: Empty `.env.example`**

Every variable goes: `DATABASE_URL`, `DATABASE_URL_TEST`, `AUTH_SECRET`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD_HASH`, `PREVIEW_SECRET`, and the five `R2_*`. Leave the file with a
one-line comment saying the site needs none — a deleted `.env.example` reads as an
oversight, an empty one reads as a decision.

- [ ] **Step 4: Prove the build needs nothing**

```bash
env -u DATABASE_URL -u AUTH_SECRET pnpm build
```

Expected: a complete build. This is `NFR-REL-04`, strengthened — previously the site
rendered *empty* without a database; now there is nothing to be without.

- [ ] **Step 5: Full verification**

Run: `pnpm test:run && pnpm typecheck && pnpm lint && pnpm e2e`
Expected: all green. Record the real counts; do not copy the old numbers from
`backlog.md`.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(server)!: remove Prisma, Auth.js and the object store

See ADR-0018 and ADR-0019."
```

---

### Task 10: Documentation, and the invariants that changed

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `docs/03-design/invariants.md`, `docs/03-design/architecture.md`, `docs/02-requirements/nfr.md`, `docs/05-operations/runbook.md`, `docs/04-state/backlog.md`

- [ ] **Step 1: Retire the invariants that no longer exist**

`I8` (every writing action calls `requireAdmin()`) — no writing actions remain.
`I9` (three doors) — retired in place, with the warning from ADR-0019 §4 that it must
return if a server dependency ever does. `I10`, `I12`, `I13` (migrations, cache
invalidation, stale-while-revalidate) — all Prisma-shaped. Retire in place, never delete
the number.

Add one: **a content file whose `status` is outside the five fails the build.** That is
the new silent-failure risk — an unknown status previously could not exist because the
column was an enum.

- [ ] **Step 2: Update `nfr.md`**

`NFR-SEC-01` … `NFR-SEC-07` mostly become vacuous; mark them so rather than deleting.
`NFR-SEC-07`'s known-wrong 200 retires with the preview. `NFR-REL-05` and `NFR-DATA-03`
retire — content is in git. `NFR-A11Y-06` still blesses mono UPPERCASE labels, which
`MASTER.md` §7 forbids; **leave it for the second branch**, and note the conflict in
`backlog.md` so it is not lost.

- [ ] **Step 3: Rewrite the `README.md` `## Features` section**

Required by the root `CLAUDE.md` for any `feat:` that changes user-facing behaviour, and
this branch changes a lot of it. One short English bullet per change, existing style.
Refresh the stack list and the test counts with the numbers Task 9 actually produced.

- [ ] **Step 4: Update `CLAUDE.md`**

The "Three boundaries" section describes `src/server/content/`, `src/server/auth/` and
`src/server/media/`, none of which exist. The "Four known traps" section's trap 1 (server
actions) and trap 4 (the single test database) go with them. The Prisma `.env` warning
goes. Replace with what is now true: content is files, the build needs no environment.

- [ ] **Step 5: Update `backlog.md`**

Move the Neon / R2 / secrets rows out of §Next up — none of them are needed any more.
Record what this branch leaves owed: the visual redesign, and the `NFR-A11Y-06` conflict.

- [ ] **Step 6: Final verification and commit**

Run: `pnpm test:run && pnpm typecheck && pnpm lint && pnpm build && pnpm e2e`

```bash
git add -A
git commit -m "docs: follow the move to file-backed content"
```

---

## Self-review

**Spec coverage.** design.md §4 content model → Tasks 1, 2, 6. §5 deletions → Tasks 8, 9.
§6 costs → Task 10 (invariants, NFRs) and Task 7 (preview deleted). §7 verification →
Tasks 9 and 10. FR-22 → Tasks 1–6. FR-23 → Tasks 3, 6, 7. FR-24 → Task 5. §8's open
question is deliberately unanswered and needs no task.

**Gap found and closed:** the spec says the public components keep working, but
`buildNavTree` and the `NavRow` type live in `src/server/content/nav.ts`, which §5
deletes. Task 5 Step 1 moves them out before the deletion, rather than leaving Task 9 to
discover it.

**Second gap:** `src/lib/slug.ts` must strip Vietnamese diacritics for the toc anchors.
Task 4 Step 3 names it explicitly instead of assuming.

**Type consistency:** `AppCard`/`AppDetail` keep the field names the public components
already read; `Integration` moves to `src/content/frontmatter.ts` and is re-exported, so
no component imports from `src/server/`. `parent` is new and only the home page reads it.
