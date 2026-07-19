import assert from 'node:assert/strict';
import test from 'node:test';

import { formatVisitDate, safeFilenamePart } from './reportCardLogic.js';

test('report card keeps supported free-form and invalid dates readable', () => {
  assert.equal(formatVisitDate('April 12-14'), 'April 12-14');
  assert.equal(formatVisitDate('2026-02-30'), '2026-02-30');
  assert.notEqual(formatVisitDate('2026-07-18'), 'Invalid Date');
  assert.equal(formatVisitDate(''), '—');
});

test('report card filename parts replace path separators and keep a fallback', () => {
  assert.equal(safeFilenamePart('April 12/14', 'Undated'), 'April 12-14');
  assert.equal(safeFilenamePart('  ', 'Undated'), 'Undated');
});
