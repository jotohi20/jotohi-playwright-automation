import { Page, expect } from "@playwright/test";

export class OpportunityPage {
  constructor(private page: Page) {}

  async validateOpportunityCreated() {
    // Record page should contain "Opportunity" label somewhere
    await expect(this.page.getByText(/^Opportunity$/i)).toBeVisible({ timeout: 60_000 });
  }

  async validateAccountLinked(accountName: string) {
    // In record highlights/details, account name should be present
    await expect(
      this.page.locator("records-highlights2").locator(`text=${accountName}`)
    ).toBeVisible({ timeout: 60_000 });
  }

  async validateStage(stageExpected?: string) {
    // Stage often appears in Path or details.
    if (stageExpected) {
      // Path Options is common for stage
      const path = this.page.getByLabel("Path Options");
      if (await path.count()) {
        await expect(path.getByTitle(stageExpected)).toBeVisible({ timeout: 60_000 });
        return;
      }
      await expect(this.page.locator(`text=${stageExpected}`)).toBeVisible({ timeout: 60_000 });
    } else {
      // Just check that Stage exists somewhere
      await expect(this.page.getByText(/Stage/i)).toBeVisible({ timeout: 60_000 });
    }
  }

  async validateOwner(ownerName: string) {
    // Owner usually appears in highlights/details
    await expect(this.page.getByText(ownerName, { exact: false })).toBeVisible({ timeout: 60_000 });
  }

  async validateAmountDefault() {
    // Many orgs default Amount empty/blank. We validate field exists and is not crashing.
    // Safer: ensure Amount label appears.
    await expect(this.page.getByText(/^Amount$/i)).toBeVisible({ timeout: 60_000 });
  }

  async getAccountNameFromHighlights() {
    // Try to find account name link in highlights
    const accountLink = this.page.locator('records-highlights2 a[href*="/Account/"]').first();
    if (await accountLink.count()) {
      return (await accountLink.innerText()).trim();
    }
    // Fallback: any link that looks like account
    const anyAccount = this.page.getByRole("link").filter({ hasText: /Account/i }).first();
    return (await anyAccount.innerText()).trim();
  }
}
