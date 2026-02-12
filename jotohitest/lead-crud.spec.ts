import { test, expect } from "@playwright/test";
import { LeadPage } from "../pages/LeadPage";

test("Assessment: Create Lead, validate ID + details, update status, validate status", async ({ page }) => {
  const lead = new LeadPage(page);

  // Test data (unique per run)
  const id = Date.now();
  const first = "Test";
  const last = `Lead${id}`;
  const company = `Company${id}`;
  const newStatus = "Working - Contacted";

  // Create Lead
  await lead.gotoLeadsList();
  await lead.clickNew();
  await lead.fillLead(first, last, company);
  await lead.save();

  // Validate Lead record is created (18-char ID in URL)
  await expect(page).toHaveURL(/\/lightning\/r\/[a-zA-Z0-9]{18}\/view/i, { timeout: 60_000 });
  const match = page.url().match(/\/lightning\/r\/([a-zA-Z0-9]{18})\/view/i);
  expect(match?.[1]).toMatch(/^[a-zA-Z0-9]{18}$/);

  // Validate Lead details displayed on record page
  await expect(page.getByRole("heading", { name: new RegExp(`${first}\\s+${last}`, "i") })).toBeVisible({
    timeout: 60_000,
  });

  await expect(page.locator("records-highlights2").locator(`text=${company}`)).toBeVisible({
    timeout: 60_000,
  });

  // Open Edit (button may be directly visible or under "Show more actions")
  const editBtn = page.getByRole("button", { name: /^Edit$/i });
  if (await editBtn.isVisible().catch(() => false)) {
    await editBtn.click();
  } else {
    await page.getByRole("button", { name: /Show more actions/i }).first().click();
    await page.getByRole("menuitem", { name: /^Edit$/i }).click();
  }

  // Update Lead Status in modal (label may vary by org: "Lead Status" vs "Status")
  const statusCombo = page
    .getByRole("combobox", { name: /^Lead Status$/i })
    .first()
    .or(page.getByRole("combobox", { name: /^Status$/i }).first());

  await statusCombo.scrollIntoViewIfNeeded();
  await statusCombo.click();

  await page.getByRole("option", { name: new RegExp(`^${newStatus}$`, "i") }).click();
  await page.getByRole("button", { name: /^Save$/i }).click();

  // Validate the updated status is reflected in the Path at the top of the record
  await expect(page.getByLabel("Path Options").getByTitle(newStatus)).toBeVisible({
    timeout: 60_000,
  });
});
