const fs = require('fs');
const path = 'src/views/InvoiceView.jsx';

let content = fs.readFileSync(path, 'utf8');

// Find the start of groupImportedLineItems
const startIdx = content.indexOf('const groupImportedLineItems = (lines) => {');
// Find the exact end of it. The next function is buildSingleDayInvoiceLines
const endIdx = content.indexOf('const buildSingleDayInvoiceLines = (day) => {');

const oldGroup = content.substring(startIdx, endIdx);

const newGroup = `const groupImportedLineItems = (lines) => {
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
    const lineRate = Number(line.customRate || 0);
    const lineBase = lineRate * lineDays;
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

`;

content = content.replace(oldGroup, newGroup);
fs.writeFileSync(path, content);
console.log('Done refactoring grouping logic perfectly');
