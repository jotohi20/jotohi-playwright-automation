import { Page, expect } from "@playwright/test";

export class SignupPage {
  constructor(private page: Page) {}

  // ==============================
  // Navigate
  // ==============================
  async goto() {
    await this.page.goto("https://developer.salesforce.com/signup", {
      waitUntil: "domcontentloaded",
    });
  }

  // ==============================
  // Handle cookie / overlays safely
  // (popup appears AFTER typing sometimes)
  // ==============================
  private async dismissOverlays() {
    try {
      // give cookie script time to appear
      await this.page.waitForTimeout(300);

      // OneTrust common button
      const oneTrust = this.page.locator("#onetrust-accept-btn-handler");
      if (await oneTrust.isVisible({ timeout: 500 })) {
        await oneTrust.click({ force: true });
        return;
      }

      // generic Accept All
      const acceptAll = this.page.getByRole("button", {
        name: /accept all cookies|accept all/i,
      });
      if (await acceptAll.isVisible({ timeout: 500 })) {
        await acceptAll.click({ force: true });
        return;
      }

      // close (X) fallback
      const closeBtn = this.page.locator(
        "button[aria-label='Close'], button:has-text('×')"
      );
      if (await closeBtn.first().isVisible({ timeout: 500 })) {
        await closeBtn.first().click({ force: true });
        return;
      }
    } catch {
      // page might navigate / refresh → ignore safely
    }
  }

  // ==============================
  // Fill form
  // ==============================
  async fillForm(user: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
  }) {
    await this.page.getByLabel(/First name/i).fill(user.firstName);
    await this.page.getByLabel(/Last name/i).fill(user.lastName);

    // REQUIRED field Salesforce expects
    await this.page.getByLabel(/Job title/i).fill("QA Engineer");

    await this.page.getByLabel(/Company/i).fill(user.company);

    await this.page.getByLabel(/Work email/i).fill(user.email);

    // Country optional (already default Philippines)
    const country = this.page.getByLabel(/Country/i);
    if (await country.count()) {
      await country.selectOption({ label: "Philippines" });
    }

    // cookie popup may appear after typing
    await this.dismissOverlays();

    // click agreement label (NOT checkbox input)
    await this.page.getByText(/I agree to the/i).click();
  }

  // ==============================
  // Submit
  // ==============================
  async submit() {
    await this.dismissOverlays();

    const submitBtn = this.page.getByRole("button", {
      name: /Sign me up/i,
    });

    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
  }

  // ==============================
  // Expect submission attempt
  // (captcha may block full success)
  // ==============================
  async expectSubmissionAttempt() {
    await expect(
      this.page.getByText(/reCAPTCHA|check your email|verify|activation/i)
    ).toBeVisible({ timeout: 30_000 });
  }
}
