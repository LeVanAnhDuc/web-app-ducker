import { createAnchorAllocator } from "@/lib/slug";
import { readGroup, readOne } from "./read";
import { defaultLocale } from "@/i18n/locales";
import { join } from "node:path";

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

/** Matches the fence delimiter line itself; the info string (e.g. `bash`) is ignored. */
const FENCE_DELIMITER = /^\s*([`~]{3,})/;

export function buildToc(markdown: string): TocItem[] {
  // Disambiguation lives in `createAnchorAllocator`, shared with the README path.
  const anchorFor = createAnchorAllocator();
  const out: TocItem[] = [];

  // Fenced code blocks (``` or ~~~, 3+ chars, ignoring the info string) must not have
  // their contents read as headings. A fence closes only on a delimiter of the same
  // character as the one that opened it.
  let fenceChar: string | null = null;

  for (const line of markdown.split("\n")) {
    const fenceMatch = FENCE_DELIMITER.exec(line);
    if (fenceMatch) {
      const char = fenceMatch[1]![0]!;
      if (fenceChar === null) {
        fenceChar = char;
      } else if (char === fenceChar) {
        fenceChar = null;
      }
      continue;
    }
    if (fenceChar !== null) continue;

    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const title = m[1]!;
    out.push({ anchor: anchorFor(title), title });
  }
  return out;
}

export async function listDocSlugs(): Promise<string[]> {
  return (await readGroup("docs", defaultLocale)).map((e) => e.data.slug!);
}

export async function listDocs(locale: string, root?: string): Promise<{ slug: string; title: string }[]> {
  const contentRoot = root ? join(root) : undefined;
  return (await readGroup("docs", locale, contentRoot)).map((e) => ({ slug: e.data.slug!, title: e.data.name }));
}

export type DocSearchEntry = { slug: string; title: string; body: string };

/**
 * Every doc's slug, title and body for one locale, in a single `readGroup` pass.
 *
 * Exists for the search index (I-1/I-3): `readGroup` already resolves per-locale
 * fallback correctly (unlike `listDocSlugs`, which is hardcoded to `defaultLocale`
 * and so drops an English-only document from the English index), and this avoids
 * one `readOne` — a full extra directory scan — per document.
 */
export async function listDocsWithBody(locale: string, root?: string): Promise<DocSearchEntry[]> {
  return (await readGroup("docs", locale, root)).map((e) => ({
    slug: e.data.slug!,
    title: e.data.name,
    body: e.body,
  }));
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
