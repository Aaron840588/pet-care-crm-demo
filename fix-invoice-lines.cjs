const fs = require('fs');
const path = 'src/views/InvoiceView.jsx';
let c = fs.readFileSync(path, 'utf8');

// Find the function using a more flexible approach
const startMarker = 'const buildSingleDayInvoiceLines = (day) => {\r\n';
const endMarker = '\r\n};\r\n\r\nconst PREVIEW_CARD_WIDTH';

const start = c.indexOf(startMarker);
const end = c.indexOf(endMarker, start);

if (start === -1 || end === -1) {
  console.log('Could not find function. start:', start, 'end:', end);
  process.exit(1);
}

const oldFn = c.substring(start, end + endMarker.length);
console.log('Found function, length:', oldFn.length);

const newFn = `const buildSingleDayInvoiceLines = (day) => {\r\n  const note = buildDateNote([day.date]);\r\n  const sourceDates = day.date ? [day.date] : [];\r\n  const disc = day.discounts; // new per-component discounts object\r\n  const lines = [];\r\n  const svcName = day.service?.split('|')[0] || '';\r\n  const svcPrice = Number(day.service?.split('|')[1] || 0);\r\n  const svcDisc = disc ? Number(disc.service?.amount || 0) : 0;\r\n\r\n  lines.push({\r\n    ...newLineItem(),\r\n    customName: svcName,\r\n    subtitle: '(up to 2 pets)',\r\n    days: 1,\r\n    note,\r\n    customRate: String(svcPrice),\r\n    discountMode:  svcDisc > 0 ? 'total_flat' : 'none',\r\n    discountValue: svcDisc,\r\n    discountLabel: disc?.service?.label || '',\r\n    _itemType: 'service',\r\n  });\r\n\r\n  if (Number(day.extraPets || 0) > 0) {\r\n    const extraPets = Number(day.extraPets || 0);\r\n    const epRate = extraPets * EXTRA_PET_RATE;\r\n    const epDisc = disc ? Number(disc.extraPets?.amount || 0) : 0;\r\n    lines.push({\r\n      ...newLineItem(),\r\n      customName: \`Additional +\${extraPets} Pet\${extraPets !== 1 ? 's' : ''}\`,\r\n      subtitle: \`(₱\${EXTRA_PET_RATE}/add'l pet = ₱\${epRate})\`,\r\n      days: 1,\r\n      note,\r\n      customRate: String(epRate),\r\n      discountMode:  epDisc > 0 ? 'total_flat' : 'none',\r\n      discountValue: epDisc,\r\n      discountLabel: disc?.extraPets?.label || '',\r\n      _itemType: 'extraPets',\r\n    });\r\n  }\r\n\r\n  if (Number(day.specialNeeds || 0) > 0) {\r\n    const snDisc = disc ? Number(disc.specialNeeds?.amount || 0) : 0;\r\n    lines.push({\r\n      ...newLineItem(),\r\n      customName: 'Special Needs',\r\n      subtitle: day.specialNeedsNote ? \`(\${day.specialNeedsNote})\` : '',\r\n      days: 1,\r\n      note,\r\n      customRate: String(Number(day.specialNeeds || 0)),\r\n      discountMode:  snDisc > 0 ? 'total_flat' : 'none',\r\n      discountValue: snDisc,\r\n      discountLabel: disc?.specialNeeds?.label || '',\r\n      _itemType: 'specialNeeds',\r\n    });\r\n  }\r\n\r\n  if (Number(day.distance || 0) > 0) {\r\n    const distDisc = disc ? Number(disc.distance?.amount || 0) : 0;\r\n    lines.push({\r\n      ...newLineItem(),\r\n      customName: 'Distance Charge',\r\n      days: 1,\r\n      note,\r\n      customRate: String(Number(day.distance || 0)),\r\n      discountMode:  distDisc > 0 ? 'total_flat' : 'none',\r\n      discountValue: distDisc,\r\n      discountLabel: disc?.distance?.label || '',\r\n      _itemType: 'distance',\r\n    });\r\n  }\r\n\r\n  if (Number(day.extraVisit || 0) > 0) {\r\n    const evDisc = disc ? Number(disc.extraVisit?.amount || 0) : 0;\r\n    lines.push({\r\n      ...newLineItem(),\r\n      customName: 'Extra Visit',\r\n      days: 1,\r\n      note,\r\n      customRate: String(Number(day.extraVisit || 0)),\r\n      discountMode:  evDisc > 0 ? 'total_flat' : 'none',\r\n      discountValue: evDisc,\r\n      discountLabel: disc?.extraVisit?.label || '',\r\n      _itemType: 'extraVisit',\r\n    });\r\n  }\r\n\r\n  // For legacy days (no discounts object), fall back to applyDiscountAcrossLines\r\n  const processedLines = disc\r\n    ? lines\r\n    : applyDiscountAcrossLines(lines, calcDayDiscount(day), day.dayDiscountNote);\r\n\r\n  return processedLines.map((line) => ({\r\n    ...line,\r\n    note: buildMergedDateNote(sourceDates),\r\n    _sourceDates: sourceDates,\r\n  }));\r\n};\r\n\r\nconst PREVIEW_CARD_WIDTH`;

c = c.substring(0, start) + newFn + c.substring(end + endMarker.length);
fs.writeFileSync(path, c);
console.log('✅ Updated buildSingleDayInvoiceLines');
