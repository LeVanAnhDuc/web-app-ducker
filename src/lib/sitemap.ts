import type { MetadataRoute } from "next";

import { listDocs, listEntries } from "@/content";
import { defaultLocale, locales } from "@/i18n/locales";

/**
 * Every public page, once per locale, each carrying the same `hreflang` set its
 * page declares in `generateMetadata` (FR-16): every enabled locale plus
 * `x-default` on the default one.
 *
 * Paths come from the default locale's content, the same source the pages'
 * `generateStaticParams` use, so the sitemap lists exactly what was prerendered.
 * Releases pages are left out: they are a tab of the entry already listed.
 *
 * `root` is forwarded to the content readers only for tests.
 */
export async function buildSitemap(base: URL, root?: string): Promise<MetadataRoute.Sitemap> {
  const [apps, games, docs] = await Promise.all([
    listEntries("apps", defaultLocale, root),
    listEntries("games", defaultLocale, root),
    listDocs(defaultLocale, root),
  ]);

  const paths = [
    "",
    "/apps",
    "/games",
    ...apps.map((a) => `/apps/${a.slug}`),
    ...games.map((g) => `/games/${g.slug}`),
    ...docs.map((d) => `/docs/${d.slug}`),
  ];

  const at = (locale: string, path: string) => new URL(`/${locale}${path}`, base).href;

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: at(locale, path),
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((code) => [code, at(code, path)])),
          "x-default": at(defaultLocale, path),
        },
      },
    })),
  );
}
