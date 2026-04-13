const fs = require('fs');

// ── 1. Fix ScheduleView.jsx ──────────────────────────────────────────────────
{
  const path = 'src/views/ScheduleView.jsx';
  let c = fs.readFileSync(path, 'utf8');

  // Replace the single dayDiscount cell with per-component discount rows
  const oldDiscountCell = `                              <div
                                className="day-discount-cell"
                                style={{ background: Number(day.dayDiscount || 0) > 0 ? '#fff7f5' : '#fffaf9' }}
                              >
                                <div className="day-discount-title">- Discount</div>
                                <NumericInput
                                  value={day.dayDiscount || 0}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'dayDiscount', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 8px', fontSize: '13px', borderRadius: '8px', border: '1px solid #f0c0bc', textAlign: 'center', background: '#fff' }}
                                />
                                <input
                                  className="day-discount-note"
                                  type="text"
                                  value={day.dayDiscountNote || ''}
                                  onChange={e => updateDay(idx, 'dayDiscountNote', e.target.value)}
                                  placeholder="Label (e.g. Courtesy Discount)"
                                  style={{ width: '100%', padding: '5px 8px', fontSize: '11px', borderRadius: '8px', border: '1px solid #f0c0bc', fontFamily: 'var(--font-body)', background: '#fff' }}
                                />
                              </div>
                              <div className="day-total" style={{ textAlign: 'right', paddingBottom: '2px' }}>
                                <span style={{ fontWeight: 800, fontSize: '13px' }}>₱{calcDayTotal(day)}</span>
                                {calcDayDiscount(day) > 0 && (
                                  <div style={{ fontSize: '10px', color: 'var(--green)', marginTop: '2px' }}>
                                    saved ₱{calcDayDiscount(day).toFixed(0)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Special needs note */}
                            {day.specialNeeds > 0 && (
                              <input
                                type="text" value={day.specialNeedsNote}
                                onChange={e => updateDay(idx, 'specialNeedsNote', e.target.value)}
                                placeholder="Special needs note (e.g. Spay wound care)"
                                style={{ width: '100%', marginTop: '6px', padding: '5px 8px', fontSize: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'var(--font-body)' }}
                              />
                            )}`;

  const newDiscountCell = `                              <div className="day-total" style={{ textAlign: 'right', paddingBottom: '2px' }}>
                                <span style={{ fontWeight: 800, fontSize: '13px' }}>₱{calcDayTotal(day)}</span>
                                {calcDayDiscount(day) > 0 && (
                                  <div style={{ fontSize: '10px', color: 'var(--green)', marginTop: '2px' }}>
                                    saved ₱{calcDayDiscount(day).toFixed(0)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Special needs note */}
                            {day.specialNeeds > 0 && (
                              <input
                                type="text" value={day.specialNeedsNote}
                                onChange={e => updateDay(idx, 'specialNeedsNote', e.target.value)}
                                placeholder="Special needs note (e.g. Spay wound care)"
                                style={{ width: '100%', marginTop: '6px', padding: '5px 8px', fontSize: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'var(--font-body)' }}
                              />
                            )}

                            {/* ── Per-component discounts ── */}
                            {(() => {
                              const disc = day.discounts || {};
                              const rows = [
                                { type: 'service', label: 'Service', show: true },
                                { type: 'extraPets', label: \`+\${day.extraPets} Pets\`, show: Number(day.extraPets) > 0 },
                                { type: 'specialNeeds', label: 'Special Needs', show: Number(day.specialNeeds) > 0 },
                                { type: 'distance', label: 'Distance', show: Number(day.distance) > 0 },
                                { type: 'extraVisit', label: 'Extra Visit', show: Number(day.extraVisit) > 0 },
                              ].filter(r => r.show);
                              const anyDisc = rows.some(r => Number(disc[r.type]?.amount || 0) > 0);
                              return (
                                <div style={{ marginTop: '8px', borderTop: '1px solid #f0e070', paddingTop: '8px' }}>
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#bbb', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                    Discounts {anyDisc ? <span style={{ color: 'var(--green)' }}>- ₱{calcDayDiscount(day).toFixed(0)} total</span> : '(optional)'}
                                  </div>
                                  {rows.map(({ type, label }) => {
                                    const d = disc[type] || { amount: 0, label: '' };
                                    return (
                                      <div key={type} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '10px', color: '#888', width: '68px', flexShrink: 0, fontWeight: 600 }}>{label}</span>
                                        <NumericInput
                                          value={d.amount || 0}
                                          min={0}
                                          fallbackValue="0"
                                          onValueChange={(raw) => updateDayDiscount(idx, type, 'amount', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                          inputStyle={{ width: '70px', padding: '4px 6px', fontSize: '12px', borderRadius: '7px', border: \`1px solid \${Number(d.amount) > 0 ? '#f0c0bc' : '#ddd'}\`, textAlign: 'center', background: '#fff' }}
                                        />
                                        <input
                                          type="text"
                                          value={d.label || ''}
                                          onChange={e => updateDayDiscount(idx, type, 'label', e.target.value)}
                                          placeholder="reason"
                                          style={{ flex: 1, padding: '4px 7px', fontSize: '11px', borderRadius: '7px', border: \`1px solid \${Number(d.amount) > 0 ? '#f0c0bc' : '#ddd'}\`, fontFamily: 'var(--font-body)', background: '#fff' }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}`;

  if (c.includes(oldDiscountCell)) {
    c = c.replace(oldDiscountCell, newDiscountCell);
    console.log('✅ Replaced per-day discount cell with per-component rows');
  } else {
    console.log('❌ Per-day discount cell target NOT FOUND');
  }

  // Remove the "Overall Discount" section — find it and replace with nothing
  const oldOverall = /\s*\{\/\* ── OVERALL DISCOUNT \(legacy fallback\) ── \*\/\}[\s\S]*?\{\/\* Visit Time \*\/\}/;
  const match = c.match(oldOverall);
  if (match) {
    c = c.replace(match[0], '\n\n              {/* Visit Time */}');
    console.log('✅ Removed Overall Discount section');
  } else {
    console.log('⚠️  Overall Discount section not found (may already be removed)');
  }

  fs.writeFileSync(path, c);
}

