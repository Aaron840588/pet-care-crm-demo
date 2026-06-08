import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterKeyClientsByStatus,
  getKeyStatusCounts,
  getOrderedKeyClients,
} from './keyTrackerLogic.js';

const clients = [
  { id: 'none-1', name: 'No Key' },
  { id: 'returned-1', name: 'Returned One', keyStatus: 'returned' },
  { id: 'pending-1', name: 'Pending One', keyStatus: 'pending' },
  { id: 'received-1', name: 'Received One', keyStatus: 'received' },
  { id: 'pending-2', name: 'Pending Two', keyStatus: 'pending' },
];

test('getKeyStatusCounts counts active key statuses only', () => {
  assert.deepEqual(getKeyStatusCounts(clients), {
    pending: 2,
    received: 1,
    returned: 1,
  });
});

test('filterKeyClientsByStatus filters active clients by the selected status', () => {
  assert.deepEqual(
    filterKeyClientsByStatus(clients, 'pending').map((client) => client.id),
    ['pending-1', 'pending-2'],
  );
});

test('getOrderedKeyClients keeps pending, received, returned grouping when no filter is selected', () => {
  assert.deepEqual(
    getOrderedKeyClients(clients).map((client) => client.id),
    ['pending-1', 'pending-2', 'received-1', 'returned-1'],
  );
});
