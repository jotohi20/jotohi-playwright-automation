import { Page, expect } from "@playwright/test";

export class OpportunityPage {
  constructor(private page: Page) {}

  // Verifies that the Opportunity record page is loaded by checking the header label
  async validateOpportunityCreated() {
    await expect(this.page.getByText(/^Opportunity$/i)).toBeVisible({ timeout: 60_000 });
  }

  // Confirms that the related Account name appears in the highlights panel
  async validateAccountLinked(accountName: string) {
    await expect(
      this.page.locator("records-highlights2").locator(`text=${accountName}`)
    ).toBeVisible({ timeout: 60_000 });
  }

  // Validates the Opportunity Stage either via the Lightning Path or record details
  async validateStage(stageExpected?: string) {
    if (stageExpected) {
      const path = this.page.getByLabel("Path Options");

      if (await path.count()) {
        await expect(path.getByTitle(stageExpected)).toBeVisible({ timeout: 60_000 });
        return;
      }

      await expect(this.page.locator(`text=${stageExpected}`)).toBeVisible({ timeout: 60_000 });
    } else {
      await expect(this.page.getByText(/Stage/i)).toBeVisible({ timeout: 60_000 });
    }
  }

  // Ensures the Opportunity Owner value is visible on the page
  async validateOwner(ownerName: string) {
    await expect(this.page.getByText(ownerName, { exact: false })).toBeVisible({
      timeout: 60_000,
    });
  }

  // Confirms that the Amount field label exists (default value may be empty)
  async validateAmountDefault() {
    await expect(this.page.getByText(/^Amount$/i)).toBeVisible({ timeout: 60_000 });
  }

  // Returns the Account name from the highlights section with a safe fallback strategy
  async getAccountNameFromHighlights() {
    const accountLink = this.page
      .locator('records-highlights2 a[href*="/Account/"]')
      .first();

    if (await accountLink.count()) {
      return (await accountLink.innerText()).trim();
    }

    const anyAccount = this.page.getByRole("link").filter({ hasText: /Account/i }).first();
    return (await anyAccount.innerText()).trim();
  }
}
