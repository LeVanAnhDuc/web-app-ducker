/** Where the site is served from in production (ADR-0024). */
export const PRODUCTION_URL = "https://web-app-ducker.vercel.app";

/**
 * The absolute origin canonical, `hreflang`, sitemap and robots URLs are built on.
 *
 * `NEXT_PUBLIC_SITE_URL` overrides it — set it for a custom domain. Unset or blank
 * means production: a preview or local build then still advertises the real site,
 * never `localhost` or a throwaway preview host a crawler might keep.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): URL {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim();
  return new URL(configured ? configured : PRODUCTION_URL);
}
