import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getOwnPetCareStatus,
  parseGcashDonationText,
} from './ownPetLogic.js';

test('parseGcashDonationText extracts received donation details from screenshot OCR text', () => {
  const parsed = parseGcashDonationText(`
    GCash
    You received PHP 1,250.00 from JUAN DELA CRUZ
    Ref No. 1234 5678 9012
    June 5, 2026 10:42 AM
  `);

  assert.equal(parsed.amount, 1250);
  assert.equal(parsed.donorName, 'JUAN DELA CRUZ');
  assert.equal(parsed.referenceNumber, '123456789012');
  assert.equal(parsed.rawDate, 'June 5, 2026 10:42 AM');
});

test('parseGcashDonationText handles peso symbol and compact reference labels', () => {
  const parsed = parseGcashDonationText(`
    Amount
    \u20b1500.00
    From: Maria Santos
    Reference No: 987654321
  `);

  assert.equal(parsed.amount, 500);
  assert.equal(parsed.donorName, 'Maria Santos');
  assert.equal(parsed.referenceNumber, '987654321');
});

test('getOwnPetCareStatus prioritizes active sickness then vaccine due dates', () => {
  assert.equal(getOwnPetCareStatus({
    isSick: true,
    sickStartedAt: '2026-06-01',
    vaccinesUpdated: true,
    nextVaccineDate: '2026-07-20',
  }, '2026-06-05').key, 'sick');

  assert.equal(getOwnPetCareStatus({
    vaccinesUpdated: true,
    nextVaccineDate: '2026-06-20',
  }, '2026-06-05').key, 'vaccine_due_soon');

  assert.equal(getOwnPetCareStatus({
    vaccinesUpdated: false,
    nextVaccineDate: '2026-05-20',
  }, '2026-06-05').key, 'vaccine_overdue');
});
