"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NextIntlClientProvider, useTranslations } from "next-intl";

import { defaultLocale, locales } from "@/i18n/locales";
import en from "@/i18n/messages/en.json";
import vi from "@/i18n/messages/vi.json";
import styles from "./status.module.css";

/**
 * Error boundary for every path under `[locale]`.
 *
 * Two things must be done here by hand, for the same reason: the error boundary
 * sits **outside** `(public)/layout.tsx`, so when it runs that layout does not.
 *
 * 1. **Render `<html>`/`<body>` itself** — nobody else will.
 * 2. **Render `NextIntlClientProvider` itself** with statically imported messages.
 *    `getTranslations` is unavailable because this file must be a client
 *    component, and the layout's provider does not reach here. Static loading is
 *    also right for an error page: it must render even when the server's data
 *    fetching is broken.
 */

const messagesByLocale: Record<string, typeof vi> = { vi, en };

function ErrorBody({ reset }: { reset: () => void }) {
  const t = useTranslations("error");

  return (
    <main className={styles.wrap}>
      <p className={styles.code}>500</p>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.body}>{t("body")}</p>
      {/* The button says exactly what it does: re-render the branch that just failed. */}
      <button className={styles.action} type="button" onClick={reset}>
        {t("retry")}
      </button>
    </main>
  );
}

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The error page shows readers no technical detail; the log is where to trace it.
  useEffect(() => {
    console.error(error);
  }, [error]);

  const pathname = usePathname() ?? `/${defaultLocale}`;
  const segment = pathname.split("/")[1] ?? "";
  const locale = locales.includes(segment) ? segment : defaultLocale;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale] ?? vi}>
          <ErrorBody reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
