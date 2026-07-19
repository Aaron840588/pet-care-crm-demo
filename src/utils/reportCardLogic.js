export const formatVisitDate = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  const isValid = date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;

  return isValid ? date.toLocaleDateString('en-PH', { dateStyle: 'medium' }) : raw;
};

export const safeFilenamePart = (value, fallback) => {
  const sanitized = String(value ?? '').trim().replace(/[<>:"/\\|?*]/g, '-');
  return sanitized || fallback;
};
