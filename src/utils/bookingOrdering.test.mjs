import test from 'node:test';
import assert from 'node:assert/strict';
import { sortInvoiceImportBookings } from './bookingOrdering.mjs';

test('invoice import booking list puts the newest booking date first', () => {
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

  assert.deepEqual(sorted.map((booking) => booking.id), ['middle', 'older', 'newest']);
});

test('invoice import booking list falls back to newest created booking first when service dates are the same', () => {
  const olderCreated = {
    id: 'older-created',
    startDate: '2026-06-10',
    createdAt: { toMillis: () => 1000 },
  };
  const newerCreated = {
    id: 'newer-created',
    startDate: '2026-06-10',
    createdAt: { toMillis: () => 2000 },
  };

  const sorted = sortInvoiceImportBookings([olderCreated, newerCreated]);

  assert.deepEqual(sorted.map((booking) => booking.id), ['newer-created', 'older-created']);
});
