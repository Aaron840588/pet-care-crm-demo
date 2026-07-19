import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getInvoiceBalance,
  getNextVisitMinutes,
  getUnpaidInvoices,
  getUnpaidInvoiceTotal,
  completeVisitForDate,
} from './dashboardLogic.js';

test('getInvoiceBalance clamps overpaid invoices to zero', () => {
  assert.equal(getInvoiceBalance({ total: 1000, paid: 1250 }), 0);
});

test('getUnpaidInvoices returns only invoices with a positive balance', () => {
  const invoices = [
    { id: 'paid', total: 800, paid: 800 },
    { id: 'overpaid', total: 500, paid: 650 },
    { id: 'partial', total: 1200, paid: 300 },
  ];

  assert.deepEqual(getUnpaidInvoices(invoices).map((invoice) => invoice.id), ['partial']);
  assert.equal(getUnpaidInvoiceTotal(invoices), 900);
});

test('getNextVisitMinutes orders real times and ignores past sessions', () => {
  assert.equal(getNextVisitMinutes('2:00 PM', 8 * 60), 14 * 60);
  assert.equal(getNextVisitMinutes('9:00 AM + 6:00 PM', 12 * 60), 18 * 60);
  assert.equal(getNextVisitMinutes('9:00 AM', 12 * 60), null);
  assert.equal(getNextVisitMinutes('Flexible', 12 * 60), 12 * 60);
});

test('completeVisitForDate keeps a multi-day booking open until its final visit', () => {
  const booking = {
    status: 'pending',
    daySchedule: [
      { date: '2026-07-18', completed: false },
      { date: '2026-07-19', completed: false },
    ],
  };

  const first = completeVisitForDate(booking, '2026-07-18');
  assert.equal(first.allComplete, false);
  assert.equal(first.updates.status, undefined);
  assert.equal(first.updates.daySchedule[0].completed, true);

  const final = completeVisitForDate(
    { ...booking, daySchedule: first.updates.daySchedule },
    '2026-07-19',
  );
  assert.equal(final.allComplete, true);
  assert.equal(final.updates.status, 'done');
});
