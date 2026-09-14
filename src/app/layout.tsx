import type { ReactNode } from "react";
import "@/styles/globals.css";

/**
 * Layout gốc chỉ truyền `children` đi tiếp — **không** dựng `<html>`/`<body>`.
 *
 * Thẻ `lang` phải theo ngôn ngữ của đường dẫn, mà tham số `[locale]` chỉ đọc
 * được từ layout nằm bên trong `src/app/[locale]/`. Vì vậy `<html>`/`<body>`
 * nằm ở `src/app/[locale]/(public)/layout.tsx`, đúng khuôn mẫu "nhiều layout
 * gốc" của App Router. Nhóm `(admin)` từng là root layout thứ hai; nó đã bị
 * xoá cùng toàn bộ khu quản trị (ADR-0019).
 *
 * File vẫn phải tồn tại: đây là nơi nạp `globals.css` cho toàn bộ cây route.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
