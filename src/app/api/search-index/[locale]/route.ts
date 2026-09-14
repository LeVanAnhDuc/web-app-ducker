// src/app/api/search-index/[locale]/route.ts
import { getApp, getDocPage, listApps, listDocSlugs } from "@/content";
import { buildSearchIndex, type SearchIndexInput } from "@/lib/search-index";

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
 */
async function buildContentSearchIndex(locale: string) {
  const appCards = await listApps(locale);
  const apps = (
    await Promise.all(
      appCards.map(async (card) => {
        const detail = await getApp(card.slug, locale);
        if (!detail) return null;
        return { slug: card.slug, name: card.name, sections: [{ title: "", body: detail.body }] };
      }),
    )
  ).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const docSlugs = await listDocSlugs();
  const docs = (
    await Promise.all(
      docSlugs.map(async (slug) => {
        const detail = await getDocPage(slug, locale);
        if (!detail) return null;
        return { slug, title: detail.title, sections: [{ title: "", body: detail.body }] };
      }),
    )
  ).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const input: SearchIndexInput = { apps, docs, locale };
  return buildSearchIndex(input);
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return Response.json(await buildContentSearchIndex(locale));
}
