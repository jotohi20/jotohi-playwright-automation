// jotohitest/lead-convert.spec.ts
import { test, expect } from "@playwright/test";
import { LeadPage } from "../pages/LeadPage";
import { LeadConvertPage } from "../pages/LeadConvertPage";

test("Assessment: Lead → Opportunity Conversion (FULL PDF VALIDATION)", async ({ page }) => {
  const lead = new LeadPage(page);
  const convert = new LeadConvertPage(page);

  const id = Date.now();
  const first = "Test";
  const last = `Lead${id}`;
  const company = `Company${id}`;

  // =================================================
  // STEP 1 — Create Lead
  // =================================================
  await lead.gotoLeadsList();
  await lead.clickNew();
  await lead.fillLead(first, last, company);
  await lead.save();

  // ✅ Lead record page opened (supports both /r/Lead/<id>/view and /r/<id>/view)
  await expect(page).toHaveURL(/\/lightning\/r\/(?:Lead\/)?[a-zA-Z0-9]{15,18}\/view/i, {
    timeout: 60_000,
  });

  // =================================================
  // STEP 2 — Convert Lead
  // =================================================
  await convert.openConvertModal();
  await convert.ensureCreateNewOpportunitySelected();
  await convert.convertAndOpenOpportunity();

  // =================================================
  // VALIDATION #1 — Opportunity page opened
  // =================================================
  await expect(page).toHaveURL(/\/lightning\/r\/Opportunity\/[a-zA-Z0-9]{15,18}\/view/i, {
    timeout: 60_000,
  });

  // =================================================
  // VALIDATION #2 — Related Account is linked correctly
  // =================================================
  const accountLink = page
    .locator(`a[href*="/lightning/r/Account/"]`, { hasText: company })
    .first();
  await expect(accountLink).toBeVisible({ timeout: 60_000 });

  // =================================================
  // VALIDATION #3 — Field validations (Owner, Stage, Amount)
  // =================================================

  // Owner label (visible only)
  const ownerLabel = page
    .locator('p[title="Opportunity Owner"]:visible, span[title="Opportunity Owner"]:visible')
    .first();
  await expect(ownerLabel).toBeVisible({ timeout: 60_000 });

  // Stage (Path) — visible only
  await expect(page.getByRole("button", { name: /Mark Stage as Complete/i })).toBeVisible({
    timeout: 60_000,
  });

  const pathNav = page.locator(".slds-path__nav:visible").first();
  await expect(pathNav).toBeVisible({ timeout: 60_000 });
  await expect(pathNav.locator(".slds-path__item:visible").first()).toBeVisible({
    timeout: 60_000,
  });
  await expect(pathNav.getByText(/Prospecting|Qualification|Needs/i).first()).toBeVisible({
    timeout: 60_000,
  });

  // Amount label (visible only)
  const amountLabel = page
    .locator('p[title="Amount"]:visible, span[title="Amount"]:visible')
    .first();
  await expect(amountLabel).toBeVisible({ timeout: 60_000 });
});
