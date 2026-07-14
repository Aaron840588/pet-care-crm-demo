import { calcDayDiscount } from './calculations.js';
import { dateSortValue, generateDateRange } from './dates.js';

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

const sortVisitSchedule = (schedule = []) => (
  [...schedule]
    .filter((day) => day?.date)
    .map(normalizeDay)
    .sort((a, b) => dateSortValue(a.date) - dateSortValue(b.date))
);

const getVisitDateBounds = (schedule = []) => {
  const sorted = sortVisitSchedule(schedule);
  return {
    startDate: sorted[0]?.date || '',
    endDate: sorted[sorted.length - 1]?.date || '',
  };
};

const buildVisitScheduleFromRange = (start, end, prevSchedule = [], defaultService = '', defaultTime = '') => {
  const dates = generateDateRange(start, end);
  return dates.map((date) => {
    const existing = prevSchedule.find((day) => day?.date === date);
    return normalizeDay(existing || makeDay(date, defaultService, defaultTime));
  });
};

const addVisitDateToSchedule = (schedule = [], date, defaultService = '', defaultTime = '') => {
  if (!date) return sortVisitSchedule(schedule);
  const hasDate = schedule.some((day) => day?.date === date);
  const next = hasDate ? schedule : [...schedule, makeDay(date, defaultService, defaultTime)];
  return sortVisitSchedule(next);
};

const removeVisitDateFromSchedule = (schedule = [], date) => (
  sortVisitSchedule(schedule.filter((day) => day?.date !== date))
);

const hasSkippedVisitDates = (schedule = []) => {
  const sorted = sortVisitSchedule(schedule);
  if (sorted.length < 2) return false;
  const { startDate, endDate } = getVisitDateBounds(sorted);
  return generateDateRange(startDate, endDate).length > sorted.length;
};

const bookingHasVisitOnDate = (booking, date) => {
  if (!booking || !date) return false;
  if (booking.daySchedule?.length > 0) {
    return booking.daySchedule.some((day) => day?.date === date);
  }
  if (!booking.startDate || !booking.endDate) return false;
  return booking.startDate <= date && booking.endDate >= date;
};

const getDayDiscountTotal = (schedule = []) =>
  schedule.reduce((sum, day) => sum + calcDayDiscount(day), 0);

const hasPerDayDiscounts = (schedule = []) => getDayDiscountTotal(schedule) > 0;

export {
  getServiceLabel,
  emptyDiscounts,
  makeDay,
  normalizeDay,
  sortVisitSchedule,
  getVisitDateBounds,
  buildVisitScheduleFromRange,
  addVisitDateToSchedule,
  removeVisitDateFromSchedule,
  hasSkippedVisitDates,
  bookingHasVisitOnDate,
  getDayDiscountTotal,
  hasPerDayDiscounts,
};
