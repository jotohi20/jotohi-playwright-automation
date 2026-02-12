import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["jotohitest/**/*.ts", "auth/**/*.ts"],

  // ✅ Salesforce UI is not stable with parallel tests sharing one storageState/session
  fullyParallel: false,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // ✅ Run tests sequentially (important!)
  workers: 1,

  // ✅ Increase timeouts (Salesforce can be slow)
  timeout: 120_000,
  expect: { timeout: 60_000 },

  reporter: "html",

  use: {
    headless: false,
    launchOptions: { slowMo: 300 },

    trace: "on-first-retry",
    storageState: "storageState.json",
    baseURL: "https://orgfarm-d8d06057be-dev-ed.develop.lightning.force.com",
  },

  // ✅ Optional: only run in Chrome/Chromium to reduce variance
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
