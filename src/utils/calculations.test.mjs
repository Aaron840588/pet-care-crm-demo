import assert from 'node:assert/strict';
import test from 'node:test';

import { calcDayDiscount, calcDayTotal, calcLine } from './calculations.js';
import { buildSingleDayInvoiceLines } from './invoiceLogic.js';

const oversizedServiceDiscountDay = {
  date: '2026-07-18',
  service: 'Basic Visit|200',
  extraPets: 1,
  specialNeeds: 25.5,
  distance: 40,
  extraVisit: 0,
  discounts: {
    service: { amount: 500, label: 'Courtesy service' },
    extraPets: { amount: 10, label: 'Extra pet discount' },
    specialNeeds: { amount: -5, label: 'Invalid negative discount' },
    distance: { amount: 100, label: 'Travel discount' },
  },
};

test('per-component booking discounts cannot erase unrelated charges', () => {
  assert.equal(calcDayDiscount(oversizedServiceDiscountDay), 250);
  assert.equal(calcDayTotal(oversizedServiceDiscountDay), 65.5);
});

test('invoice import applies the same component caps as the booking total', () => {
  const lines = buildSingleDayInvoiceLines(oversizedServiceDiscountDay);
  const invoiceDiscount = lines.reduce((sum, line) => sum + calcLine(line).discountAmount, 0);
  const invoiceTotal = lines.reduce((sum, line) => sum + calcLine(line).finalAmount, 0);

  assert.equal(invoiceDiscount, calcDayDiscount(oversizedServiceDiscountDay));
  assert.equal(invoiceTotal, calcDayTotal(oversizedServiceDiscountDay));
  assert.equal(lines.find((line) => line._itemType === 'service').discountValue, 200);
  assert.equal(lines.find((line) => line._itemType === 'distance').discountValue, 40);
});

test('legacy and invoice discounts never increase a total when values are negative', () => {
  assert.equal(calcDayDiscount({ service: 'Basic Visit|200', dayDiscount: -20 }), 0);
  assert.deepEqual(
    calcLine({ customRate: '200', days: 1, discountMode: 'total_flat', discountValue: -20 }),
    { rate: 200, baseAmount: 200, discountAmount: 0, finalAmount: 200, displayRate: 200 },
  );
});
