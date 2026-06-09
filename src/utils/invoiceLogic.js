import { fmtShort, dateSortValue } from './dates';
import { calcDayDiscount, newLineItem, EXTRA_PET_RATE } from './calculations';

const applyDiscountAcrossLines = (lines, discountAmount, discountLabel) => {
  let remaining = Math.max(0, Number(discountAmount || 0));

  return lines.map((line) => {
    if (remaining <= 0) return line;

    const lineAmount = Math.max(0, (Number(line.customRate || 0) || 0) * Math.max(1, Number(line.days) || 1));
    if (lineAmount <= 0) return line;

    const usedDiscount = Math.min(remaining, lineAmount);
    remaining -= usedDiscount;

    return {
      ...line,
      discountMode: 'total_flat',
      discountValue: usedDiscount,
      discountLabel: line.discountLabel || discountLabel || 'Discount',
    };
  });
};

const buildDateNote = (dates) => {
  const first = dates[0];
  const last = dates[dates.length - 1];

  if (!first) return '';
  if (dates.length <= 1 || first === last) return `(${fmtShort(first)})`;

  return `(${fmtShort(first)} - ${fmtShort(last)})`;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const buildMergedDateNote = (dates) => {
  const sortedDates = [...new Set((dates || []).filter(Boolean))]
    .sort((a, b) => dateSortValue(a) - dateSortValue(b));

  if (sortedDates.length === 0) return '';
  if (sortedDates.length === 1) {
    // Full month name single date: "April 9"
    const [y, m, d] = sortedDates[0].split('-').map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric' });
    return `(${label})`;
  }

  // Group dates by year-month
  const byMonth = {};
  for (const ds of sortedDates) {
    const parts = ds.split('-');
    const mk = `${parts[0]}-${parts[1]}`;
    if (!byMonth[mk]) byMonth[mk] = [];
    byMonth[mk].push(Number(parts[2]));
  }

  const monthKeys = Object.keys(byMonth).sort();
  const segments = monthKeys.map((mk) => {
    const [y, m] = mk.split('-').map(Number);
    const days = byMonth[mk].sort((a, b) => a - b);
    const monthName = new Date(y, m - 1, 1).toLocaleDateString('en-PH', { month: 'long' });
    // Build compact ranges: 1,2,3,4,5 → "1-5", gaps stay individual
    const ranges = [];
    let rs = days[0], re = days[0];
    for (let i = 1; i < days.length; i++) {
      if (days[i] === re + 1) { re = days[i]; }
      else { ranges.push(rs === re ? String(rs) : `${rs}-${re}`); rs = days[i]; re = days[i]; }
    }
    ranges.push(rs === re ? String(rs) : `${rs}-${re}`);
    return `${monthName} ${ranges.join(', ')}`;
  });

  return `(${segments.join(' / ')})`;
};

const groupImportedLineItems = (lines) => {
  // Key = customName + rate + itemType + EXACT DISCOUNT VALUE computed per-day
  // We MUST separate days that have different discount amounts per day, so they don't merge into a weird average rate.
  const grouped = new Map();

  lines.forEach((line) => {
    // Determine the exact discount PER DAY so we group identically-discounted days together
    const discountMode  = line.discountMode  || 'none';
    let discountPerDay = 0;
    
    if (discountMode === 'total_flat') {
      discountPerDay = Number(line.discountValue || 0) / Math.max(1, Number(line.days) || 1);
    } else if (discountMode === 'rate_flat') {
      discountPerDay = Number(line.discountValue || 0);
    }

    const key = [
      line.customName || '',
      String(line.customRate ?? ''),
      line._itemType || '',
      String(discountPerDay),
      line.discountLabel || ''
    ].join('||');

    const lineDays = Math.max(1, Number(line.days) || 1);
    let discAmt = discountPerDay * lineDays;

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...line,
        discountMode:  discAmt > 0 ? 'total_flat' : 'none',
        discountValue: discAmt,
        discountLabel: line.discountLabel || '',
        days: lineDays,
        _sourceDates: [...new Set((line._sourceDates || []).filter(Boolean))],
      });
      return;
    }

    const existing = grouped.get(key);
    existing.days += lineDays;
    existing._sourceDates = [...new Set([...(existing._sourceDates || []), ...(line._sourceDates || [])])]
      .sort((a, b) => dateSortValue(a) - dateSortValue(b));
    
    existing.discountValue = Number(existing.discountValue || 0) + discAmt;
    if (discAmt > 0) existing.discountMode = 'total_flat';
    if (!existing.discountLabel && line.discountLabel) existing.discountLabel = line.discountLabel;
    if (!existing.subtitle && line.subtitle) existing.subtitle = line.subtitle;
  });

  return [...grouped.values()].map((line) => {
    const { _sourceDates, ...rest } = line;
    return {
      ...rest,
      note: buildMergedDateNote(_sourceDates),
    };
  });
};

