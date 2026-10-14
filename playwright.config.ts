import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs on **its own port**, not 3000.
 *
 * This config used to take `NEXT_PUBLIC_SITE_URL` (= `http://localhost:3000`) as
 * `baseURL` and set `reuseExistingServer: !process.env.CI`. Together those meant
 * **any** process holding port 3000 was accepted as "this project's server" —
 * including another project's app. It really happened: port 3000 was held by
 * `app-AI-workflow-automation-platform`, and the whole e2e suite reported green while
 * not a single request reached Ducker.
 *
 * Why a dedicated port + `reuseExistingServer: false` rather than an "identify the
 * app before running" step: identification still has to guess which signal is
 * enough to recognise Ducker, and every UI change means fixing that signal again.
 * A dedicated port leaves nothing to guess — Playwright always builds the server from
 * the code in this directory, and if the port is taken it **fails with an error** instead
 * of silently testing the wrong app. The price: `pnpm build` must run before `pnpm e2e`,
 * since there is no dev server left to borrow.
 */
const port = Number(process.env.E2E_PORT ?? 3210);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Parallel runs are flaky on this Windows machine — keep one worker.
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // No `--` before the flags: npm swallowed that separator, pnpm forwards it
    // verbatim and `next start` then reads `--port` as the project directory,
    // failing with "Invalid project directory provided". Fallout from the
    // npm-to-pnpm migration in fff75d2, which left the whole suite unrunnable.
    command: `pnpm start --port ${port} --hostname 127.0.0.1`,
    url: baseURL,
    // Never borrow an existing server: see the comment block above.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
