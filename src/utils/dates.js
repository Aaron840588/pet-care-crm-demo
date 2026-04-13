/**
 * Date utilities — all use LOCAL date parts to avoid UTC timezone bugs.
 * Philippines is UTC+8: using toISOString() for calendar dates can shift a day.
 */

const parseYMD = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return { y, m, d };
};

export const todayLocalStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getDateParts = (dateStr) => parseYMD(dateStr);

export const dateSortValue = (dateStr) => {
  const parts = parseYMD(dateStr);
  if (!parts) return 0;
  const time = new Date(parts.y, parts.m - 1, parts.d).getTime();
  return Number.isNaN(time) ? 0 : time;
};

export const generateDateRange = (startDate, endDate, maxDays = 120) => {
  const startParts = parseYMD(startDate);
  const endParts = parseYMD(endDate);
  if (!startParts || !endParts) return [];

  const start = new Date(startParts.y, startParts.m - 1, startParts.d);
  const end = new Date(endParts.y, endParts.m - 1, endParts.d);
  if (end < start) return [];

  const dates = [];
  const curr = new Date(start);

  while (curr <= end && dates.length < maxDays) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }

  return dates;
};

export const fmtDate = (dateStr) => {
  const parts = parseYMD(dateStr);
  if (!parts) return '—';

  return new Date(parts.y, parts.m - 1, parts.d).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const fmtShort = (dateStr) => {
  const parts = parseYMD(dateStr);
  if (!parts) return '';

  return new Date(parts.y, parts.m - 1, parts.d).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
  });
};

export const fmtDayLabel = (dateStr) => {
  const parts = parseYMD(dateStr);
  if (!parts) return '';

  const date = new Date(parts.y, parts.m - 1, parts.d);
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parts.m - 1];
  return `${month} ${parts.d} ${dayOfWeek}`;
};

export const fmtGcash = (num) => {
  const n = (num || '').replace(/\D/g, '');
  if (n.length === 11) return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  return num;
};
