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
const toNonNegativeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

export const capComponentDiscount = (discount, componentAmount) => (
  Math.min(toNonNegativeNumber(discount), toNonNegativeNumber(componentAmount))
);

export const calcDayComponentAmounts = (day) => ({
  service: toNonNegativeNumber(day.service?.split('|')[1]),
  extraPets: toNonNegativeNumber(day.extraPets) * EXTRA_PET_RATE,
  specialNeeds: toNonNegativeNumber(day.specialNeeds),
  distance: toNonNegativeNumber(day.distance),
  extraVisit: toNonNegativeNumber(day.extraVisit),
});

export const calcDaySubtotal = (day) => {
  const amounts = calcDayComponentAmounts(day);
  return Object.values(amounts).reduce((sum, amount) => sum + amount, 0);
};

export const calcDayDiscount = (day) => {
  // New per-component discounts object
  if (day.discounts) {
    const amounts = calcDayComponentAmounts(day);
    return Object.entries(amounts).reduce(
      (sum, [component, amount]) => (
        sum + capComponentDiscount(day.discounts?.[component]?.amount, amount)
      ),
      0,
    );
  }
  // Legacy single flat discount
  return capComponentDiscount(day.dayDiscount, calcDaySubtotal(day));
};

export const calcDayTotal = (day) => Math.max(0, calcDaySubtotal(day) - calcDayDiscount(day));

// ── Invoice line item calculation ─────────────────────────────────────────────
export const calcLine = (item) => {
  if (item.isErrand || String(item.customName || '').toLowerCase().includes('errand')) {
    const amt = toNonNegativeNumber(item.amount);
    return { rate: '', baseAmount: amt, discountAmount: 0, finalAmount: amt, displayRate: '' };
  }

  const rate       = item.customRate !== '' && item.customRate !== null ? toNonNegativeNumber(item.customRate) : 0;
  const days       = Math.max(1, Number(item.days) || 1);
  const baseAmount = rate * days;
  const val        = toNonNegativeNumber(item.discountValue);

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
  const total = toNonNegativeNumber(gross);
  const val  = toNonNegativeNumber(discount?.value);
  const days = Math.max(1, numDays);
  if (mode === 'rate_flat')     return Math.max(0, total - val * days);
  if (mode === 'rate_percent')  return Math.max(0, total * (1 - Math.min(val, 100) / 100));
  if (mode === 'total_flat')    return Math.max(0, total - val);
  if (mode === 'total_percent') return Math.max(0, total * (1 - Math.min(val, 100) / 100));
  return total;
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
