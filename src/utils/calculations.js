/**
 * Shared business logic calculations
 * Fixes: CQ1 (dedup), CQ6 (named constant), B16 (negative displayRate), BL6 (step)
 */

// ── Rate constants (BL1: single source of truth) ──────────────────────────────
export const EXTRA_PET_RATE = 50; // ₱50 per additional pet

// ── Discount mode options (shared across Schedule + Invoice) ──────────────────
export const DISC_MODES = [
  { value: 'none',       label: 'No Discount' },
  { value: 'rate_flat',  label: '₱ off per day (rate)' },
  { value: 'total_flat', label: '₱ off total' },
];

// ── Per-day booking total helpers ─────────────────────────────────────────────
export const calcDaySubtotal = (day) => {
  const svcPrice = Number(day.service?.split('|')[1] || 0);
  return (
    svcPrice +
    (Number(day.extraPets  || 0) * EXTRA_PET_RATE) +
    Number(day.specialNeeds || 0) +
    Number(day.distance     || 0) +
    Number(day.extraVisit   || 0)
  );
};

export const calcDayDiscount = (day) => {
  // New per-component discounts object
  if (day.discounts) {
    const total = Object.values(day.discounts).reduce((s, d) => s + Number(d?.amount || 0), 0);
    return Math.min(calcDaySubtotal(day), Math.max(0, total));
  }
  // Legacy single flat discount
  return Math.min(calcDaySubtotal(day), Math.max(0, Number(day.dayDiscount || 0)));
};

export const calcDayTotal = (day) => Math.max(0, calcDaySubtotal(day) - calcDayDiscount(day));

// ── Invoice line item calculation ─────────────────────────────────────────────
export const calcLine = (item) => {
  if (item.isErrand || String(item.customName || '').toLowerCase().includes('errand')) {
    const amt = Number(item.amount || 0);
    return { rate: '', baseAmount: amt, discountAmount: 0, finalAmount: amt, displayRate: '' };
  }

  const rate       = item.customRate !== '' && item.customRate !== null ? Number(item.customRate) : 0;
  const days       = Math.max(1, Number(item.days) || 1);
  const baseAmount = rate * days;
  const val        = Number(item.discountValue || 0);

  let discountAmount = 0;
  if (item.discountMode === 'rate_flat')     discountAmount = Math.min(val * days, baseAmount);
  if (item.discountMode === 'rate_percent')  discountAmount = baseAmount * (Math.min(val, 100) / 100);
  if (item.discountMode === 'total_flat')    discountAmount = Math.min(val, baseAmount);
  if (item.discountMode === 'total_percent') discountAmount = baseAmount * (Math.min(val, 100) / 100);

  const finalAmount = Math.max(0, baseAmount - discountAmount);

  // Compute exact effective display rate per day
  const displayRate = finalAmount / days;

  return { rate, baseAmount, discountAmount, finalAmount, displayRate };
};

// ── Booking-level discount applied to gross total ─────────────────────────────
export const applyDiscount = (gross, numDays, discount) => {
  const mode = discount?.mode || 'none';
  const val  = Number(discount?.value || 0);
  const days = Math.max(1, numDays);
  if (mode === 'rate_flat')     return Math.max(0, gross - val * days);
  if (mode === 'rate_percent')  return Math.max(0, gross * (1 - Math.min(val, 100) / 100));
  if (mode === 'total_flat')    return Math.max(0, gross - val);
  if (mode === 'total_percent') return Math.max(0, gross * (1 - Math.min(val, 100) / 100));
  return gross;
};

// ── New line item factory (CQ4: more unique ID) ───────────────────────────────
export const newLineItem = () => ({
  id:            `li_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
  customName:    '',
  subtitle:      '',
  days:          1,
  note:          '',
  customRate:    '',
  discountMode:  'none',
  discountValue: 0,
  discountLabel: '',
});

// ── Empty discount object ─────────────────────────────────────────────────────
export const emptyDiscount = { mode: 'none', value: 0, label: '', appliesTo: 'service' };

// ── Empty booking form (CQ5: defined outside component) ──────────────────────
export const defaultBookingForm = {
  clientId:  '',
  startDate: '',
  endDate:   '',
  status:    'pending',
  timeText:  '',
  notes:     '',
  discount:  { mode: 'none', value: 0, label: '', appliesTo: 'service' },
};
