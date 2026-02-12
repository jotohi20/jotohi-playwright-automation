import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",

  // ✅ Only include real test specs here. Setup is matched by the setup project.
  testMatch: ["jotohitest/**/*.spec.ts"],

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  timeout: 120_000,
  expect: { timeout: 60_000 },
  reporter: "html",

  use: {
    headless: false,
    launchOptions: { slowMo: 300 },
    trace: "on-first-retry",
    baseURL: "https://orgfarm-d8d06057be-dev-ed.develop.lightning.force.com",
  },

  projects: [
    // ✅ Setup project: runs ONLY auth setup
    {
      name: "setup",
      testMatch: /auth\/auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // ✅ Main tests: depend on setup and reuse session
    {
      name: "chromium",
      testMatch: /jotohitest\/.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "storageState.json",
      },
      dependencies: ["setup"],
    },
  ],
});
