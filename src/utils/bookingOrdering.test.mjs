import test from 'node:test';
import assert from 'node:assert/strict';
import { sortInvoiceImportBookings } from './bookingOrdering.mjs';

test('invoice import booking list puts the newest created booking first', () => {
  const older = {
    id: 'older',
    clientName: 'A Client',
    startDate: '2026-06-10',
    createdAt: { toMillis: () => 1000 },
  };
  const newest = {
    id: 'newest',
    clientName: 'Z Client',
    startDate: '2026-05-01',
    createdAt: { toMillis: () => 3000 },
  };
  const middle = {
    id: 'middle',
    clientName: 'M Client',
    startDate: '2026-06-20',
    createdAt: { toDate: () => new Date(2000) },
  };

  const sorted = sortInvoiceImportBookings([older, newest, middle]);

  assert.deepEqual(sorted.map((booking) => booking.id), ['newest', 'middle', 'older']);
});

test('invoice import booking list uses service date for legacy bookings without createdAt', () => {
  const oldDate = { id: 'old-date', startDate: '2026-01-15' };
  const newDate = { id: 'new-date', startDate: '2026-03-20' };

  const sorted = sortInvoiceImportBookings([oldDate, newDate]);

  assert.deepEqual(sorted.map((booking) => booking.id), ['new-date', 'old-date']);
});
