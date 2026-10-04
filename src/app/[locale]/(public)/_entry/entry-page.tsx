import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { AppHero } from "@/components/docs/AppHero";
import { DocsShell } from "@/components/docs/DocsShell";
import { EntryTabs } from "@/components/docs/EntryTabs";
import { GithubNotice } from "@/components/docs/GithubNotice";
import { MarkdownBody } from "@/components/docs/MarkdownBody";
import { NavDrawer } from "@/components/docs/NavDrawer";
import { RegistryList } from "@/components/docs/RegistryList";
import { ReleaseList } from "@/components/docs/ReleaseList";
import { Sidebar } from "@/components/docs/Sidebar";
import { Toc } from "@/components/docs/Toc";
import { buildToc, getEntry, getNavTree, listEntries, type EntryGroup } from "@/content";
import { findTrail } from "@/content/nav-tree";
import { absolutizeUrl, getReadme, getReleases, isRuntimeRefresh, parseRepoUrl, repoWebUrl } from "@/github";
import { defaultLocale, locales } from "@/i18n/locales";
import { attachHeadingIds, renderMarkdown, renderMarkdownWithToc } from "@/lib/markdown";
import { slugify } from "@/lib/slug";
import styles from "./entry-page.module.css";

/**
 * Shared rendering for `/apps`, `/games` and their detail routes (ADR-0023).
 * Route files stay thin because `revalidate` must be a literal in each of them.
 */

export type Tab = "readme" | "releases";

async function statusLabels(locale: string) {
  const t = await getTranslations({ locale });
  return {
    core: t("status.core"),
    connected: t("status.connected"),
    planned: t("status.planned"),
    standalone: t("status.standalone"),
    private: t("status.private"),
  };
}

function alternates(path: (locale: string) => string, locale: string): Metadata["alternates"] {
  return {
    canonical: path(locale),
    languages: {
      ...Object.fromEntries(locales.map((code) => [code, path(code)])),
      "x-default": path(defaultLocale),
    },
  };
}

/**
 * Sidebar and narrow-screen drawer for the node at `navHref`. Detail pages pass
 * the README href for both tabs — the Releases URL is not a node (I22).
 */
async function sidebarFor(locale: string, navHref: string) {
  const t = await getTranslations({ locale });
  const label = t("sidebar.label");
  const trail = findTrail(await getNavTree(locale), navHref);
  const nodes = trail[0]?.children ?? [];
  return {
    trail,
    // `undefined`, not an empty Sidebar: DocsShell reserves the column by the
    // prop's presence, so an element that renders `null` still leaves a gap.
    sidebar: nodes.length > 0 ? <Sidebar nodes={nodes} activeHref={navHref} label={label} /> : undefined,
    drawer: <NavDrawer nodes={nodes} activeHref={navHref} labels={{ open: label, close: t("search.close") }} />,
  };
}

// --- Overview ---------------------------------------------------------------

export function overviewStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function overviewMetadata(group: EntryGroup, locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale });
  return {
    title: `${t(`${group}.title`)} — ${t("brand.name")}`,
    description: t(`${group}.description`),
    alternates: alternates((code) => `/${code}/${group}`, locale),
  };
}

