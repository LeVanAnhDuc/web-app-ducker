import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Types and lint run separately via `pnpm typecheck` / `pnpm lint`,
  // but the build still checks them so no error slips through to Vercel.
  typedRoutes: false,
  // The admin area (and its logout button the dev badge used to cover) is gone —
  // ADR-0019. Kept off anyway: it still overlaps content while eyeballing layout
  // during `next dev`, which is reason enough on its own.
  devIndicators: false,
  // `src/content/read.ts` builds `CONTENT_ROOT` from `process.cwd()` and `readdir`s
  // it at REQUEST time from a dynamic route handler, so Vercel's file tracer
  // (which statically analyzes `import`/`require`/`fs` calls) cannot see the
  // dependency and will not ship `content/` into the handler's serverless
  // bundle. Without this, the handler deploys successfully and then silently
  // returns empty results in production — `read.ts`'s ENOENT fallback reads a
  // missing bundle the same way it reads an empty content group.
  outputFileTracingIncludes: {
    "/api/search-index/\\[locale\\]": ["./content/**/*"],
  },
};

/**
 * Called without arguments, the plugin finds `./src/i18n/request.ts` itself.
 * Without this wrapper the `next-intl/config` alias is not set and
 * `useTranslations`/`getTranslations` blow up at runtime — the build stays green,
 * so the error only shows when a page is opened.
 */
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
