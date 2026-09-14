// src/app/api/search-index/[locale]/route.ts
import { listAppsWithBody, listDocsWithBody } from "@/content";
import { buildSearchIndex, type SearchDoc, type SearchIndexInput } from "@/lib/search-index";

/**
 * The index is NOT built at build time. This stays a route handler rather than
 * `generateStaticParams` (`NFR-PERF-05`) so a search always reflects the content
 * files as they are right now, never a stale build.
 *
 * No `unstable_cache` here, unlike the database-backed version this replaces. That
 * version cached by tag and relied on `mutations.ts` calling `revalidateTag` after
 * a save; there is no database and no save path left to call it, so a cached copy
 * would never be invalidated and would serve the first request's content forever —
 * worse than reading the files on every request. The content lives in files, and a
 * new deploy is what changes them, so there is nothing here to cache against.
 *
 * Built from one `readGroup` pass per group (`listAppsWithBody` / `listDocsWithBody`,
 * both per-locale) rather than a per-entry `getApp`/`getDocPage` call each — the
 * latter is `readOne`, which re-scans and re-reads the whole group directory on
 * every call, so N entries meant N+1 directory scans per group per request (I-3).
 * Using the per-locale readers also fixes I-1: the previous version enumerated
 * documents with `listDocSlugs()`, hardcoded to the default locale, which silently
 * dropped any document that exists only in the requested (non-default) locale from
 * that locale's index.
 *
 * `root` is optional and forwarded to the content readers only for tests — the
 * route handler below never passes one, so production always reads `content/`.
 */
export async function buildContentSearchIndex(locale: string, root?: string): Promise<SearchDoc[]> {
  const apps = (await listAppsWithBody(locale, root)).map((a) => ({
    slug: a.slug,
    name: a.name,
    sections: [{ title: "", body: a.body }],
  }));

  const docs = (await listDocsWithBody(locale, root)).map((d) => ({
    slug: d.slug,
    title: d.title,
    sections: [{ title: "", body: d.body }],
  }));

  const input: SearchIndexInput = { apps, docs, locale };
  return buildSearchIndex(input);
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return Response.json(await buildContentSearchIndex(locale));
}
