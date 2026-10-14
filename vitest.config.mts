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
    // e2e is run by Playwright; keep vitest from picking it up.
    //
    // The `**/` prefix on node_modules is required: declaring `exclude` OVERRIDES
    // vitest's default `**/node_modules/**`, so an unprefixed pattern only excludes
    // the root node_modules. Every nested node_modules is still scanned — and
    // `.worktrees/<feature>/node_modules/` always exists, because the workspace
    // convention is to build features in worktrees. The result is not a red test but a HUNG vitest,
    // quietly running thousands of dependency test files.
    exclude: [
      "**/node_modules/**",
      ".worktrees/**",
      "dist/**",
      ".next/**",
      "e2e/**",
    ],
  },
});