export async function OverviewPage({ group, locale }: { group: EntryGroup; locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const entries = await listEntries(group, locale);
  const href = `/${locale}/${group}`;
  const { sidebar, drawer } = await sidebarFor(locale, href);

  return (
    <DocsShell
      sidebar={sidebar}
      main={
        <div className={styles.main}>
          <h1 className={styles.title}>{t(`${group}.title`)}</h1>
          <p className={styles.lede}>{t(`${group}.lede`)}</p>
          <p className={styles.count}>{t(`${group}.eyebrow`, { count: entries.length })}</p>
          {drawer}
          {entries.length > 0 ? (
            <RegistryList entries={entries} basePath={href} statusLabels={await statusLabels(locale)} />
          ) : (
            // An empty screen is an invitation, not a complaint.
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{t(`${group}.emptyTitle`)}</p>
              <p className={styles.emptyBody}>{t(`${group}.emptyBody`)}</p>
            </div>
          )}
        </div>
      }
    />
  );
}

// --- Detail -----------------------------------------------------------------

export async function detailStaticParams(group: EntryGroup, { requireRepo }: { requireRepo: boolean }) {
  const entries = await listEntries(group, defaultLocale);
  // Same rule as DetailPage: a private repository gets no tabs, so no Releases route.
  const hasRepo = (e: (typeof entries)[number]) => !e.isRepoPrivate && parseRepoUrl(e.repoUrl) !== null;
  const slugs = entries.filter((e) => !requireRepo || hasRepo(e)).map((e) => e.slug);
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function detailMetadata(
  group: EntryGroup,
  locale: string,
  slug: string,
  tab: Tab,
): Promise<Metadata> {
  const [t, entry] = await Promise.all([getTranslations({ locale }), getEntry(group, slug, locale)]);
  if (!entry) return { title: `${t("notFound.title")} — ${t("brand.name")}` };
  const suffix = tab === "releases" ? "/releases" : "";
  const tabTitle = tab === "releases" ? ` · ${t("entry.releases")}` : "";
  return {
    title: `${entry.name}${tabTitle} — ${t("brand.name")}`,
    description: entry.tagline ?? undefined,
    alternates: alternates((code) => `/${code}/${group}/${slug}${suffix}`, locale),
  };
}

/**
 * During an ISR refresh, refuse to replace a good page with the notice: throwing
 * makes Next keep serving the last successful render (ADR-0023). At build time
 * there is no earlier page, so the notice renders.
 */
function keepLastGoodPage(what: string, slug: string): void {
  if (isRuntimeRefresh()) throw new Error(`${what} unavailable for ${slug}; keeping the last good page`);
}

function formatDate(iso: string, locale: string): string {
  // UTC on purpose (I11): the build server's zone must not shift a date by a day.
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
}

export async function DetailPage({
  group,
  locale,
  slug,
  tab,
}: {
  group: EntryGroup;
  locale: string;
  slug: string;
  tab: Tab;
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const entry = await getEntry(group, slug, locale);
  if (!entry) notFound();

  const repo = entry.isRepoPrivate ? null : parseRepoUrl(entry.repoUrl);
  // No repository, no Releases tab (spec §5): that URL is a 404, not an empty page.
  if (tab === "releases" && !repo) notFound();

  const readmeHref = `/${locale}/${group}/${slug}`;
  const { trail, sidebar, drawer } = await sidebarFor(locale, readmeHref);
  // The label above the title is the trail through the tree, minus the page itself.
  const crumb =
    trail.length > 1
      ? trail
          .slice(0, -1)
          .map((node) => node.label)
          .join(" · ")
      : t(`${group}.title`);
  const labels = { code: t("a11y.codeBlock"), table: t("a11y.table") };

  let body: ReactNode;
  let toc: { anchor: string; title: string }[] = [];

  if (!repo) {
    // Spec §5's one exception to D1: no repository, so the authored body is all there is.
    toc = buildToc(entry.body);
    body = <MarkdownBody html={attachHeadingIds(await renderMarkdown(entry.body), toc)} labels={labels} />;
  } else if (tab === "readme") {
    const readme = await getReadme(repo);
    if (readme.status === "ok") {
      const at = { repo, branch: readme.data.branch, path: readme.data.path };
      // The TOC is read off the rendered headings: a third-party README can contain
      // headings a line scan of the markdown would miscount (I23).
      const rendered = await renderMarkdownWithToc(readme.data.markdown, {
        dropFirstH1: true,
        rewriteUrl: (url, kind) => absolutizeUrl(url, kind, at),
      });
      toc = rendered.toc;
      body = (
        <>
          <p className={styles.source}>
            {t("entry.readmeSource", { path: readme.data.path, branch: readme.data.branch })}{" "}
            <a href={readme.data.htmlUrl} rel="noreferrer" target="_blank">
              {t("entry.viewOriginal")}
            </a>
          </p>
          <MarkdownBody html={rendered.html} labels={labels} />
        </>
      );
    } else {
      keepLastGoodPage("README", slug);
      body = (
        <GithubNotice
          tone="unavailable"
          title={t("entry.readmeUnavailableTitle")}
          body={t("entry.unavailableBody")}
          actionLabel={t("entry.openRepo")}
          actionHref={repoWebUrl(repo)}
        />
      );
    }
  } else {
    const releases = await getReleases(repo);
    if (releases.status === "ok") {
      const items = await Promise.all(
        releases.data.map(async (release) => ({
          tag: release.tag,
          name: release.name,
          dateLabel: formatDate(release.publishedAt, locale),
          anchor: `release-${slugify(release.tag)}`,
          html: release.body ? await renderMarkdown(release.body) : "",
        })),
      );
      toc = items.map((item) => ({ anchor: item.anchor, title: item.tag }));
      body = (
        <>
          <p className={styles.source}>{t("entry.releasesCount", { count: items.length })}</p>
          <ReleaseList releases={items} latestLabel={t("entry.latest")} bodyLabels={labels} />
        </>
      );
    } else {
      if (releases.status === "unavailable") keepLastGoodPage("Releases", slug);
      const empty = releases.status === "empty";
      body = (
        <GithubNotice
          tone={empty ? "empty" : "unavailable"}
          title={t(empty ? "entry.releasesEmptyTitle" : "entry.releasesUnavailableTitle")}
          body={t(empty ? "entry.releasesEmptyBody" : "entry.unavailableBody")}
          actionLabel={t(empty ? "entry.releasesOnGithub" : "entry.openRepo")}
          actionHref={empty ? `${repoWebUrl(repo)}/releases` : repoWebUrl(repo)}
        />
      );
    }
  }

  const status = await statusLabels(locale);

  return (
    <DocsShell
      sidebar={sidebar}
      toc={toc.length > 0 ? <Toc items={toc} title={t("toc.title")} /> : undefined}
      main={
        <article className={styles.main}>
          <AppHero
            app={entry}
            locale={locale}
            crumb={crumb}
            labels={{
              status: status[entry.integration],
              privateRepo: t("app.privateRepo"),
              repo: t("app.viewRepoOnGithub"),
              fallback: t("fallback.notice"),
            }}
            drawer={drawer}
          />
          {repo ? (
            <EntryTabs
              label={t("entry.tabsLabel", { name: entry.name })}
              readmeHref={readmeHref}
              releasesHref={`${readmeHref}/releases`}
              current={tab}
              labels={{ readme: t("entry.readme"), releases: t("entry.releases") }}
            />
          ) : null}
          {body}
        </article>
      }
    />
  );
}
