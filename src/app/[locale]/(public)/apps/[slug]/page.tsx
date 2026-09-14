import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHero } from "@/components/docs/AppHero";
import { DocsShell } from "@/components/docs/DocsShell";
import { FeatureGrid } from "@/components/docs/FeatureGrid";
import { MarkdownBody } from "@/components/docs/MarkdownBody";
import { NavDrawer } from "@/components/docs/NavDrawer";
import { Sidebar } from "@/components/docs/Sidebar";
import { Toc } from "@/components/docs/Toc";
import { defaultLocale, locales } from "@/i18n/locales";
import { findTrail } from "@/content/nav-tree";
import { buildToc, getApp, getNavTree, listApps } from "@/content";
import { attachHeadingIds, renderMarkdown } from "@/lib/markdown";
import styles from "./page.module.css";

/**
 * Trang một ứng dụng — ba cột theo mockup màn 02.
 *
 * ADR-0018: nội dung (tính năng, thân bài) đọc thẳng từ frontmatter/markdown
 * trong `content/apps/<slug>.<locale>.mdx`, không còn qua CMS. `AppDetail.body`
 * là markdown thô — trang này tự dựng mục lục (`buildToc`) và tự kết xuất HTML
 * (`renderMarkdown`), việc mà bản CMS cũ giao cho `SectionBody` làm theo từng
 * mục đã publish sẵn (ADR-0005, giờ đã bị ADR-0018 thay thế).
 */

type PageParams = { params: Promise<{ locale: string; slug: string }> };

/**
 * Danh sách slug lấy từ `content/apps/` qua ngôn ngữ mặc định: file-backed
 * content không có "chưa cấu hình DATABASE_URL" nữa, nên không còn nhánh rỗng
 * nào để giữ `next build` chạy được — trừ khi chính `content/apps/` rỗng, và
 * khi đó danh sách rỗng vẫn là câu trả lời đúng.
 */
export async function generateStaticParams() {
  const apps = await listApps(defaultLocale);
  return locales.flatMap((locale) => apps.map((app) => ({ locale, slug: app.slug })));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, slug } = await params;
  const [t, app] = await Promise.all([getTranslations({ locale }), getApp(slug, locale)]);

  if (!app) return { title: `${t("notFound.title")} — ${t("brand.name")}` };

  return {
    title: `${app.name} — ${t("brand.name")}`,
    description: app.tagline ?? undefined,
    alternates: {
      // Canonical trỏ chính nó; `languages` phát đủ locale đang bật cộng
      // `x-default` trỏ locale mặc định.
      canonical: `/${locale}/apps/${slug}`,
      languages: {
        ...Object.fromEntries(locales.map((code) => [code, `/${code}/apps/${slug}`])),
        "x-default": `/${defaultLocale}/apps/${slug}`,
      },
    },
  };
}

export default async function AppPage({ params }: PageParams) {
  const { locale, slug } = await params;
  // Thiếu dòng này trang rơi về kết xuất động (ghi chú bàn giao của Task 12).
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  // Không có, hoặc không có bản dịch nào — cả hai đều là 404.
  const app = await getApp(slug, locale);
  if (!app) notFound();

  const currentHref = `/${locale}/apps/${slug}`;

  /**
   * Cột trái là **con cháu của tab đang mở**, không phải một danh sách tự gộp.
   * `findTrail` cho biết trang này nằm ở nhánh nào (nhánh "apps"), và sidebar
   * chỉ là nhánh đó — cùng cây mà `TopBar` dùng để dựng dải tab.
   *
   * Trang chưa được gắn vào cây thì `trail` rỗng: không có sidebar, nhưng trang
   * vẫn mở được bằng URL.
   */
  const trail = findTrail(await getNavTree(locale), currentHref);
  const sidebarNodes = trail[0]?.children ?? [];

  const statusLabels = {
    core: t("status.core"),
    connected: t("status.connected"),
    planned: t("status.planned"),
    standalone: t("status.standalone"),
    private: t("status.private"),
  };

  /**
   * Nhãn trên tiêu đề là đường đi trong cây, ví dụ "Ứng dụng · Lõi" (mockup v3
   * mục 02) — nó nói cho người đọc biết mình đang ở đâu trong điều hướng. Bỏ
   * phần tử cuối vì đó chính là trang đang mở. Trang chưa gắn vào cây thì lùi về
   * tên chung của khu vực.
   */
  const crumb =
    trail.length > 1
      ? trail
          .slice(0, -1)
          .map((node) => node.label)
          .join(" · ")
      : t("nav.apps");

  const fallbackLabel = t("fallback.notice");

  // R3: `AppDetail.body` is raw markdown with no `toc`/`bodyHtml` of its own —
  // this page composes both. `attachHeadingIds` stamps the rendered `<h2>`s
  // with the same anchors `buildToc` just derived, so `Toc`'s links actually
  // land somewhere.
  const toc = buildToc(app.body);
  const html = attachHeadingIds(await renderMarkdown(app.body), toc);

  return (
    <DocsShell
      sidebar={
        // `undefined` chứ không phải một `Sidebar` rỗng: `DocsShell` chừa cột theo
        // việc prop có tồn tại hay không, nên truyền phần tử tự render `null` vào
        // đây thì lưới vẫn giữ một dải trống 208px bên trái.
        sidebarNodes.length > 0 ? (
          <Sidebar nodes={sidebarNodes} activeHref={currentHref} label={t("sidebar.label")} />
        ) : undefined
      }
      toc={toc.length > 0 ? <Toc items={toc} title={t("toc.title")} /> : undefined}
      main={
        <article className={styles.main}>
          <AppHero
            app={app}
            locale={locale}
            crumb={crumb}
            labels={{
              status: statusLabels[app.integration],
              privateRepo: t("app.privateRepo"),
              repo: t("app.viewRepo"),
              fallback: fallbackLabel,
            }}
            drawer={
              /* Ngăn kéo điều hướng của màn hẹp, đặt NGAY ĐẦU BÀI như mockup mục
                 07 — ngay dưới dòng mô tả, trước nội dung. Ở màn rộng nó ẩn hoàn
                 toàn vì cột trái đã làm đúng việc đó. Cùng `sidebarNodes`, cùng
                 `NavTree`: một cây, hai chỗ hiện. */
              <NavDrawer
                nodes={sidebarNodes}
                activeHref={currentHref}
                labels={{ open: t("sidebar.label"), close: t("search.close") }}
              />
            }
          />

          <FeatureGrid features={app.features} title={t("app.features")} />

          <MarkdownBody html={html} labels={{ code: t("a11y.codeBlock"), table: t("a11y.table") }} />
        </article>
      }
    />
  );
}
