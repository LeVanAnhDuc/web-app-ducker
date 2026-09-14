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
 * Trang hướng dẫn — ba cột theo mockup màn 03.
 *
 * Cùng khung với trang ứng dụng, khác ở chỗ không có khối tính năng. Cột trái
 * dựng từ đúng cây điều hướng đó, nên một bài hướng dẫn nằm cạnh ứng dụng trong
 * cùng một nhánh vẫn hiện đúng chỗ.
 *
 * ADR-0018: `home` không còn là một slug dành riêng nữa — Task 6 cố tình không
 * viết `content/docs/home.*.mdx`, và FR-20 đã bị gỡ bỏ. Một slug không có file
 * thì `getDocPage` trả `null` và trang này 404 tự nhiên, không cần canh riêng.
 */

type PageParams = { params: Promise<{ locale: string; slug: string }> };

/** `listDocSlugs()` liệt kê `content/docs/` qua locale mặc định. */
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
      // Canonical trỏ chính nó; `languages` phát đủ locale đang bật cộng
      // `x-default` trỏ locale mặc định.
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
  // Thiếu dòng này trang rơi về kết xuất động (ghi chú bàn giao của Task 12).
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  const page = await getDocPage(slug, locale);
  if (!page) notFound();

  const currentHref = `/${locale}/docs/${slug}`;

  // Cột trái là con cháu của tab đang mở, đúng như trang ứng dụng — cùng một cây,
  // cùng một cách dựng. Bài chưa gắn vào cây thì không có cột trái.
  const trail = findTrail(await getNavTree(locale), currentHref);
  const sidebarNodes = trail[0]?.children ?? [];

  // "Hướng dẫn · Tích hợp" — đường đi trong cây, bỏ phần tử cuối vì đó là bài này.
  const crumb =
    trail.length > 1
      ? trail
          .slice(0, -1)
          .map((node) => node.label)
          .join(" · ")
      : t("doc.guides");

  const fallbackLabel = t("fallback.notice");

  // R3: `page.toc` đã có sẵn (`getDocPage` gọi `buildToc` giúp); chỉ còn phải tự
  // kết xuất HTML và gắn cùng anchor vào từng `<h2>` đã kết xuất.
  const html = attachHeadingIds(await renderMarkdown(page.body), page.toc);

  return (
    <DocsShell
      sidebar={
        // `undefined` chứ không phải một `Sidebar` rỗng — xem chú thích ở trang ứng dụng.
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
          {/* Ngăn kéo điều hướng của màn hẹp, đặt NGAY ĐẦU BÀI như mockup mục 07 —
              ngay dưới tiêu đề, trước mục nội dung đầu tiên. Ở màn rộng nó ẩn
              hoàn toàn vì cột trái đã làm đúng việc đó. Cùng `sidebarNodes`,
              cùng `NavTree`: một cây, hai chỗ hiện. */}
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
