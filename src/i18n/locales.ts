// Danh sách locale, khai tay. Từng được `scripts/generate-locales.ts` sinh ra từ
// bảng `Locale` (ADR-0015); bảng đó không còn tồn tại (ADR-0018, ADR-0019), nên
// file này quay về là một hằng số bình thường, cùng kiểu với `content/nav.ts`.
//
// Middleware (`src/middleware.ts`) chạy ở edge trên mọi request và import file
// này trực tiếp — không có bước sinh nào ở giữa nữa. Thêm một ngôn ngữ vẫn cần
// sửa file này rồi redeploy, chỉ khác là sửa thẳng tay thay vì qua CMS.

export const locales: readonly string[] = ["vi", "en"];
export const defaultLocale: string = "vi";
