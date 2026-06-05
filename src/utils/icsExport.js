import { sortVisitSchedule } from './scheduleLogic.js';

/**
 * Generate an RFC 5545 compliant .ics calendar file string.
 * Works with Google Calendar, Apple Calendar, Outlook, etc.
 */

const padDate = (dt) => {
  if (!dt) return '00010101';
  const d = new Date(dt + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '00010101';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

const icsEscape = (str = '') =>
  String(str).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// Add 1 day to a YYYYMMDD string so iCal DTEND is exclusive.
const nextDay = (yyyymmdd) => {
  const d = new Date(yyyymmdd + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

const getCalendarEvents = (booking) => {
  const selectedDays = booking.daySchedule?.length > 0
    ? sortVisitSchedule(booking.daySchedule)
    : [];

  if (selectedDays.length > 0) {
    return selectedDays.map((day, index) => ({
      uid: `${booking.id || Date.now()}-${index + 1}@kats-petsitting`,
      startDate: padDate(day.date),
      endDate: nextDay(padDate(day.date)),
      service: day.service || booking.service,
      time: day.time || '',
    }));
  }

  return [{
    uid: `${booking.id || Date.now()}@kats-petsitting`,
    startDate: padDate(booking.startDate),
    endDate: nextDay(padDate(booking.endDate)),
    service: booking.service,
    time: '',
  }];
};

export function generateICS(booking, client) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const clientName = booking.clientName || 'Client';
  const notes = booking.notes || '';
  const address = client?.address || '';
  const pets = client?.pets?.map((p) => p.name).join(', ') || '';
  const location = icsEscape(address);

  const eventLines = getCalendarEvents(booking).flatMap((event) => {
    const service = event.service?.split('|')[0] || 'Pet-sitting Visit';
    const summary = icsEscape(`${service} - ${clientName}`);
    const description = icsEscape(
      [
        `Client: ${clientName}`,
        pets ? `Pets: ${pets}` : '',
        event.time ? `Time: ${event.time}` : '',
        notes ? `Notes: ${notes}` : '',
      ].filter(Boolean).join('\n')
    );

    return [
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${event.startDate}`,
      `DTEND;VALUE=DATE:${event.endDate}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : '',
      `DESCRIPTION:${description}`,
      'END:VEVENT',
    ].filter((line) => line !== '');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kats Pet-sitting CRM//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...eventLines,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(booking, client) {
  const ics = generateICS(booking, client);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${booking.clientName || 'booking'}_${booking.startDate}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
