import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const desktopViews = [
  ['Dashboard', /Good day|Dashboard/i],
  ['Clients', /^Clients$/i],
  ['Errands & Pabili', /Errands/i],
  ['Schedule', /^Schedule$/i],
  ['Own Pets', /Own Pets/i],
  ['Key Tracker', /Key Tracker/i],
  ['Invoice Builder', /Invoice Builder/i],
  ['Invoice Records', /Invoice Records/i],
  ['Earnings Summary', /Earnings Summary/i],
  ['Visit Report Card', /Visit Report Card/i],
  ['Settings & Backup', /^Settings$/i],
];

const mobilePrimary = [
  ['Today', /Good day|Dashboard/i],
  ['Clients', /^Clients$/i],
  ['Schedule', /^Schedule$/i],
  ['Earnings', /Earnings Summary/i],
];

const mobileMore = [
  ['Errands & Pabili', /Errands/i],
  ['Own Pets', /Own Pets/i],
  ['Key Tracker', /Key Tracker/i],
  ['Invoice Builder', /Invoice Builder/i],
  ['Invoice Records', /Invoice Records/i],
  ['Visit Report Card', /Visit Report Card/i],
  ['Settings & Backup', /^Settings$/i],
];

async function enterDemo(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Launch Public Demo/i }).click();
  await expect(page.locator('main#main-content')).toBeVisible();
}

async function expectNamedVisibleButtons(page) {
  const unnamedButtons = await page.locator('button:visible').evaluateAll((buttons) =>
    buttons
      .filter((button) => {
        const label = button.getAttribute('aria-label')
          || button.getAttribute('title')
          || button.innerText
          || button.querySelector('img')?.getAttribute('alt');
        return !label?.trim();
      })
      .map((button) => button.outerHTML.slice(0, 180)),
  );
  expect(unnamedButtons).toEqual([]);
}

async function expectNoSeriousAxeViolations(page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(serious).toEqual([]);
}

test('every desktop section opens and exposes named controls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await enterDemo(page);

  for (const [navigationName, heading] of desktopViews) {
    await page.getByRole('button', { name: navigationName, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    await expectNamedVisibleButtons(page);
  }

  expect(pageErrors).toEqual([]);
  await expectNoSeriousAxeViolations(page);
});

test('desktop demo reset, reminder, form, and sign-out controls work', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await enterDemo(page);

  await page.getByPlaceholder(/Add a reminder/i).fill('Browser smoke test');
  await page.getByRole('button', { name: /^Add$/ }).click();
  await expect(page.getByText('Browser smoke test')).toBeVisible();
  await page.getByRole('button', { name: /Mark Browser smoke test complete/i }).click();
  await page.getByRole('button', { name: 'Remove reminder' }).last().click();

  await page.getByRole('button', { name: 'Clients', exact: true }).click();
  await page.getByRole('button', { name: /Add Client/i }).click();
  await expect(page.getByRole('button', { name: 'Save Client' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'Settings & Backup' }).click();
  await page.getByRole('button', { name: 'Export Backup' }).click();
  await expect(page.getByRole('dialog', { name: 'Export this backup?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'Reset Demo' }).click();
  await expect(page.getByRole('dialog', { name: 'Reset the public demo?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page.getByRole('button', { name: /Launch Public Demo/i })).toBeVisible();
});

test('mobile navigation opens every section without exposing the offscreen sidebar', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await enterDemo(page);

  await expect(page.locator('.sidebar')).toBeHidden();
  for (const [navigationName, heading] of mobilePrimary) {
    await page.locator('.bottom-nav').getByRole('button', { name: navigationName, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    await expectNamedVisibleButtons(page);
  }

  for (const [navigationName, heading] of mobileMore) {
    await page.locator('.bottom-nav').getByRole('button', { name: /More|Errands|Own|Key|Invoice|Visit|Settings/i }).last().click();
    await page.getByRole('dialog', { name: 'More sections' }).getByRole('button', { name: navigationName }).click();
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    await expectNamedVisibleButtons(page);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  expect(pageErrors).toEqual([]);
  await expectNoSeriousAxeViolations(page);
});
