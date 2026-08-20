import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  use: { baseURL: process.env.BASE_URL || "http://localhost:3456" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3456",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
