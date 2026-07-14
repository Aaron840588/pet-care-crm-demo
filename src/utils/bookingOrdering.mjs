const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return Number(value.toMillis()) || 0;
  if (typeof value.toDate === 'function') return value.toDate()?.getTime?.() || 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value.seconds === 'number') {
    return (value.seconds * 1000) + Math.floor((value.nanoseconds || 0) / 1000000);
  }
  return 0;
};

const localDateMillis = (dateString) => {
  if (!dateString) return 0;
  const [year, month, day] = String(dateString).split('-').map(Number);
  if (!year || !month || !day) return 0;
  return new Date(year, month - 1, day).getTime();
};

export const getBookingCreatedSortValue = (booking) => toMillis(booking?.createdAt);

export const sortInvoiceImportBookings = (bookings = []) => (
  [...bookings].sort((a, b) => {
    const dateDiff = localDateMillis(b?.startDate) - localDateMillis(a?.startDate);
    if (dateDiff !== 0) return dateDiff;

    const createdDiff = getBookingCreatedSortValue(b) - getBookingCreatedSortValue(a);
    if (createdDiff !== 0) return createdDiff;

    const clientDiff = String(a?.clientName || '').localeCompare(String(b?.clientName || ''));
    if (clientDiff !== 0) return clientDiff;

    return String(a?.id || '').localeCompare(String(b?.id || ''));
  })
);
