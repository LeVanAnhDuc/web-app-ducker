import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { TopBar } from "@/components/docs/TopBar";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { locales } from "@/i18n/locales";
import { getNavTree } from "@/content";
import styles from "./layout.module.css";

/**
 * Frame of every public page: the top bar (brand, search box, tab strip) and the
 * content area.
 *
 * `<html>`/`<body>` live here rather than in `src/app/layout.tsx`: the `lang`
 * attribute must follow the path's locale, and the root layout sits outside
 * `[locale]` so it cannot read that param. The root layout therefore only passes
 * `children` through — the App Router "multiple root layouts" pattern.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // `[locale]` also catches unknown paths (`/foo/bar`); a locale not in the list
  // means the page does not exist, not that it is a Vietnamese page.
  if (!locales.includes(locale)) notFound();

  // Enables static rendering for next-intl: without this line every child page goes dynamic.
  setRequestLocale(locale);

  /**
   * Navigation comes from **one** source only: the tree built from `content/` (ADR-0018).
   *
   * The root nodes are the top tab strip: three fixed groups (`content/nav.ts`)
   * — apps, games, docs — whose descendants are derived from the files in
   * `content/` themselves, so adding an app/game/doc never requires editing the
   * tree by hand. `getNavTree` (`@/content`) has no reason to return empty.
   */
  const tree = await getNavTree(locale);

  return (
    /**
     * `suppressHydrationWarning` does exactly ONE job: next-themes sets the
     * `data-theme` attribute on this very tag before React hydrates, so the
     * server HTML and the hydrating DOM differ on purpose. Without it the
     * console reds out over a cause that lives two files away.
     */
    <html lang={locale} suppressHydrationWarning>
      <body>
        {/* next-themes injects its own synchronous pre-paint script from here,
            which is why there is no hand-written anti-flash script any more. */}
        <ThemeProvider>
          <NextIntlClientProvider>
            <div className={styles.shell}>
              <TopBar locale={locale} tree={tree} />
              <main className={styles.main}>{children}</main>
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
