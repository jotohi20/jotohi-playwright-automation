// auth/auth.setup.ts
import { test, expect } from "@playwright/test";

test.setTimeout(240_000);

test("login and save session", async ({ page, baseURL }) => {
  await page.goto("https://login.salesforce.com/", { waitUntil: "domcontentloaded" });

  await page
    .getByLabel(/Username/i)
    .fill(process.env.SF_USERNAME ?? "jonas.hipos+qaexam.22b83b154973@agentforce.com");

  await page
    .getByLabel(/Password/i)
    .fill(process.env.SF_PASSWORD ?? "AutoTest001");

  await page.getByRole("button", { name: /Log In/i }).click();

  // At this point Salesforce may:
  // - go straight to Lightning
  // - ask for verification (MFA)
  // - bounce back to login (failed verification / throttled / policy)
  await Promise.race([
    page.waitForURL(/\/lightning\//i, { timeout: 120_000 }).catch(() => {}),
    page.getByText(/Verify your identity|verification code|Enter the code/i).first().waitFor({ timeout: 120_000 }).catch(() => {}),
    page.getByLabel(/Username/i).waitFor({ timeout: 120_000 }).catch(() => {}),
  ]);

  // If verification step is shown, you must complete it manually in the same window.
  // Resume the test only after you're fully redirected away from the login/verification screen.
  const needsVerification =
    (await page.getByText(/Verify your identity|verification code|Enter the code/i).first().count().catch(() => 0)) > 0;

  if (needsVerification) {
    await page.pause(); // complete verification manually, then Resume
  }

  // Now force navigation to your org Lightning baseURL to ensure cookies are for the right domain.
  await page.goto(baseURL ?? "/", { waitUntil: "domcontentloaded" });

  // If we got bounced back to login again, fail with a clear message.
  const onLoginPage =
    (await page.getByLabel(/Username/i).count().catch(() => 0)) > 0 &&
    /my\.salesforce\.com/i.test(page.url());

  if (onLoginPage) {
    throw new Error(
      `Login did not stick (bounced back to login). This is usually MFA/code throttling or an org login policy.\nCurrent URL: ${page.url()}\nFix: try again later, use a fresh org, or set up an Authenticator method / trust device.`
    );
  }

  // Confirm we're in Lightning somewhere before saving state
  await page.waitForURL(/\/lightning\//i, { timeout: 120_000 });

  await page.context().storageState({ path: "storageState.json" });
});
