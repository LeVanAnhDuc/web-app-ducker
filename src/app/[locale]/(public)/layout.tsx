import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { TopBar } from "@/components/docs/TopBar";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { locales } from "@/i18n/locales.generated";
import { getNavTree } from "@/content";
import styles from "./layout.module.css";

/**
 * Khung của mọi trang công khai: thanh trên cùng (thương hiệu, ô tìm kiếm, dải
 * tab) và vùng nội dung.
 *
 * Đây là chỗ đặt `<html>`/`<body>` chứ không phải `src/app/layout.tsx`: thẻ
 * `lang` phải theo locale của đường dẫn, mà layout gốc nằm ngoài `[locale]` nên
 * không đọc được tham số đó. Layout gốc vì vậy chỉ truyền `children` đi tiếp —
 * đúng khuôn mẫu "nhiều layout gốc" của App Router.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // `[locale]` bắt cả đường dẫn lạ (`/foo/bar`); ngôn ngữ không có trong danh
  // sách thì đây là trang không tồn tại, không phải trang tiếng Việt.
  if (!locales.includes(locale)) notFound();

  // Bật kết xuất tĩnh cho next-intl: thiếu dòng này mọi trang con rơi về động.
  setRequestLocale(locale);

  /**
   * Điều hướng đến từ **một** nguồn duy nhất: cây dựng từ `content/` (ADR-0018).
   *
   * Nút gốc là dải tab trên cùng (spec §3.2): ba nhóm cố định (`content/nav.ts`)
   * — ứng dụng, trò chơi, tài liệu — với con cháu của apps/docs suy ra từ chính
   * các file trong `content/`, nên thêm một app/game/doc không bao giờ cần sửa
   * cây bằng tay. `getNavTree` (`@/content`) không có gì để trả rỗng nữa — không
   * còn `DATABASE_URL` để thiếu.
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
