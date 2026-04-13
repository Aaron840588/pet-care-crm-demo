const fs = require('fs');
const path = 'src/views/ScheduleView.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// ── 1. Add applyChargeToAll and applyDiscountRowToAll helpers after updateDayDiscount ──
// Find the updateDayDiscount block end (look for "  }, []);" after "updateDayDiscount")
let udIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('updateDayDiscount')) { udIdx = i; break; }
}
if (udIdx === -1) { console.log('❌ updateDayDiscount not found'); process.exit(1); }

// Find the closing }, []) of updateDayDiscount
let closeIdx = -1;
for (let i = udIdx; i < lines.length; i++) {
  if (lines[i].trim() === '}, []);') { closeIdx = i; break; }
}
if (closeIdx === -1) { console.log('❌ closing },[]) not found after updateDayDiscount'); process.exit(1); }

// Insert after closeIdx
const helpers = [
  '\r',
  '  const applyChargeToAll = useCallback((field, value) => {\r',
  '    setDaySchedule(prev => prev.map(d => ({ ...d, [field]: value })));\r',
  '  }, []);\r',
  '\r',
  '  const applyDiscountToAll = useCallback((type, field, value) => {\r',
  '    setDaySchedule(prev => prev.map(day => ({\r',
  '      ...day,\r',
  '      discounts: {\r',
  '        ...day.discounts,\r',
  '        [type]: { ...(day.discounts?.[type] || { amount: 0, label: \'\' }), [field]: value },\r',
  '      },\r',
  '    })));\r',
  '  }, []);\r',
];

lines.splice(closeIdx + 1, 0, ...helpers);
console.log('✅ Added applyChargeToAll and applyDiscountToAll at line', closeIdx + 1);

// ── 2. Find the charge grid and add "→ All" buttons ──
// Re-read after splice
let content = lines.join('\n');

// Add → All button to +Pets field
const oldPets = `                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>+Pets</label>
                                <NumericInput
                                  value={day.extraPets}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'extraPets', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>`;

const newPets = `                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>+Pets {day.extraPets > 0 && <button type="button" onClick={() => applyChargeToAll('extraPets', day.extraPets)} title="Apply to all days" style={{ fontSize: '8px', padding: '0 4px', borderRadius: '4px', border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer', marginLeft: '2px', fontFamily: 'var(--font-body)' }}>→all</button>}</label>
                                <NumericInput
                                  value={day.extraPets}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'extraPets', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>`;

if (content.includes(oldPets.replace(/\r/g, ''))) {
  content = content.replace(oldPets.replace(/\r/g, ''), newPets.replace(/\r/g, ''));
  console.log('✅ Added →all to +Pets');
} else {
  console.log('⚠️  +Pets target not found');
}

// Add → All button to Spec ₱ field
const oldSpec = `                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>Spec ₱</label>
                                <NumericInput
                                  value={day.specialNeeds}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'specialNeeds', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>`;
const newSpec = `                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>Spec ₱ {day.specialNeeds > 0 && <button type="button" onClick={() => applyChargeToAll('specialNeeds', day.specialNeeds)} title="Apply to all days" style={{ fontSize: '8px', padding: '0 4px', borderRadius: '4px', border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer', marginLeft: '2px', fontFamily: 'var(--font-body)' }}>→all</button>}</label>
                                <NumericInput
                                  value={day.specialNeeds}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'specialNeeds', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>`;
if (content.includes(oldSpec.replace(/\r/g, ''))) {
  content = content.replace(oldSpec.replace(/\r/g, ''), newSpec.replace(/\r/g, ''));
  console.log('✅ Added →all to Spec');
} else { console.log('⚠️  Spec target not found'); }

// Add → All button to Dist ₱ field
const oldDist = `                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>Dist ₱</label>
                                <NumericInput
                                  value={day.distance}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'distance', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>`;
const newDist = `                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>Dist ₱ {day.distance > 0 && <button type="button" onClick={() => applyChargeToAll('distance', day.distance)} title="Apply to all days" style={{ fontSize: '8px', padding: '0 4px', borderRadius: '4px', border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer', marginLeft: '2px', fontFamily: 'var(--font-body)' }}>→all</button>}</label>
                                <NumericInput
                                  value={day.distance}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'distance', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>`;
if (content.includes(oldDist.replace(/\r/g, ''))) {
  content = content.replace(oldDist.replace(/\r/g, ''), newDist.replace(/\r/g, ''));
  console.log('✅ Added →all to Dist');
} else { console.log('⚠️  Dist target not found'); }

// Add → All button to +Visit ₱ field
const oldVisit = `                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>+Visit ₱</label>
                                <NumericInput
                                  value={day.extraVisit}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'extraVisit', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>`;
const newVisit = `                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>+Visit ₱ {day.extraVisit > 0 && <button type="button" onClick={() => applyChargeToAll('extraVisit', day.extraVisit)} title="Apply to all days" style={{ fontSize: '8px', padding: '0 4px', borderRadius: '4px', border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer', marginLeft: '2px', fontFamily: 'var(--font-body)' }}>→all</button>}</label>
                                <NumericInput
                                  value={day.extraVisit}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'extraVisit', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>`;
if (content.includes(oldVisit.replace(/\r/g, ''))) {
  content = content.replace(oldVisit.replace(/\r/g, ''), newVisit.replace(/\r/g, ''));
  console.log('✅ Added →all to +Visit');
} else { console.log('⚠️  +Visit target not found'); }

// ── 3. Update discount rows to include → all buttons for amount and label ──
const oldDiscRow = `                                      <div key={type} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '5px' }}>
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
                                      </div>`;

const newDiscRow = `                                      <div key={type} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '5px' }}>
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
                                        {(Number(d.amount) > 0 || d.label) && (
                                          <button
                                            type="button"
                                            title="Apply this discount to all days"
                                            onClick={() => { applyDiscountToAll(type, 'amount', Number(d.amount) || 0); applyDiscountToAll(type, 'label', d.label || ''); }}
                                            style={{ fontSize: '8px', padding: '2px 5px', borderRadius: '4px', border: '1px solid #f0c0bc', background: '#fff7f5', color: '#c05050', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)', fontWeight: 700 }}
                                          >→all</button>
                                        )}
                                      </div>`;

if (content.includes(oldDiscRow.replace(/\r/g, ''))) {
  content = content.replace(oldDiscRow.replace(/\r/g, ''), newDiscRow.replace(/\r/g, ''));
  console.log('✅ Added →all to discount rows');
} else { console.log('⚠️  Discount row target not found'); }

fs.writeFileSync(path, content);
console.log('Done');
