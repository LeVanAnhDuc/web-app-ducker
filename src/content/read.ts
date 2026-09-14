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
