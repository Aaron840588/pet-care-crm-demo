import assert from 'node:assert/strict';
import { test } from 'node:test';

import { generateICS } from './icsExport.js';

test('generateICS exports selected non-consecutive visit dates as separate events', () => {
  const ics = generateICS({
    id: 'booking-1',
    clientName: 'Ate Rosemarie',
    service: 'Basic Visit|200',
    startDate: '2026-05-28',
    endDate: '2026-05-31',
    daySchedule: [
      { date: '2026-05-28', service: 'Basic Visit|200' },
      { date: '2026-05-31', service: 'Basic Visit|200' },
    ],
  });

  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 2);
  assert.match(ics, /DTSTART;VALUE=DATE:20260528/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260531/);
  assert.doesNotMatch(ics, /DTSTART;VALUE=DATE:20260529/);
  assert.doesNotMatch(ics, /DTSTART;VALUE=DATE:20260530/);
});
