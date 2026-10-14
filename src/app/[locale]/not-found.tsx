import { getLocale, getTranslations } from "next-intl/server";

import styles from "./status.module.css";

/**
 * 404 page for every path under `[locale]`.
 *
 * **Renders its own `<html>`/`<body>`.** This file sits at the `[locale]` level,
 * while `<html>`/`<body>` live in `(public)/layout.tsx` — that layout is not an
 * ancestor of the not-found boundary, so it does not run when `notFound()` is
 * called. Without rendering them here the page would be HTML with no body.
 *
 * `notFound()` passes no route params, so the locale comes from next-intl.
 * `[locale]/layout.tsx` has already called `setRequestLocale(locale)`, so
 * `getLocale()` reads from cache without touching headers — touching headers would
 * push `/vi` and `/vi/apps` into dynamic rendering, because the 404 page is built
 * alongside them. An unknown locale makes next-intl fall back to the default:
 * still readable, just not in the language the user typed.
 */
export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale });

  return (
    <html lang={locale}>
      <body>
        <main className={styles.wrap}>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>{t("notFound.title")}</h1>
          <p className={styles.body}>{t("notFound.body")}</p>
          <a className={styles.action} href={`/${locale}`}>
            {t("notFound.backHome")}
          </a>
        </main>
      </body>
    </html>
  );
}
