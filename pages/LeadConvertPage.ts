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
    // Account / Contact / Opportunity name inputs are usually the first 3 visible text inputs
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

  // ✅ After clicking Convert, Salesforce may show:
  // A) Opportunity page
  // B) Account page
  // C) Success popup ("Your lead has been converted") with tiles
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

  // Scope to the modal/dialog
  const dialog = this.page.getByRole("dialog").filter({ has: convertedHeading }).first();

  // ✅ Find the Opportunity card by unique label that only exists there
  const oppCard = dialog.locator('div:has-text("Opportunity Own")').first();

  await expect(oppCard).toBeVisible({ timeout: 120_000 });

  // The clickable opportunity name is usually a blue <a> inside the card.
  // Try <a> first, then fallback to a button if your org renders it differently.
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
    // Ensure we are on Account page
    await expect(this.page).toHaveURL(/\/lightning\/r\/Account\/[A-Za-z0-9]{18}\/view/i, {
      timeout: 120_000,
    });

    // Go to Related tab (don’t store locator refs; re-query each time)
    await this.page.getByRole("tab", { name: /^Related$/i }).click().catch(() => {});

    // Find Opportunities card by heading
    const oppHeading = this.page.getByRole("heading", { name: /^Opportunities/i }).first();
    await expect(oppHeading).toBeVisible({ timeout: 120_000 });

    // Card container
    const card = oppHeading.locator("xpath=ancestor::*[self::article or self::section][1]");

    // Try record link directly inside card
    const recordLink = card.locator('a[href*="/lightning/r/Opportunity/"]').first();

    if (await recordLink.count()) {
      await recordLink.click();
    } else {
      // If not visible yet, click View All then click first record
const viewAll = card.getByRole("link", { name: /View All/i }).first();
await expect(viewAll).toBeVisible({ timeout: 120_000 });

// IMPORTANT: wait for navigation triggered by View All
await Promise.all([
  this.page.waitForURL(/\/lightning\/r\/Account\/[a-zA-Z0-9]{15,18}\/related\/Opportunities\//i, {
    timeout: 120_000,
  }).catch(() => {}), // orgs differ; don't hard-fail only on URL pattern
  viewAll.click(),
]);

// Wait until the related Opportunities list view is actually the active/visible surface
// (the old table may remain in DOM but hidden)
const grid = this.page.locator('table[role="grid"]:visible, table:visible').first();
await expect(grid).toBeVisible({ timeout: 120_000 });

// Wait for at least one VISIBLE row in the active grid
const visibleRows = grid.locator("tbody tr:visible");
await expect(visibleRows.first()).toBeVisible({ timeout: 120_000 });

// In SF list views, the Opportunity name is usually a link inside the first visible row.
// We scope to the visible grid so we don’t accidentally click hidden DOM from the previous page.
const firstRow = visibleRows.first();
await firstRow.scrollIntoViewIfNeeded();

const firstNameLink = firstRow.getByRole("link").first();
await expect(firstNameLink).toBeVisible({ timeout: 120_000 });
await firstNameLink.click();

// Confirm we land on an Opportunity record page
await this.page.waitForURL(/\/lightning\/r\/Opportunity\/[a-zA-Z0-9]{15,18}\/view/i, {
  timeout: 120_000,
  waitUntil: "domcontentloaded",
});


// Now wait until we truly land on an Opportunity record page
await this.page.waitForURL(/\/lightning\/r\/Opportunity\/[a-zA-Z0-9]{15,18}\//i, { timeout: 120_000 });
    }
  }

  async convertAndOpenOpportunity() {
    await this.clickConvert();

    // Wait for whichever post-convert screen appears
    await this.waitForAnyPostConvertLanding();

    // If success popup appeared, click Opportunity tile
    await this.clickOpportunityTileIfPresent();

    // Now we might be on Opportunity already, or on Account
    if (/\/lightning\/r\/Opportunity\/[A-Za-z0-9]{18}\/view/i.test(this.page.url())) return;

    // If Account, open opportunity from Related list
    if (/\/lightning\/r\/Account\/[A-Za-z0-9]{18}\/view/i.test(this.page.url())) {
      await this.openOpportunityFromAccountRelatedList();
      return;
    }

    // Fallback: sometimes it stays on the success popup but link click didn’t navigate
    // Try again to click tile, then re-check
    await this.clickOpportunityTileIfPresent();
    if (/\/lightning\/r\/Opportunity\/[A-Za-z0-9]{18}\/view/i.test(this.page.url())) return;

    // If we still ended up on Account after second attempt
    if (/\/lightning\/r\/Account\/[A-Za-z0-9]{18}\/view/i.test(this.page.url())) {
      await this.openOpportunityFromAccountRelatedList();
    }
  }
}
