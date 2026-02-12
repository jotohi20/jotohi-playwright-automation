import { test } from "@playwright/test";
import { SignupPage } from "../pages/SignupPage";
import { randomSignupUser } from "../utils/dataFactory";

test("Salesforce Developer signup shows verification page", async ({ page }) => {
  const signup = new SignupPage(page);
  const user = randomSignupUser();

  await signup.goto();
  await signup.fillForm(user);
  await signup.submit();
  await signup.expectSubmissionAttempt();
});
