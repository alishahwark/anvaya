import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests run against a PRODUCTION build on its own port and build directory,
 * so they never reuse a stale server or clobber `next dev`'s .next folder.
 * Set RUN_LIVE_AI=1 to include the tests that call the real model.
 */
const port = 3110;
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  testIgnore: "**/legacy/**",
  workers: 1,
  timeout: 90_000,
  use: { baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `ANVAYA_DIST_DIR=.next-e2e npx next build && ANVAYA_DIST_DIR=.next-e2e npx next start -H 127.0.0.1 -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
