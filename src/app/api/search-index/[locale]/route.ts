// src/app/api/search-index/[locale]/route.ts
import { listDocsWithBody, listEntriesWithBody } from "@/content";
import { locales } from "@/i18n/locales";
import { buildSearchIndex, type SearchDoc, type SearchIndexInput } from "@/lib/search-index";

/**
 * The index is NOT built at build time. This stays a route handler rather than
 * `generateStaticParams` (`NFR-PERF-05`) so a search always reflects the content
 * files as they are right now, never a stale build.
 *
 * Nothing is cached: the content lives in files and only a new deploy changes them,
 * so there is nothing to invalidate a cached copy against.
 *
 * Built from one `readGroup` pass per group (`listEntriesWithBody` /
 * `listDocsWithBody`, all per-locale) rather than a per-entry `getEntry`/`getDocPage`
 * call each — the latter is `readOne`, which re-scans and re-reads the whole group
 * directory on every call, so N entries meant N+1 directory scans per group per
 * request (I-3). The per-locale readers also keep I-1: a document that exists only
 * in the requested (non-default) locale is still in that locale's index.
 *
 * `root` is optional and forwarded to the content readers only for tests — the
 * route handler below never passes one, so production always reads `content/`.
 */
export async function buildContentSearchIndex(locale: string, root?: string): Promise<SearchDoc[]> {
  const asEntry = (e: { slug: string; name: string; body: string }) => ({
    slug: e.slug,
    name: e.name,
    sections: [{ title: "", body: e.body }],
  });

  const [apps, games, docs] = await Promise.all([
    listEntriesWithBody("apps", locale, root),
    listEntriesWithBody("games", locale, root),
    listDocsWithBody(locale, root),
  ]);

  const input: SearchIndexInput = {
    apps: apps.map(asEntry),
    games: games.map(asEntry),
    docs: docs.map((d) => ({ slug: d.slug, title: d.title, sections: [{ title: "", body: d.body }] })),
    locale,
  };
  return buildSearchIndex(input);
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // The proxy skips `/api`, so nothing upstream rejects an unknown locale.
  // Served anyway, it would be the default locale's content under `/<locale>/…`
  // hrefs — every result a 404.
  if (!locales.includes(locale)) return new Response(null, { status: 404 });
  return Response.json(await buildContentSearchIndex(locale));
}
