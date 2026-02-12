📌 Overview

This project demonstrates end-to-end test automation using Playwright + TypeScript for Salesforce.

It covers:

✅ Lead creation
✅ Lead validation (ID + details)
✅ Lead status update
✅ Lead → Opportunity conversion
✅ Opportunity validations
✅ Session reuse with storageState (no repeated login)
✅ Stable sequential execution for Salesforce UI

The suite is designed to be:

reliable

repeatable

MFA-friendly

easy to run for reviewers

🧰 Tech Stack

Playwright

TypeScript

Node.js

Page Object Model (POM)

Salesforce Lightning UI


⚙️ Setup Instructions
1️⃣ Install dependencies
npm install

2️⃣ Install browsers
npx playwright install

🔐 Authentication (Salesforce Login)

This project uses Playwright storageState to reuse sessions and avoid repeated login.

First time only (create session)
npx playwright test auth/auth.setup.ts --project=setup


Complete login/MFA manually → session will be saved to:

storageState.json

After that

No login required for tests.

▶️ Run Tests
Run all tests (recommended)
npx playwright test --project=chromium

Run specific tests
npx playwright test jotohitest/lead-crud.spec.ts --project=chromium
npx playwright test jotohitest/lead-convert.spec.ts --project=chromium

🧪 Test Coverage
✅ Lead CRUD

Create Lead

Validate 18-char ID

Validate details

Update Status

Validate updated Path stage

✅ Lead Conversion

Convert Lead

Create Account + Opportunity

Validate Opportunity page

Validate Account link

Validate Owner

Validate Stage Path

Validate Amount field

✅ Signup

Salesforce Developer signup flow validation


👤 Author

Jonas Hipos
QA Automation Assessment – Playwright + Salesforce
