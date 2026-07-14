import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addVisitDateToSchedule,
  bookingHasVisitOnDate,
  getVisitDateBounds,
  hasSkippedVisitDates,
  removeVisitDateFromSchedule,
} from './scheduleLogic.js';

test('addVisitDateToSchedule adds a later visit date without filling skipped dates', () => {
  const schedule = addVisitDateToSchedule(
    [{ date: '2026-05-28', service: 'Basic Visit|200', time: '7AM' }],
    '2026-05-31',
    'Basic Visit|200',
  );

  assert.deepEqual(schedule.map((day) => day.date), ['2026-05-28', '2026-05-31']);
  assert.deepEqual(getVisitDateBounds(schedule), {
    startDate: '2026-05-28',
    endDate: '2026-05-31',
  });
  assert.equal(hasSkippedVisitDates(schedule), true);
});

test('removeVisitDateFromSchedule keeps the remaining selected dates and details', () => {
  const schedule = removeVisitDateFromSchedule([
    { date: '2026-05-28', service: 'Basic Visit|200', time: '7AM' },
    { date: '2026-05-29', service: 'Play & Visit|250', time: '8AM' },
    { date: '2026-05-31', service: 'Basic Visit|200', time: '9AM' },
  ], '2026-05-29');

  assert.deepEqual(schedule.map((day) => day.date), ['2026-05-28', '2026-05-31']);
  assert.equal(schedule[1].time, '9AM');
  assert.deepEqual(getVisitDateBounds(schedule), {
    startDate: '2026-05-28',
    endDate: '2026-05-31',
  });
});

test('bookingHasVisitOnDate honors selected daySchedule dates over the date range', () => {
  const booking = {
    startDate: '2026-05-28',
    endDate: '2026-05-31',
    daySchedule: [
      { date: '2026-05-28' },
      { date: '2026-05-31' },
    ],
  };

  assert.equal(bookingHasVisitOnDate(booking, '2026-05-28'), true);
  assert.equal(bookingHasVisitOnDate(booking, '2026-05-29'), false);
  assert.equal(bookingHasVisitOnDate(booking, '2026-05-31'), true);
});
