import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DocsShell } from "@/components/docs/DocsShell";
import { FallbackNotice } from "@/components/docs/FallbackNotice";
import { MarkdownBody } from "@/components/docs/MarkdownBody";
import { NavDrawer } from "@/components/docs/NavDrawer";
import { Sidebar } from "@/components/docs/Sidebar";
import { Toc } from "@/components/docs/Toc";
import { defaultLocale, locales } from "@/i18n/locales";
import { findTrail } from "@/content/nav-tree";
import { getDocPage, getNavTree, listDocSlugs } from "@/content";
import { attachHeadingIds, renderMarkdown } from "@/lib/markdown";
import styles from "./page.module.css";

/**
 * Guide page — three columns.
 *
 * Same frame as the app page, minus the features block. The left column is built
 * from the same navigation tree, so a guide that sits next to an app in the same
 * branch still shows up in the right place.
 *
 * ADR-0018: `home` is no longer a reserved slug — `content/docs/home.*.mdx`
 * deliberately does not exist, and FR-20 has been retired. A slug with no file
 * makes `getDocPage` return `null` and this page 404s naturally, no special guard.
 */

type PageParams = { params: Promise<{ locale: string; slug: string }> };

/** `listDocSlugs()` lists `content/docs/` through the default locale. */
export async function generateStaticParams() {
  const docs = await listDocSlugs();
  return locales.flatMap((locale) => docs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });
  const page = await getDocPage(slug, locale);

  if (!page) return { title: `${t("notFound.title")} — ${t("brand.name")}` };

  return {
    title: `${page.title} — ${t("brand.name")}`,
    description: page.description ?? undefined,
    alternates: {
      // Canonical points at itself; `languages` emits every enabled locale plus
      // `x-default` pointing at the default locale.
      canonical: `/${locale}/docs/${slug}`,
      languages: {
        ...Object.fromEntries(locales.map((code) => [code, `/${code}/docs/${slug}`])),
        "x-default": `/${defaultLocale}/docs/${slug}`,
      },
    },
  };
}

export default async function DocPage({ params }: PageParams) {
  const { locale, slug } = await params;
  // Without this line the page falls back to dynamic rendering.
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  const page = await getDocPage(slug, locale);
  if (!page) notFound();

  const currentHref = `/${locale}/docs/${slug}`;

  // The left column is the descendants of the open tab, exactly as on the app page —
  // same tree, same construction. A page not attached to the tree has no left column.
  const trail = findTrail(await getNavTree(locale), currentHref);
  const sidebarNodes = trail[0]?.children ?? [];

  // "Hướng dẫn · Tích hợp" — the path in the tree, minus the last item since that is this page.
  const crumb =
    trail.length > 1
      ? trail
          .slice(0, -1)
          .map((node) => node.label)
          .join(" · ")
      : t("doc.guides");

  const fallbackLabel = t("fallback.notice");

  // R3: `page.toc` is already there (`getDocPage` calls `buildToc`); all that is left
  // is rendering the HTML and attaching the same anchors to each rendered `<h2>`.
  const html = attachHeadingIds(await renderMarkdown(page.body), page.toc);

  return (
    <DocsShell
      sidebar={
        // `undefined`, not an empty `Sidebar` — see the comment on the app page.
        sidebarNodes.length > 0 ? (
          <Sidebar nodes={sidebarNodes} activeHref={currentHref} label={t("sidebar.label")} />
        ) : undefined
      }
      toc={
        page.toc.length > 0 ? <Toc items={page.toc} title={t("toc.title")} /> : undefined
      }
      main={
        <article className={styles.main}>
          <header className={styles.head}>
            <p className={styles.crumb}>{crumb}</p>
            <h1 className={styles.title}>{page.title}</h1>
            <FallbackNotice
              shownLocale={page.locale}
              wantedLocale={locale}
              label={fallbackLabel}
            />
            {page.description ? <p className={styles.lede}>{page.description}</p> : null}
          </header>
          {/* Narrow-screen navigation drawer, placed AT THE TOP OF THE ARTICLE —
              right under the title, before the first content section. On wide
              screens it is fully hidden because the left column does that job.
              Same `sidebarNodes`, same `NavTree`: one tree, shown in two places. */}
          <NavDrawer
            nodes={sidebarNodes}
            activeHref={currentHref}
            labels={{ open: t("sidebar.label"), close: t("search.close") }}
          />

          <MarkdownBody html={html} labels={{ code: t("a11y.codeBlock"), table: t("a11y.table") }} />
        </article>
      }
    />
  );
}
