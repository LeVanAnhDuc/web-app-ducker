import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
    // e2e do Playwright chạy, không để vitest nhặt vào.
    //
    // `**/` là bắt buộc ở node_modules: khai `exclude` là GHI ĐÈ default
    // `**/node_modules/**` của vitest, nên một mẫu không có tiền tố chỉ loại trừ
    // node_modules ở gốc. Mọi node_modules lồng bên trong vẫn bị quét — và
    // `.worktrees/<feature>/node_modules/` thì luôn có, vì quy ước của workspace là
    // làm feature trong worktree. Hậu quả không phải test đỏ mà là vitest TREO,
    // lặng lẽ chạy hàng nghìn file test của dependency.
    exclude: [
      "**/node_modules/**",
      ".worktrees/**",
      "dist/**",
      ".next/**",
      "e2e/**",
    ],
  },
});
