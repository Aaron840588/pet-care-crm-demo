import { calcDayDiscount } from './calculations';

const getServiceLabel = (b) => {
  if (b.daySchedule?.length > 0) {
    const svcs = [...new Set(b.daySchedule.map(d => d.service?.split('|')[0]).filter(Boolean))];
    return svcs.length === 1 ? svcs[0] : 'Mixed';
  }
  return b.service?.split('|')[0] || '—';
};

const emptyDiscounts = () => ({
  service:      { amount: 0, label: '' },
  extraPets:    { amount: 0, label: '' },
  specialNeeds: { amount: 0, label: '' },
  distance:     { amount: 0, label: '' },
  extraVisit:   { amount: 0, label: '' },
});

const makeDay = (date, defaultService = '', defaultTime = '') => ({
  date,
  service:          defaultService,
  time:             defaultTime,
  extraPets:        0,
  specialNeeds:     0,
  specialNeedsNote: '',
  distance:         0,
  extraVisit:       0,
  dayDiscount:      0,
  dayDiscountNote:  '',
  discounts:        emptyDiscounts(),
});

const normalizeDay = (day) => ({
  ...makeDay(day.date, day.service || '', day.time || ''),
  ...day,
  dayDiscount: Number(day.dayDiscount || 0),
  dayDiscountNote: day.dayDiscountNote || '',
  discounts: day.discounts || emptyDiscounts(),
});

const getDayDiscountTotal = (schedule = []) =>
  schedule.reduce((sum, day) => sum + calcDayDiscount(day), 0);

const hasPerDayDiscounts = (schedule = []) => getDayDiscountTotal(schedule) > 0;

export { getServiceLabel, emptyDiscounts, makeDay, normalizeDay, getDayDiscountTotal, hasPerDayDiscounts };