// ── 2. Fix InvoiceView.jsx — apply per-component discounts in buildSingleDayInvoiceLines ──
{
  const path = 'src/views/InvoiceView.jsx';
  let c = fs.readFileSync(path, 'utf8');

  const oldFn = `const buildSingleDayInvoiceLines = (day) => {
  const note = buildDateNote([day.date]);
  const sourceDates = day.date ? [day.date] : [];
  const lines = [];
  const svcName = day.service?.split('|')[0] || '';
  const svcPrice = Number(day.service?.split('|')[1] || 0);

  lines.push({
    ...newLineItem(),
    customName: svcName,
    subtitle: '(up to 2 pets)',
    days: 1,
    note,
    customRate: String(svcPrice),
    _itemType: 'service',
  });

  if (Number(day.extraPets || 0) > 0) {
    const extraPets = Number(day.extraPets || 0);
    const epRate = extraPets * EXTRA_PET_RATE;
    lines.push({
      ...newLineItem(),
      customName: \`Additional +\${extraPets} Pet\${extraPets !== 1 ? 's' : ''}\`,
      subtitle: \`(₱\${EXTRA_PET_RATE}/add'l pet = ₱\${epRate})\`,
      days: 1,
      note,
      customRate: String(epRate),
      _itemType: 'extraPets',
    });
  }

  if (Number(day.specialNeeds || 0) > 0) {
    lines.push({
      ...newLineItem(),
      customName: 'Special Needs',
      subtitle: day.specialNeedsNote ? \`(\${day.specialNeedsNote})\` : '',
      days: 1,
      note,
      customRate: String(Number(day.specialNeeds || 0)),
      _itemType: 'specialNeeds',
    });
  }

  if (Number(day.distance || 0) > 0) {
    lines.push({
      ...newLineItem(),
      customName: 'Distance Charge',
      days: 1,
      note,
      customRate: String(Number(day.distance || 0)),
      _itemType: 'distance',
    });
  }

  if (Number(day.extraVisit || 0) > 0) {
    lines.push({
      ...newLineItem(),
      customName: 'Extra Visit',
      days: 1,
      note,
      customRate: String(Number(day.extraVisit || 0)),
      _itemType: 'extraVisit',
    });
  }

  return applyDiscountAcrossLines(lines, calcDayDiscount(day), day.dayDiscountNote).map((line) => ({
    ...line,
    note: buildMergedDateNote(sourceDates),
    _sourceDates: sourceDates,
  }));
};`;

  const newFn = `const buildSingleDayInvoiceLines = (day) => {
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
      customName: \`Additional +\${extraPets} Pet\${extraPets !== 1 ? 's' : ''}\`,
      subtitle: \`(₱\${EXTRA_PET_RATE}/add'l pet = ₱\${epRate})\`,
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
      subtitle: day.specialNeedsNote ? \`(\${day.specialNeedsNote})\` : '',
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
};`;

  if (c.includes(oldFn)) {
    c = c.replace(oldFn, newFn);
    console.log('✅ Updated buildSingleDayInvoiceLines with per-component discounts');
  } else {
    console.log('❌ buildSingleDayInvoiceLines target NOT FOUND');
  }

  fs.writeFileSync(path, c);
}

console.log('Done');
