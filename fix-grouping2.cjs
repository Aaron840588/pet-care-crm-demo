const fs = require('fs');
const path = 'src/views/InvoiceView.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Lines are 1-indexed in view_file output, 0-indexed here
// groupImportedLineItems: lines 89-131 (0-indexed: 88-130)
// Rate column: find it by content

// 1. Replace groupImportedLineItems (lines 89-131 = indices 88-130)
const newGroup = [
  "const groupImportedLineItems = (lines) => {\r",
  "  // Key = customName + rate + itemType only, so same component groups across all days\r",
  "  const grouped = new Map();\r",
  "\r",
  "  lines.forEach((line) => {\r",
  "    const key = [\r",
  "      line.customName || '',\r",
  "      String(line.customRate ?? ''),\r",
  "      line._itemType || '',\r",
  "    ].join('||');\r",
  "\r",
  "    const discountMode  = line.discountMode  || 'none';\r",
  "    const discountValue = Number(line.discountValue || 0);\r",
  "    const lineDays = Math.max(1, Number(line.days) || 1);\r",
  "    const lineRate = Number(line.customRate || 0);\r",
  "    const lineBase = lineRate * lineDays;\r",
  "    let discAmt = 0;\r",
  "    if (discountMode === 'total_flat') discAmt = Math.min(discountValue, lineBase);\r",
  "    if (discountMode === 'rate_flat')  discAmt = Math.min(discountValue * lineDays, lineBase);\r",
  "\r",
  "    if (!grouped.has(key)) {\r",
  "      grouped.set(key, {\r",
  "        ...line,\r",
  "        discountMode:  discAmt > 0 ? 'total_flat' : 'none',\r",
  "        discountValue: discAmt,\r",
  "        discountLabel: line.discountLabel || '',\r",
  "        days: lineDays,\r",
  "        _sourceDates: [...new Set((line._sourceDates || []).filter(Boolean))],\r",
  "      });\r",
  "      return;\r",
  "    }\r",
  "\r",
  "    const existing = grouped.get(key);\r",
  "    existing.days += lineDays;\r",
  "    existing._sourceDates = [...new Set([...(existing._sourceDates || []), ...(line._sourceDates || [])])]\r",
  "      .sort((a, b) => dateSortValue(a) - dateSortValue(b));\r",
  "    existing.discountValue = Number(existing.discountValue || 0) + discAmt;\r",
  "    if (discAmt > 0) existing.discountMode = 'total_flat';\r",
  "    if (!existing.discountLabel && line.discountLabel) existing.discountLabel = line.discountLabel;\r",
  "    if (!existing.subtitle && line.subtitle) existing.subtitle = line.subtitle;\r",
  "  });\r",
  "\r",
  "  return [...grouped.values()].map((line) => {\r",
  "    const { _sourceDates, ...rest } = line;\r",
  "    return {\r",
  "      ...rest,\r",
  "      note: buildMergedDateNote(_sourceDates),\r",
  "    };\r",
  "  });\r",
  "};\r",
];

// Replace lines 88-130 (0-indexed) = original 89-131
lines.splice(88, 43, ...newGroup);
console.log('✅ Replaced groupImportedLineItems');

// 2. Fix rate column: find the rate col section by searching
const fullContent = lines.join('\n');
// Find the inv-col-rate section in the preview table rows
// Look for the pattern with hasDisc and the strikethrough
const rateColPattern = /(\s*<td className="inv-col-rate">\s*<div style=\{\{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' \}\}>\s*)\{hasDisc \? \((\s*<div style=\{\{ whiteSpace: 'nowrap' \}\}>[\s\S]*?<\/div>\s*\)) : \(\s*<span>\{c\.rate\}<\/span>\s*\)\}(\s*\{hasDisc && <span className="inv-disc-lbl")/;

const rateColFixed = `$1{hasDisc && isRateD ? ($2) : (\n                            <span>{c.rate}</span>\n                          )}$3`;

const fixedContent = fullContent.replace(rateColPattern, rateColFixed);
if (fixedContent !== fullContent) {
  console.log('✅ Fixed rate column strikethrough');
  fs.writeFileSync(path, fixedContent);
} else {
  console.log('⚠️  Rate column regex did not match, trying line scan...');
  // Fallback: find the line with "hasDisc ? (" near "inv-col-rate" and fix it
  const linesArr = fixedContent.split('\n');
  let inRateCol = false;
  for (let i = 0; i < linesArr.length; i++) {
    if (linesArr[i].includes('inv-col-rate')) { inRateCol = true; }
    if (inRateCol && linesArr[i].includes('{hasDisc ? (')) {
      // Change to hasDisc && isRateD
      linesArr[i] = linesArr[i].replace('{hasDisc ? (', '{hasDisc && isRateD ? (');
      inRateCol = false;
      console.log('✅ Fixed rate column via line scan at line', i+1);
      break;
    }
  }
  fs.writeFileSync(path, linesArr.join('\n'));
}
