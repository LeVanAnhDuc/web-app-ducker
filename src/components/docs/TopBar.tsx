"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { locales } from "@/i18n/locales";
import { findTrail, navHref, topTabs, type NavTreeNode } from "@/content/nav-tree";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SearchDialog } from "./SearchDialog";
import styles from "./TopBar.module.css";

export type TopBarProps = {
  locale: string;
  /**
   * The **whole** navigation tree, not just its roots.
   *
   * The tabs are the roots, but which one is open has to be traced from the current
   * path down to a leaf (`findTrail`) — and the path is only known on the client.
   * With no tab to draw, the strip is left out and the page renders as normal.
   */
  tree?: NavTreeNode[];
};

/** Swaps the locale segment at the start of a path, keeping the rest. */
function withLocale(pathname: string, nextLocale: string): string {
  const segments = pathname.split("/");

  // ["", "vi", "apps", …] — replace only when the first segment is a known locale,
  // so an unknown path does not lose its first segment.
  if (segments.length > 1 && locales.includes(segments[1])) {
    segments[1] = nextLocale;
    return segments.join("/") || "/";
  }

  return pathname === "/" ? `/${nextLocale}` : `/${nextLocale}${pathname}`;
}

/**
 * The bar on top of every public page: brand, search, language switch, theme
 * switch — then **the tab strip, built from the navigation tree's roots**.
 *
 * No tab is hard-coded; adding a content group to `content/nav.ts` is enough.
 *
 * A client component because both the language switch and the open tab need the
 * current path — a language switch that jumps back to the home page loses the
 * reader's place.
 */
export function TopBar({ locale, tree = [] }: TopBarProps) {
  const t = useTranslations();
  const pathname = usePathname() ?? `/${locale}`;

  // The open tab is the root of the trail to the current page. A page outside the
  // tree (the home page, a doc not yet attached) lights no tab — more honest than
  // lighting one at random. `navHref` folds a Releases tab onto its entry (I22).
  const activeTabId = findTrail(tree, navHref(pathname))[0]?.id;
  // A container has no page of its own, so each tab points at its first leaf.
  const tabs = topTabs(tree);

  return (
    <header className={styles.header}>
      <div className={styles.mast}>
        <a className={styles.brand} href={`/${locale}`} aria-label={t("brand.home")}>
          <span className={styles.brandMark} aria-hidden="true">
            {t("brand.name").slice(0, 1)}
          </span>
          {t("brand.name")}
        </a>

        <div className={styles.right}>
          <SearchDialog locale={locale} />

          <nav className={styles.langs} aria-label={t("locale.label")}>
            {locales.map((code) => (
              <a
                key={code}
                className={styles.lang}
                href={withLocale(pathname, code)}
                hrefLang={code}
                aria-current={code === locale ? "true" : undefined}
              >
                {code.toUpperCase()}
              </a>
            ))}
          </nav>

          {/* Labels are passed down rather than read with `useTranslations` inside:
              `ThemeToggle` must render bare in tests, with no provider. */}
          <ThemeToggle
            labels={{
              group: t("theme.label"),
              system: t("theme.system"),
              light: t("theme.light"),
              dark: t("theme.dark"),
            }}
          />
        </div>
      </div>

      {tabs.length > 0 ? (
        <nav className={styles.tabs} aria-label={t("nav.label")}>
          {tabs.map((tab) => (
            <a
              key={tab.id}
              className={styles.tab}
              href={tab.href}
              // The open tab is marked with aria-current; the underline follows from it.
              aria-current={tab.id === activeTabId ? "page" : undefined}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
