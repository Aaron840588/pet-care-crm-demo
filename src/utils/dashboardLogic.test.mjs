import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getInvoiceBalance,
  getUnpaidInvoices,
  getUnpaidInvoiceTotal,
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
