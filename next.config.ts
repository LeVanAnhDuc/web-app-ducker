import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kiểu và lint chạy riêng bằng `pnpm typecheck` / `pnpm lint`,
  // nhưng vẫn để build tự kiểm để không lọt lỗi lên Vercel.
  typedRoutes: false,
  // The admin area (and its logout button the dev badge used to cover) is gone —
  // ADR-0019. Kept off anyway: it still overlaps content while eyeballing layout
  // during `next dev`, which is reason enough on its own.
  devIndicators: false,
  // `src/content/read.ts` builds `CONTENT_ROOT` from `process.cwd()` and `readdir`s
  // it at REQUEST time from two dynamic route handlers, so Vercel's file tracer
  // (which statically analyzes `import`/`require`/`fs` calls) cannot see the
  // dependency and will not ship `content/` into either handler's serverless
  // bundle. Without this, both handlers deploy successfully and then silently
  // return empty results in production — `read.ts`'s ENOENT fallback reads a
  // missing bundle the same way it reads an empty content group.
  outputFileTracingIncludes: {
    "/api/search-index/\\[locale\\]": ["./content/**/*"],
    "/\\[locale\\]/n/\\[id\\]": ["./content/**/*"],
  },
};

/**
 * Gọi không tham số thì plugin tự tìm `./src/i18n/request.ts`.
 * Thiếu bước bọc này, alias `next-intl/config` không được đặt và
 * `useTranslations`/`getTranslations` sẽ nổ lúc chạy — build vẫn xanh,
 * nên lỗi chỉ lộ ra khi mở trang.
 */
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
