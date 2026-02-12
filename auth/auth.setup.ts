// auth/auth.setup.ts

import { test } from "@playwright/test";

test.setTimeout(180_000);

test("login and save session", async ({ page }) => {
  await page.goto("https://login.salesforce.com/");

  await page.getByLabel(/Username/i).fill(process.env.SF_USERNAME ?? "jonas.hipos+qaexam.22b83b154973@agentforce.com");
  await page.getByLabel(/Password/i).fill(process.env.SF_PASSWORD ?? "AutoTest001");
  await page.getByRole("button", { name: /Log In/i }).click();

  // Pause for MFA manually
  await page.pause();

  // After you resume, Salesforce is already logged in.
  // Just wait a bit for redirects to settle.
  await page.waitForTimeout(5000);

  // Save session immediately (no UI waiting needed)
  await page.context().storageState({ path: "storageState.json" });
});
