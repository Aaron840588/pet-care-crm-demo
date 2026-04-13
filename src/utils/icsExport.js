/**
 * Generate an RFC 5545 compliant .ics calendar file string.
 * Works with Google Calendar, Apple iCal, Outlook, etc.
 */

const padDate = (dt) => {
  if (!dt) return '00010101';
  const d = new Date(dt + 'T00:00:00');
  if (isNaN(d.getTime())) return '00010101';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

const icsEscape = (str = '') =>
  String(str).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// Add 1 day to a YYYYMMDD string so iCal DTEND is exclusive
const nextDay = (yyyymmdd) => {
  const d = new Date(yyyymmdd + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

export function generateICS(booking, client) {
  const uid = `${booking.id || Date.now()}@kats-petsitting`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const startDate  = padDate(booking.startDate);
  const endDate    = nextDay(booking.endDate);   // DTEND is exclusive in all-day events

  const clientName = booking.clientName || 'Client';
  const service    = booking.service?.split('|')[0] || 'Pet-sitting Visit';
  const notes      = booking.notes || '';
  const address    = client?.address || '';
  const pets       = client?.pets?.map(p => p.name).join(', ') || '';

  const summary    = icsEscape(`🐾 ${service} — ${clientName}`);
  const location   = icsEscape(address);
  const description = icsEscape(
    [
      `Client: ${clientName}`,
      pets ? `Pets: ${pets}` : '',
      notes ? `Notes: ${notes}` : '',
    ].filter(Boolean).join('\\n')
  );

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kats Pet-sitting CRM//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : '',
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(line => line !== '').join('\r\n');

  return ics;
}

export function downloadICS(booking, client) {
  const ics  = generateICS(booking, client);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  link.download = `${booking.clientName || 'booking'}_${booking.startDate}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
