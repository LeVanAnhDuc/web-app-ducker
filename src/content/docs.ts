import { slugify } from "@/lib/slug";
import { readGroup, readOne } from "./read";
import { defaultLocale } from "@/i18n/locales.generated";

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
