const fs = require('fs');

// ── Fix 1: groupImportedLineItems — drop discount from key so same-type lines merge ──
// ── Fix 2: invoice preview rate column — only strikethrough for rate_flat ──────────
{
  const path = 'src/views/InvoiceView.jsx';
  let c = fs.readFileSync(path, 'utf8');

  // Fix groupImportedLineItems: use name+rate as key, ignore discount+subtitle differences
  const oldGroup = `const groupImportedLineItems = (lines) => {
  const grouped = new Map();

  lines.forEach((line) => {
    const discountMode = line.discountMode || 'none';
    const discountValue = Number(line.discountValue || 0);
    const key = [
      line.customName || '',
      line.subtitle || '',
      String(line.customRate ?? ''),
      discountMode,
      discountMode === 'total_flat' ? 'merged-total-flat' : String(discountValue),
      line.discountLabel || '',
    ].join('||');

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...line,
        days: Math.max(1, Number(line.days) || 1),
        discountValue: discountMode === 'total_flat' ? discountValue : line.discountValue,
        _sourceDates: [...new Set((line._sourceDates || []).filter(Boolean))],
      });
      return;
    }

    const existing = grouped.get(key);
    existing.days += Math.max(1, Number(line.days) || 1);
    existing._sourceDates = [...new Set([...(existing._sourceDates || []), ...(line._sourceDates || [])])]
      .sort((a, b) => dateSortValue(a) - dateSortValue(b));

    if (discountMode === 'total_flat') {
      existing.discountValue = Number(existing.discountValue || 0) + discountValue;
    }
  });

  return [...grouped.values()].map((line) => {
    const { _sourceDates, ...rest } = line;
    return {
      ...rest,
      note: buildMergedDateNote(_sourceDates),
    };
  });
};`;

  const newGroup = `const groupImportedLineItems = (lines) => {
  // Key = customName + rate only (no discount/subtitle) so same component groups across all days
  const grouped = new Map();

  lines.forEach((line) => {
    const key = [
      line.customName || '',
      String(line.customRate ?? ''),
      line._itemType || '',
    ].join('||');

    const discountMode  = line.discountMode  || 'none';
    const discountValue = Number(line.discountValue || 0);
    // Convert to total_flat equivalent for accumulation
    const lineDays = Math.max(1, Number(line.days) || 1);
    const lineRate = Number(line.customRate || 0);
    const lineBase = lineRate * lineDays;
    let discAmt = 0;
    if (discountMode === 'total_flat') discAmt = Math.min(discountValue, lineBase);
    if (discountMode === 'rate_flat')  discAmt = Math.min(discountValue * lineDays, lineBase);

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
    // Accumulate discounts
    existing.discountValue = Number(existing.discountValue || 0) + discAmt;
    if (discAmt > 0) existing.discountMode = 'total_flat';
    // Keep first non-empty discount label
    if (!existing.discountLabel && line.discountLabel) existing.discountLabel = line.discountLabel;
    // Keep first non-empty subtitle
    if (!existing.subtitle && line.subtitle) existing.subtitle = line.subtitle;
  });

  return [...grouped.values()].map((line) => {
    const { _sourceDates, ...rest } = line;
    return {
      ...rest,
      note: buildMergedDateNote(_sourceDates),
    };
  });
};`;

  if (c.includes(oldGroup)) {
    c = c.replace(oldGroup, newGroup);
    console.log('✅ Fixed groupImportedLineItems');
  } else {
    console.log('❌ groupImportedLineItems not found');
  }

  // Fix rate column: only show strikethrough when it's a RATE discount (rate_flat)
  // For total_flat, rate doesn't change so no strikethrough on rate col
  const oldRateCol = `                      <td className="inv-col-rate">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {hasDisc ? (
                            <div style={{ whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#bbb', textDecoration: 'line-through', textDecorationThickness: '1.5px', marginRight: '4px', fontSize: '11px' }}>
                                {c.rate}
                              </span>
                              <span>{c.displayRate.toFixed(0)}</span>
                            </div>
                          ) : (
                            <span>{c.rate}</span>
                          )}
                          {hasDisc && <span className="inv-disc-lbl" style={{ margin: '2px 0 0 0' }}>{discLabel}</span>}
                        </div>
                      </td>`;

  const newRateCol = `                      <td className="inv-col-rate">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          {hasDisc && isRateD ? (
                            <div style={{ whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#bbb', textDecoration: 'line-through', textDecorationThickness: '1.5px', marginRight: '4px', fontSize: '11px' }}>
                                {c.rate}
                              </span>
                              <span>{c.displayRate.toFixed(0)}</span>
                            </div>
                          ) : (
                            <span>{c.rate}</span>
                          )}
                          {hasDisc && <span className="inv-disc-lbl" style={{ margin: '2px 0 0 0' }}>{discLabel}</span>}
                        </div>
                      </td>`;

  if (c.includes(oldRateCol)) {
    c = c.replace(oldRateCol, newRateCol);
    console.log('✅ Fixed rate column strikethrough (total_flat no longer shows rate strikethrough)');
  } else {
    console.log('❌ Rate column target not found');
  }

  // Also fix the special needs subtitle — move specialNeedsNote from subtitle to its own svc-sub span
  // It's already in subtitle from buildSingleDayInvoiceLines, but the grouping now preserves first subtitle
  // So no change needed there for now — grouping fix above handles it.

  fs.writeFileSync(path, c);
}

console.log('Done');
