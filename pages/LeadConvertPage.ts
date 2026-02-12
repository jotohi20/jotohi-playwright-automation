import { Page, expect } from "@playwright/test";

export class LeadConvertPage {
  constructor(private page: Page) {}

  async openConvertModal() {
    await this.page.getByRole("button", { name: /Show more actions/i }).first().click();
    await this.page.getByRole("menuitem", { name: /^Convert$/i }).click();

    await expect(this.page.getByRole("heading", { name: /Convert Lead/i })).toBeVisible({
      timeout: 60_000,
    });
  }

  async ensureCreateNewOpportunitySelected() {
    const radio = this.page.getByRole("radio", { name: /Create New Opportunity/i }).first();
    if (await radio.count()) {
      const checked = await radio.isChecked().catch(() => true);
      if (!checked) await radio.click();
    }
  }

  async ensureOpportunityNameValid() {
    // Opportunity name is typically the third visible text input (Account, Contact, Opportunity)
    const oppName = this.page.locator('input[type="text"]:visible').nth(2);
    if (await oppName.count()) {
      const current = (await oppName.inputValue().catch(() => "")) || "";
      const cleaned = current.replace(/-+$/g, "").trim();
      if (cleaned && cleaned !== current) await oppName.fill(cleaned);
    }
  }

  async clickConvert() {
    const convertBtn = this.page.getByRole("button", { name: /^Convert$/i });
    await convertBtn.scrollIntoViewIfNeeded();
    await this.ensureOpportunityNameValid();
    await expect(convertBtn).toBeEnabled({ timeout: 60_000 });
    await convertBtn.click();
  }

  // After clicking Convert, Salesforce may navigate to:
  // 1) Opportunity record
  // 2) Account record
  // 3) Success dialog ("Lead has been converted") with record tiles
  async waitForAnyPostConvertLanding() {
    await Promise.race([
      this.page.waitForURL(/\/lightning\/r\/Opportunity\/[A-Za-z0-9]{18}\/view/i, { timeout: 120_000 }),
      this.page.waitForURL(/\/lightning\/r\/Account\/[A-Za-z0-9]{18}\/view/i, { timeout: 120_000 }),
      this.page.getByRole("heading", { name: /lead has been converted/i }).waitFor({ timeout: 120_000 }),
    ]);
  }

  async clickOpportunityTileIfPresent() {
    const convertedHeading = this.page.getByRole("heading", { name: /lead has been converted/i });
    if (!(await convertedHeading.count())) return;

    // Scope interactions to the conversion dialog
    const dialog = this.page.getByRole("dialog").filter({ has: convertedHeading }).first();

    // Locate the Opportunity card inside the dialog
    const oppCard = dialog.locator('div:has-text("Opportunity Own")').first();
    await expect(oppCard).toBeVisible({ timeout: 120_000 });

    // Opportunity name is typically rendered as a link; fallback to button if necessary
    const oppNameLink = oppCard.locator("a").first();
    const oppNameButton = oppCard.locator("button").first();

    if (await oppNameLink.count()) {
      await oppNameLink.click();
    } else {
      await expect(oppNameButton).toBeVisible({ timeout: 120_000 });
      await oppNameButton.click();
    }
  }

  async openOpportunityFromAccountRelatedList() {
    // Ensure current page is an Account record
    await expect(this.page).toHaveURL(/\/lightning\/r\/Account\/[A-Za-z0-9]{18}\/view/i, {
      timeout: 120_000,
    });

    // Navigate to Related tab
    await this.page.getByRole("tab", { name: /^Related$/i }).click().catch(() => {});

    // Locate Opportunities related list
    const oppHeading = this.page.getByRole("heading", { name: /^Opportunities/i }).first();
    await expect(oppHeading).toBeVisible({ timeout: 120_000 });

    const card = oppHeading.locator("xpath=ancestor::*[self::article or self::section][1]");
    const recordLink = card.locator('a[href*="/lightning/r/Opportunity/"]').first();

    if (await recordLink.count()) {
      await recordLink.click();
    } else {
      // If no direct record link, use "View All" and select first visible record
      const viewAll = card.getByRole("link", { name: /View All/i }).first();
      await expect(viewAll).toBeVisible({ timeout: 120_000 });

      // Wait for navigation triggered by View All
      await Promise.all([
        this.page.waitForURL(
          /\/lightning\/r\/Account\/[a-zA-Z0-9]{15,18}\/related\/Opportunities\//i,
          { timeout: 120_000 }
        ).catch(() => {}),
        viewAll.click(),
      ]);

      // Wait for the active Opportunities grid to render
      const grid = this.page.locator('table[role="grid"]:visible, table:visible').first();
      await expect(grid).toBeVisible({ timeout: 120_000 });

      const visibleRows = grid.locator("tbody tr:visible");
      await expect(visibleRows.first()).toBeVisible({ timeout: 120_000 });

      const firstRow = visibleRows.first();
      await firstRow.scrollIntoViewIfNeeded();

      const firstNameLink = firstRow.getByRole("link").first();
      await expect(firstNameLink).toBeVisible({ timeout: 120_000 });
      await firstNameLink.click();

      // Confirm navigation to Opportunity record
      await this.page.waitForURL(/\/lightning\/r\/Opportunity\/[a-zA-Z0-9]{15,18}\/view/i, {
        timeout: 120_000,
        waitUntil: "domcontentloaded",
      });

      await this.page.waitForURL(
        /\/lightning\/r\/Opportunity\/[a-zA-Z0-9]{15,18}\//i,
        { timeout: 120_000 }
      );
    }
  }

  async convertAndOpenOpportunity() {
    await this.clickConvert();

    // Wait for any post-conversion landing state
    await this.waitForAnyPostConvertLanding();

    // Attempt to open Opportunity from success dialog (if present)
    await this.clickOpportunityTileIfPresent();

    if (/\/lightning\/r\/Opportunity\/[A-Za-z0-9]{18}\/view/i.test(this.page.url())) return;

    // If redirected to Account, open Opportunity from related list
    if (/\/lightning\/r\/Account\/[A-Za-z0-9]{18}\/view/i.test(this.page.url())) {
      await this.openOpportunityFromAccountRelatedList();
      return;
    }

    // Retry clicking Opportunity tile if still on conversion dialog
    await this.clickOpportunityTileIfPresent();
    if (/\/lightning\/r\/Opportunity\/[A-Za-z0-9]{18}\/view/i.test(this.page.url())) return;

    // Final fallback: if still on Account page, open from related list
    if (/\/lightning\/r\/Account\/[A-Za-z0-9]{18}\/view/i.test(this.page.url())) {
      await this.openOpportunityFromAccountRelatedList();
    }
  }
}
