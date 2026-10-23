import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

async function navigate(page, name, mobile) {
  if (mobile) {
    const primary = { Dashboard: 'Today', Clients: 'Clients', Schedule: 'Schedule', 'Earnings Summary': 'Earnings' };
    if (primary[name]) await page.locator('.bottom-nav').getByRole('button', { name: primary[name], exact: true }).click();
    else {
      await page.locator('.bottom-nav button[aria-controls]').click();
      await page.getByRole('dialog', { name: 'More sections' }).getByRole('button', { name, exact: true }).click();
    }
  } else await page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
  await expect(page.locator('main h2').first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.auditErrors = [];
  page.auditCloud = [];
  page.on('pageerror', error => page.auditErrors.push(error.message));
  page.on('request', request => {
    if (/firestore.googleapis|identitytoolkit.googleapis|securetoken.googleapis|generativelanguage.googleapis/.test(request.url())) page.auditCloud.push(request.url().split('?')[0]);
  });
  await page.goto('/');
  await page.getByRole('heading', { name: /Good/ }).waitFor();
});

test.afterEach(async ({ page }) => {
  expect(page.auditErrors).toEqual([]);
  expect(page.auditCloud).toEqual([]);
});

test('client CRUD preserves cat type across pet biographies', async ({ page, isMobile }) => {
  await navigate(page, 'Clients', isMobile);
  await page.getByRole('button', { name: '+ Add Client', exact: true }).click();
  await page.getByPlaceholder('e.g. Kuya Paolo').fill('Audit Demo Client');
  await page.getByPlaceholder('e.g. Luna, Mochi').fill('Audit Cat');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Save Client', exact: true }).click();
  await page.getByRole('button', { name: 'View pet bios for client Audit Demo Client' }).click();
  const bios = page.getByRole('dialog', { name: 'Audit Demo Client pet bios' });
  await expect(bios.getByRole('combobox')).toHaveValue('Cat');
  await bios.getByRole('combobox').selectOption('Rabbit');
  await bios.getByRole('button', { name: /Save Pet Bios/ }).click();
  await page.getByRole('button', { name: 'View pet bios for client Audit Demo Client' }).click();
  await expect(bios.getByRole('combobox')).toHaveValue('Rabbit');
  await page.getByRole('button', { name: 'Close pet bios' }).click();
  await page.getByRole('button', { name: 'Edit profile for client Audit Demo Client' }).click();
  await page.getByPlaceholder('e.g. Kuya Paolo').fill('Audit Demo Client Edited');
  await page.getByRole('button', { name: 'Save Client', exact: true }).click();
  await page.getByRole('button', { name: 'Delete profile for client Audit Demo Client Edited' }).click();
  await page.getByRole('button', { name: 'Delete Client', exact: true }).click();
  await expect(page.getByText('Audit Demo Client Edited', { exact: true })).toHaveCount(0);
});

test('booking save, status, detail and calendar export work', async ({ page, isMobile }) => {
  await navigate(page, 'Schedule', isMobile);
  await page.getByRole('button', { name: '+ Add Booking', exact: true }).click();
  const form = page.locator('form');
  await form.locator('select').first().selectOption({ label: 'Sarah Smith' });
  await form.locator('input[type="date"]').nth(0).fill('2026-10-23');
  await form.locator('input[type="date"]').nth(1).fill('2026-10-23');
  await form.getByRole('button', { name: 'Add Booking', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View details of booking for Sarah Smith' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'View details of booking for Sarah Smith' }).first().click();
  await expect(page.getByText(/Visit Details/)).toBeVisible();
  await page.getByRole('button', { name: 'Close visit details', exact: true }).click();
  const status = page.getByRole('combobox', { name: 'Change booking status for Sarah Smith', exact: true }).first();
  await status.selectOption('active');
  await expect(status).toHaveValue('active');
  const calendar = page.getByRole(isMobile ? 'button' : 'link', { name: 'Export Sarah Smith booking to calendar' }).first();
  const [download] = await Promise.all([page.waitForEvent('download'), calendar.click()]);
  const text = await fs.readFile(await download.path(), 'utf8');
  expect(text).toContain('BEGIN:VCALENDAR');
  expect(text).toContain('Sarah Smith');
});

test('errand creation and completion are reflected in the completed list', async ({ page, isMobile }) => {
  await navigate(page, 'Errands & Pabili', isMobile);
  await page.getByRole('button', { name: 'New Errand', exact: true }).click();
  await page.getByPlaceholder("List Title (e.g. Ate Jasmine's Groceries)").fill('Audit Sample Shopping');
  await page.getByPlaceholder('Item (e.g. Cat Food)').fill('Sample food');
  await page.getByPlaceholder('Cost (₱)').fill('75');
  await page.getByRole('button', { name: 'Save Errand', exact: true }).click();
  await expect(page.getByText('Audit Sample Shopping', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mark Audit Sample Shopping done', exact: true }).click();
  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(page.getByText('Audit Sample Shopping', { exact: true })).toBeVisible();
});

test('invoice image, report image and JSON backup downloads contain generated data', async ({ page, isMobile }) => {
  test.setTimeout(60_000);
  await page.getByRole('button', { name: 'Invoice', exact: true }).first().click();
  const [invoice] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '⬇️ Save', exact: true }).click()]);
  const invoiceBytes = await fs.readFile(await invoice.path());
  expect(invoiceBytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(invoiceBytes.length).toBeGreaterThan(5000);
  await navigate(page, 'Dashboard', isMobile);
  await page.getByRole('button', { name: 'Report', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: /Visit Report Card/ })).toBeVisible();
  const [report] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save', exact: true }).click()]);
  const reportBytes = await fs.readFile(await report.path());
  expect(reportBytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(reportBytes.length).toBeGreaterThan(5000);
  await navigate(page, 'Settings & Backup', isMobile);
  await expect(page.getByRole('button', { name: /Import Backup/ })).toBeDisabled();
  const [backup] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export Backup', exact: true }).click()]);
  const data = JSON.parse(await fs.readFile(await backup.path(), 'utf8'));
  expect(data.clients).toHaveLength(3);
  expect(data.bookings).toHaveLength(2);
  expect(data.clients[0].name).toBe('Demo Client A');
});

test('own-pet and donation records save in the synthetic session', async ({ page, isMobile }) => {
  await navigate(page, 'Own Pets', isMobile);
  await page.getByPlaceholder('e.g. Rosemarie').fill('Audit Rescue Cat');
  await page.getByRole('button', { name: 'Add Pet', exact: true }).click();
  await expect(page.getByText('Audit Rescue Cat', { exact: true }).first()).toBeVisible();
  await page.getByPlaceholder('from screenshot').fill('Demo Donor');
  await page.getByPlaceholder('0', { exact: true }).fill('50');
  await page.getByRole('button', { name: 'Save Donation', exact: true }).click();
  await expect(page.getByText('Demo Donor', { exact: true }).first()).toBeVisible();
});
