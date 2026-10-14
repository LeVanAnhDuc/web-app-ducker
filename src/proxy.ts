import createMiddleware from "next-intl/middleware";

import { defaultLocale, locales } from "@/i18n/locales";

/**
 * Locale routing (Next 16's `proxy` convention, formerly `middleware`). It runs on
 * Node.js, the only runtime `proxy` supports.
 *
 * `localePrefix: "always"` is deliberate: `/vi/apps/…`, `/en/apps/…`. Leaving the
 * default locale unprefixed would make `/apps` and `/[locale]` ambiguous, and make
 * `hreflang` and the prerendered URLs less explicit.
 */
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  // Skip API routes, Next's own assets and every path with an extension (images,
  // favicon, sitemap.xml, robots.txt) — none of them has a language variant.
  matcher: ["/((?!api|_next|.*\..*).*)"],
};
