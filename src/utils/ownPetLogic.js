import { dateSortValue, todayLocalStr } from './dates.js';

const PESO_SYMBOL = '\\u20b1';
const CURRENCY_AMOUNT_RE = new RegExp(`(?:php|${PESO_SYMBOL}|p)\\s*([0-9][0-9,]*(?:\\.\\d{1,2})?)`, 'i');
const REFERENCE_RE = /(?:ref(?:erence)?(?:\s*no\.?)?|trans(?:action)?\s*(?:id|no\.?)?)\s*[:#-]?\s*([0-9][0-9\s-]{5,})/i;
const MONTH_DATE_RE = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*(?:am|pm)?)?/i;

const cleanSpaces = (value = '') => String(value).replace(/\s+/g, ' ').trim();

export const parseMoneyAmount = (text = '') => {
  const match = String(text).match(CURRENCY_AMOUNT_RE);
  if (!match) return 0;
  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

export const parseGcashDonationText = (text = '') => {
  const rawText = cleanSpaces(text);
  const referenceMatch = rawText.match(REFERENCE_RE);
  const receivedMatch = rawText.match(new RegExp(`received\\s+(?:php|${PESO_SYMBOL}|p)?\\s*[0-9][0-9,]*(?:\\.\\d{1,2})?\\s+from\\s+(.+?)(?=\\s+(?:ref|reference|trans|transaction|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\\b|$)`, 'i'));
  const fromMatch = rawText.match(new RegExp(`\\bfrom\\s*[:-]?\\s+(.+?)(?=\\s+(?:ref|reference|trans|transaction|amount|php|${PESO_SYMBOL}|p\\s*[0-9]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\\b|$)`, 'i'));
  const dateMatch = rawText.match(MONTH_DATE_RE);

  return {
    amount: parseMoneyAmount(rawText),
    donorName: cleanSpaces(receivedMatch?.[1] || fromMatch?.[1] || ''),
    referenceNumber: referenceMatch?.[1]?.replace(/\D/g, '') || '',
    rawDate: cleanSpaces(dateMatch?.[0] || ''),
    rawText,
  };
};

export const getOwnPetCareStatus = (pet, today = todayLocalStr()) => {
  if (pet?.isSick) {
    return {
      key: 'sick',
      label: pet.sickStartedAt ? `Sick since ${pet.sickStartedAt}` : 'Currently sick',
      tone: 'danger',
    };
  }

  const nextVaccineDate = pet?.nextVaccineDate || '';
  if (!pet?.vaccinesUpdated || (nextVaccineDate && dateSortValue(nextVaccineDate) < dateSortValue(today))) {
    return {
      key: 'vaccine_overdue',
      label: nextVaccineDate ? `Vaccine overdue: ${nextVaccineDate}` : 'Vaccine needs update',
      tone: 'warning',
    };
  }

  if (nextVaccineDate) {
    const daysUntil = Math.ceil((dateSortValue(nextVaccineDate) - dateSortValue(today)) / 86400000);
    if (daysUntil <= 30) {
      return {
        key: 'vaccine_due_soon',
        label: `Vaccine due in ${Math.max(daysUntil, 0)} day${daysUntil === 1 ? '' : 's'}`,
        tone: 'notice',
      };
    }
  }

  return {
    key: 'ok',
    label: 'Health and vaccines okay',
    tone: 'success',
  };
};
