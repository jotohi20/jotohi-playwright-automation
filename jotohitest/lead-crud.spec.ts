import { test, expect } from "@playwright/test";
import { LeadPage } from "../pages/LeadPage";

test("Assessment: Create Lead, validate ID + details, update status, validate status", async ({ page }) => {
  const lead = new LeadPage(page);

  const id = Date.now();
  const first = "Test";
  const last = `Lead${id}`;
  const company = `Company${id}`;
  const newStatus = "Working - Contacted";

  // 1) Create lead
  await lead.gotoLeadsList();
  await lead.clickNew();
  await lead.fillLead(first, last, company);
  await lead.save();

  // ✅ Validation #1: Lead ID (18 chars) from URL
  await expect(page).toHaveURL(/\/lightning\/r\/[a-zA-Z0-9]{18}\/view/i, { timeout: 60_000 });
  const match = page.url().match(/\/lightning\/r\/([a-zA-Z0-9]{18})\/view/i);
  expect(match?.[1]).toMatch(/^[a-zA-Z0-9]{18}$/);

  // ✅ Validation #2: correct details in record view
  await expect(
    page.getByRole("heading", { name: new RegExp(`${first}\\s+${last}`, "i") })
  ).toBeVisible({ timeout: 60_000 });

  await expect(
    page.locator("records-highlights2").locator(`text=${company}`)
  ).toBeVisible({ timeout: 60_000 });

  // 2) Update Status (open Edit modal)
  const editBtn = page.getByRole("button", { name: /^Edit$/i });
  if (await editBtn.isVisible().catch(() => false)) {
    await editBtn.click();
  } else {
    await page.getByRole("button", { name: /Show more actions/i }).first().click();
    await page.getByRole("menuitem", { name: /^Edit$/i }).click();
  }

  // 3) Change Status in the Edit modal
  // Status might be labeled "Status" or "Lead Status" depending on org
  const statusCombo =
    page.getByRole("combobox", { name: /^Lead Status$/i }).first().or(
      page.getByRole("combobox", { name: /^Status$/i }).first()
    );

  await statusCombo.scrollIntoViewIfNeeded();
  await statusCombo.click();

  await page.getByRole("option", { name: new RegExp(`^${newStatus}$`, "i") }).click();
  await page.getByRole("button", { name: /^Save$/i }).click();

// ✅ Validation #3: Status updated (check the Path stage at the top)
await expect(
  page.getByLabel("Path Options").getByTitle(newStatus)
).toBeVisible({ timeout: 60_000 });


  // Optional cleanup (not required by PDF, but good practice)
  // await lead.deleteLead();
  // await lead.expectOnLeadsList();
});
