import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";

import { locales } from "@/i18n/locales";

/**
 * Layout of the `[locale]` level — it does **not** render `<html>`/`<body>`.
 *
 * It exists for one reason only: to set the request locale at the highest level
 * that can still read `params.locale`. That lets the sibling `not-found.tsx` get
 * the locale from next-intl's cache instead of reading headers — reading headers
 * would push both `/vi` and `/vi/apps` into dynamic rendering, because the 404
 * page is built alongside them.
 *
 * `<html>`/`<body>` stay in the `(public)` route group's layout, the App Router
 * "multiple root layouts" pattern.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // An unknown locale sets nothing: next-intl falls back to the default locale,
  // and the route group's layout is what decides whether this is a 404.
  if (locales.includes(locale)) setRequestLocale(locale);

  return children;
}
