export const getInvoiceBalance = (invoice) => (
  Math.max(0, Number(invoice?.total || 0) - Number(invoice?.paid || 0))
);

export const getUnpaidInvoices = (invoices = []) => (
  invoices.filter((invoice) => getInvoiceBalance(invoice) > 0)
);

export const getUnpaidInvoiceTotal = (invoices = []) => (
  getUnpaidInvoices(invoices).reduce((sum, invoice) => sum + getInvoiceBalance(invoice), 0)
);

export const getNextVisitMinutes = (timeText, currentMinutes = 0) => {
  const text = String(timeText || '').trim();
  if (!text || /flexible|any\s*time/i.test(text)) return currentMinutes;

  const parsed = [...text.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi)]
    .map((match) => {
      let hours = Number(match[1]) % 12;
      if (match[3].toLowerCase() === 'pm') hours += 12;
      return hours * 60 + Number(match[2] || 0);
    })
    .sort((a, b) => a - b);

  if (parsed.length === 0) {
    if (/morning|\bam\b/i.test(text)) parsed.push(9 * 60);
    if (/afternoon/i.test(text)) parsed.push(13 * 60);
    if (/evening|\bpm\b/i.test(text)) parsed.push(18 * 60);
  }

  return parsed.find((minutes) => minutes >= currentMinutes) ?? null;
};

export const completeVisitForDate = (booking, date) => {
  if (!booking?.daySchedule?.length) {
    return { changed: true, allComplete: true, updates: { status: 'done' } };
  }

  let changed = false;
  const daySchedule = booking.daySchedule.map((day) => {
    if (day?.date !== date || day.completed) return day;
    changed = true;
    return { ...day, completed: true };
  });
  const allComplete = daySchedule.every((day) => day?.completed);

  return {
    changed,
    allComplete,
    updates: allComplete ? { daySchedule, status: 'done' } : { daySchedule },
  };
};
