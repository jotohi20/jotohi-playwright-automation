import { Page, expect } from "@playwright/test";

export class LeadPage {
  constructor(private page: Page) {}

  async gotoLeadsList() {
    await this.page.goto("/lightning/o/Lead/list", { waitUntil: "domcontentloaded" });
  }

  async clickNew() {
    await this.page.getByRole("button", { name: /^New$/i }).click();
  }

  async fillLead(first: string, last: string, company: string) {
    await this.page.getByRole("textbox", { name: /First Name/i }).fill(first);
    await this.page.getByRole("textbox", { name: /Last Name/i }).fill(last);

    // Stable Salesforce field selector (avoids strict mode issues)
    const companyInput = this.page.locator('input[name="Company"]');
    await companyInput.waitFor({ state: "visible", timeout: 60_000 });
    await companyInput.fill(company);
  }

  async save() {
    await this.page.getByRole("button", { name: /^Save$/i }).click();
  }

  async expectRecordHeaderContains(text: string) {
    await expect(
      this.page.getByRole("heading", { name: new RegExp(text, "i") })
    ).toBeVisible({ timeout: 60_000 });
  }

  async editCompany(newCompany: string) {
    // 1) Open Edit (direct button OR via Show more actions menu)
    const directEdit = this.page.getByRole("button", { name: /^Edit$/i });

    if (await directEdit.isVisible().catch(() => false)) {
      await directEdit.click();
    } else {
      const moreActions = this.page.getByRole("button", { name: /Show more actions/i });
      await moreActions.first().click();

      // IMPORTANT: click Edit from the menu
      await this.page.getByRole("menuitem", { name: /^Edit$/i }).click();
    }

    // 2) Wait for edit UI to appear and update Company
    const companyInput = this.page.locator('input[name="Company"]');
    await companyInput.waitFor({ state: "visible", timeout: 60_000 });

    await companyInput.fill("");
    await companyInput.fill(newCompany);

    // 3) Save
    await this.page.getByRole("button", { name: /^Save$/i }).click();
  }

  async expectCompanyValue(company: string) {
  const highlights = this.page.locator("records-highlights2");
  await expect(highlights.locator(`text=${company}`)).toBeVisible({ timeout: 60_000 });
}


  async deleteLead() {
    // Delete is in the same menu in your screenshot
    const moreActions = this.page.getByRole("button", { name: /Show more actions/i });
    await moreActions.first().click();

    await this.page.getByRole("menuitem", { name: /^Delete$/i }).click();

    // Confirm delete dialog
    await this.page.getByRole("button", { name: /^Delete$/i }).click();
  }

  async expectOnLeadsList() {
    await expect(this.page).toHaveURL(/\/lightning\/o\/Lead\/list/i, { timeout: 60_000 });
  }
}
