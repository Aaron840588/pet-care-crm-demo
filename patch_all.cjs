const fs = require('fs');

// ── INVOICE AUTOMATIONS ────────────────────────────────────────────────
const invPath = 'src/views/InvoiceView.jsx';
let inv = fs.readFileSync(invPath, 'utf8');

const oldPaidTip = `          {/* Paid + Tip */}
          <div className="form-row">
            <div className="fg">
              <label>Amount Paid (₱)</label>
              <NumericInput
                value={data.paid}
                min={0}
                fallbackValue="0"
                onValueChange={(raw) => setData({ ...data, paid: Number.parseInt(raw || '0', 10) || 0 })}
              />
            </div>
            <div className="fg">
              <label>🎉 Tip Received (₱)</label>
              <NumericInput
                value={data.tip}
                min={0}
                fallbackValue="0"
                placeholder="0"
                onValueChange={(raw) => setData({ ...data, tip: Number.parseInt(raw || '0', 10) || 0 })}
              />
              <div className="hint">Tips are tracked separately!</div>
            </div>
          </div>`;

const newPaidTip = `          {/* Paid + Tip */}
          <div className="form-row">
            <div className="fg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>Amount Paid (₱)</label>
                <button
                  type="button"
                  className="btn btn-xs btn-lime"
                  style={{ fontSize: '10px', padding: '3px 8px', minHeight: '28px' }}
                  onClick={() => setData(d => ({ ...d, paid: Math.round(grandTotal) }))}
                  title="Set paid amount to full balance"
                >
                  ✓ Mark Paid in Full
                </button>
              </div>
              <NumericInput
                value={data.paid}
                min={0}
                fallbackValue="0"
                onValueChange={(raw) => setData({ ...data, paid: Number.parseInt(raw || '0', 10) || 0 })}
              />
            </div>
            <div className="fg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>🎉 Tip Received (₱)</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[10, 15].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      className="btn btn-xs btn-ghost"
                      style={{ fontSize: '10px', padding: '3px 7px', minHeight: '28px' }}
                      onClick={() => setData(d => ({ ...d, tip: Math.round(grandTotal * pct / 100) }))}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>
              <NumericInput
                value={data.tip}
                min={0}
                fallbackValue="0"
                placeholder="0"
                onValueChange={(raw) => setData({ ...data, tip: Number.parseInt(raw || '0', 10) || 0 })}
              />
              <div className="hint">Tips are tracked separately!</div>
            </div>
          </div>`;

// Normalize CRLF → LF for matching, apply change, then keep original endings
const invNorm = inv.replace(/\r\n/g, '\n');
const oldNorm  = oldPaidTip.replace(/\r\n/g, '\n');
const newNorm  = newPaidTip.replace(/\r\n/g, '\n');

if (!invNorm.includes(oldNorm)) {
  console.error('❌ Could not find Paid+Tip section – check the file manually.');
  process.exit(1);
}

const invPatched = invNorm.replace(oldNorm, newNorm);
// Write back with CRLF to match project style
fs.writeFileSync(invPath, invPatched.replace(/\n/g, '\r\n'));
console.log('✅ Invoice automations added (Mark Paid in Full + Quick-Tip pills).');


// ── INVOICE MATH EXTRACTION ─────────────────────────────────────────────
const utils = require('fs');
let invFull = fs.readFileSync(invPath, 'utf8').replace(/\r\n/g, '\n');

// Extract helper functions that live above InvoiceView() into invoiceLogic.js
const mathFns = ['applyDiscountAcrossLines', 'buildDateNote', 'buildMergedDateNote', 'groupImportedLineItems', 'buildSingleDayInvoiceLines'];

// Check if invoiceLogic.js already exists
if (!fs.existsSync('src/utils/invoiceLogic.js')) {
  const marker = 'export default function InvoiceView()';
  const markerIdx = invFull.indexOf(marker);
  
  const constStart = invFull.indexOf('const applyDiscountAcrossLines');
  if (constStart === -1 || markerIdx === -1) {
    console.log('ℹ️  Invoice math already extracted or markers not found – skipping.');
  } else {
    const mathBlock = invFull.substring(constStart, markerIdx);
    const logicFile = `import { fmtShort, dateSortValue } from './dates';\nimport { calcDayDiscount, newLineItem, EXTRA_PET_RATE } from './calculations';\n\n${mathBlock}export { applyDiscountAcrossLines, buildDateNote, buildMergedDateNote, groupImportedLineItems, buildSingleDayInvoiceLines };\n`;
    
    fs.writeFileSync('src/utils/invoiceLogic.js', logicFile.replace(/\n/g, '\r\n'));
    
    // Remove from InvoiceView and add import
    invFull = invFull.substring(0, constStart) + invFull.substring(markerIdx);
    const calcImport = `import { calcDayDiscount, calcLine, DISC_MODES, newLineItem, EXTRA_PET_RATE } from '../utils/calculations';\n`;
    const logicImport = `import { applyDiscountAcrossLines, buildDateNote, buildMergedDateNote, groupImportedLineItems, buildSingleDayInvoiceLines } from '../utils/invoiceLogic';\n`;
    invFull = invFull.replace(calcImport, calcImport + logicImport);
    
    fs.writeFileSync(invPath, invFull.replace(/\n/g, '\r\n'));
    console.log('✅ Invoice math extracted to src/utils/invoiceLogic.js');
  }
} else {
  console.log('ℹ️  invoiceLogic.js already exists – skipping extraction.');
}

// ── SCHEDULE MATH EXTRACTION ────────────────────────────────────────────
const schedPath = 'src/views/ScheduleView.jsx';
let schedFull = fs.readFileSync(schedPath, 'utf8').replace(/\r\n/g, '\n');

if (!fs.existsSync('src/utils/scheduleLogic.js')) {
  const schedMarker = 'export default function ScheduleView()';
  
  const schedConstStart = schedFull.indexOf('const getServiceLabel');
  const schedMarkerIdx = schedFull.indexOf(schedMarker);

  if (schedConstStart === -1 || schedMarkerIdx === -1) {
    console.log('ℹ️  Schedule math already extracted or markers not found – skipping.');
  } else {
    const schedMath = schedFull.substring(schedConstStart, schedMarkerIdx);
    const schedLogic = `import { generateDateRange } from './dates';\n\n${schedMath}export { getServiceLabel, emptyDiscounts, makeDay, normalizeDay, getDayDiscountTotal, hasPerDayDiscounts };\n`;
    
    fs.writeFileSync('src/utils/scheduleLogic.js', schedLogic.replace(/\n/g, '\r\n'));    
    
    schedFull = schedFull.substring(0, schedConstStart) + schedFull.substring(schedMarkerIdx);
    const schedCalcImport = `import { calcDayDiscount } from '../utils/calculations';\n`;
    const schedLogicImport = `import { getServiceLabel, emptyDiscounts, makeDay, normalizeDay, getDayDiscountTotal, hasPerDayDiscounts } from '../utils/scheduleLogic';\n`;
    schedFull = schedFull.replace(schedCalcImport, schedCalcImport + schedLogicImport);
    
    fs.writeFileSync(schedPath, schedFull.replace(/\n/g, '\r\n'));
    console.log('✅ Schedule math extracted to src/utils/scheduleLogic.js');
  }
} else {
  console.log('ℹ️  scheduleLogic.js already exists – skipping extraction.');
}

console.log('\n🏁 All patches complete. Run: npm run build');