const buildSingleDayInvoiceLines = (day) => {
  const note = buildDateNote([day.date]);
  const sourceDates = day.date ? [day.date] : [];
  const disc = day.discounts; // new per-component discounts object
  const lines = [];
  const svcName = day.service?.split('|')[0] || '';
  const svcPrice = Number(day.service?.split('|')[1] || 0);
  const svcDisc = disc ? Number(disc.service?.amount || 0) : 0;

  lines.push({
    ...newLineItem(),
    customName: svcName,
    subtitle: '(up to 2 pets)',
    days: 1,
    note,
    customRate: String(svcPrice),
    discountMode:  svcDisc > 0 ? 'total_flat' : 'none',
    discountValue: svcDisc,
    discountLabel: disc?.service?.label || '',
    _itemType: 'service',
  });

  if (Number(day.extraPets || 0) > 0) {
    const extraPets = Number(day.extraPets || 0);
    const epRate = extraPets * EXTRA_PET_RATE;
    const epDisc = disc ? Number(disc.extraPets?.amount || 0) : 0;
    lines.push({
      ...newLineItem(),
      customName: `Additional +${extraPets} Pet${extraPets !== 1 ? 's' : ''}`,
      subtitle: `(₱${EXTRA_PET_RATE}/add'l pet = ₱${epRate})`,
      days: 1,
      note,
      customRate: String(epRate),
      discountMode:  epDisc > 0 ? 'total_flat' : 'none',
      discountValue: epDisc,
      discountLabel: disc?.extraPets?.label || '',
      _itemType: 'extraPets',
    });
  }

  if (Number(day.specialNeeds || 0) > 0) {
    const snDisc = disc ? Number(disc.specialNeeds?.amount || 0) : 0;
    lines.push({
      ...newLineItem(),
      customName: 'Special Needs',
      subtitle: day.specialNeedsNote ? `(${day.specialNeedsNote})` : '',
      days: 1,
      note,
      customRate: String(Number(day.specialNeeds || 0)),
      discountMode:  snDisc > 0 ? 'total_flat' : 'none',
      discountValue: snDisc,
      discountLabel: disc?.specialNeeds?.label || '',
      _itemType: 'specialNeeds',
    });
  }

  if (Number(day.distance || 0) > 0) {
    const distDisc = disc ? Number(disc.distance?.amount || 0) : 0;
    lines.push({
      ...newLineItem(),
      customName: 'Distance Charge',
      days: 1,
      note,
      customRate: String(Number(day.distance || 0)),
      discountMode:  distDisc > 0 ? 'total_flat' : 'none',
      discountValue: distDisc,
      discountLabel: disc?.distance?.label || '',
      _itemType: 'distance',
    });
  }

  if (Number(day.extraVisit || 0) > 0) {
    const evDisc = disc ? Number(disc.extraVisit?.amount || 0) : 0;
    lines.push({
      ...newLineItem(),
      customName: 'Extra Visit',
      days: 1,
      note,
      customRate: String(Number(day.extraVisit || 0)),
      discountMode:  evDisc > 0 ? 'total_flat' : 'none',
      discountValue: evDisc,
      discountLabel: disc?.extraVisit?.label || '',
      _itemType: 'extraVisit',
    });
  }

  // For legacy days (no discounts object), fall back to applyDiscountAcrossLines
  const processedLines = disc
    ? lines
    : applyDiscountAcrossLines(lines, calcDayDiscount(day), day.dayDiscountNote);

  return processedLines.map((line) => ({
    ...line,
    note: buildMergedDateNote(sourceDates),
    _sourceDates: sourceDates,
  }));
};

const PREVIEW_CARD_WIDTH = 460;
export { applyDiscountAcrossLines, buildDateNote, buildMergedDateNote, groupImportedLineItems, buildSingleDayInvoiceLines };
