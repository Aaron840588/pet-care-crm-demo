const fs = require('fs');

const fix = (path, replacements) => {
  let src = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  let changed = false;
  for (const [from, to] of replacements) {
    if (src.includes(from)) {
      src = src.replace(from, to);
      changed = true;
    } else {
      console.warn(`  ⚠ Pattern not found in ${path}:\n    "${from.substring(0,80)}"`);
    }
  }
  if (changed) {
    fs.writeFileSync(path, src.replace(/\n/g, '\r\n'));
    console.log(`✅ Fixed: ${path}`);
  }
};

// ── 1. ViewBookingModal: remove unused imports + unused vars ──────────────────
fix('src/features/schedule/ViewBookingModal.jsx', [
  [
    `import { fmtDate, dateSortValue, fmtDayLabel } from '../../utils/dates';`,
    `import { fmtDate, fmtDayLabel } from '../../utils/dates';`,
  ],
  [
    `import { calcDayDiscount, calcDayTotal } from '../../utils/calculations';`,
    `import { calcDayDiscount } from '../../utils/calculations';`,
  ],
  // getStatusBadge is defined but never called — remove it
  [
    `const getStatusBadge = (status) => {
  if (status === 'active') return <span className="badge b-active">Active (Ongoing)</span>;
  if (status === 'done')   return <span className="badge b-done">Done</span>;
  return <span className="badge b-pending">Upcoming</span>;
};`,
    ``,
  ],
  // getServiceLabel defined but not used — remove it
  [
    `const getServiceLabel = (b) => {
  if (b.daySchedule?.length > 0) {
    const svcs = [...new Set(b.daySchedule.map(d => d.service?.split('|')[0]).filter(Boolean))];
    return svcs.length === 1 ? svcs[0] : 'Multiple services';
  }
  return b.service?.split('|')[0] || '—';
};`,
    ``,
  ],
]);

// ── 2. invoiceLogic.js: remove unused lineBase assignment ─────────────────────
fix('src/utils/invoiceLogic.js', [
  [
    `    const lineDays = Math.max(1, Number(line.days) || 1);
    const lineRate = Number(line.customRate || 0);
    const lineBase = lineRate * lineDays;
    let discAmt = discountPerDay * lineDays;`,
    `    const lineDays = Math.max(1, Number(line.days) || 1);
    const lineRate = Number(line.customRate || 0);
    let discAmt = discountPerDay * lineDays;`,
  ],
]);

// ── 3. DashboardView: remove unused todayStr ──────────────────────────────────
fix('src/views/DashboardView.jsx', [
  [
    `  const todayStr  = todayLocalStr();\n`,
    ``,
  ],
]);

// ── 4. ErrandsView: remove unused fmtShort import ────────────────────────────
fix('src/views/ErrandsView.jsx', [
  [
    `import { fmtShort, `,
    `import { `,
  ],
  // fallback if it's the only import
  [
    `import { fmtShort } from '../utils/dates';\n`,
    ``,
  ],
]);

// ── 5. InvoiceView: remove unused imports + isRateD var + fix useCallback dep ──
fix('src/views/InvoiceView.jsx', [
  [
    `import { applyDiscountAcrossLines, buildDateNote, buildMergedDateNote, groupImportedLineItems, buildSingleDayInvoiceLines } from '../utils/invoiceLogic';`,
    `import { buildDateNote, groupImportedLineItems, buildSingleDayInvoiceLines } from '../utils/invoiceLogic';`,
  ],
  [
    `import { fmtShort, fmtGcash, todayLocalStr, dateSortValue } from '../utils/dates';`,
    `import { fmtGcash, todayLocalStr, dateSortValue } from '../utils/dates';`,
  ],
  // Remove unused isRateD in invoice builder form
  [
    `              const hasDisc  = c.discountAmount > 0;\n              const isRateD  = li.discountMode.startsWith('rate');\n`,
    `              const hasDisc  = c.discountAmount > 0;\n`,
  ],
  // Fix missing updateErrand in useCallback dep
  [
    `  }, [handleImportBooking, data.clientId, bookings]);`,
    `  }, [handleImportBooking, data.clientId, bookings, updateErrand]);`,
  ],
]);

// ── 6. ScheduleView: remove unused emptyDiscounts import + setDiscount ────────
fix('src/views/ScheduleView.jsx', [
  [
    `import { getServiceLabel, emptyDiscounts, makeDay, normalizeDay, getDayDiscountTotal, hasPerDayDiscounts } from '../utils/scheduleLogic';`,
    `import { getServiceLabel, makeDay, normalizeDay, getDayDiscountTotal, hasPerDayDiscounts } from '../utils/scheduleLogic';`,
  ],
  [
    `  const setDiscount = useCallback((patch) => setFormData(f => ({ ...f, discount: { ...f.discount, ...patch } })), []);\n\n`,
    `\n`,
  ],
]);

// ── 7. ReportCardView: fix duplicate alignItems key ───────────────────────────
fix('src/views/ReportCardView.jsx', [
  [
    `cursor: 'pointer',\n                border: checkedTasks[t.id] ? '2px solid var(--lime-dark)' : '1.5px solid #eee',\n                background: checkedTasks[t.id] ? (t.isMed ? '#f0eeff' : '#f0fce8') : '#fafafa',\n                fontWeight: 600, fontSize: '12px', transition: 'all .15s', flexDirection: 'column', alignItems: 'flex-start',`,
    `cursor: 'pointer',\n                border: checkedTasks[t.id] ? '2px solid var(--lime-dark)' : '1.5px solid #eee',\n                background: checkedTasks[t.id] ? (t.isMed ? '#f0eeff' : '#f0fce8') : '#fafafa',\n                fontWeight: 600, fontSize: '12px', transition: 'all .15s', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left',`,
  ],
  // Remove the first alignItems: 'center' from the outer style (it's overridden by flexDirection: column + alignItems: flex-start anyway)
  [
    `display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',`,
    `display: 'flex', gap: '6px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',`,
  ],
]);

// ── 8. DataContext: fix empty catch block + unused err var ────────────────────
fix('src/store/DataContext.jsx', [
  [
    `} catch (err) {`,
    `} catch {`,
  ],
  [
    `} catch(err) {`,
    `} catch {`,
  ],
  // fix empty block - add a comment so it's intentional
  [
    `} catch {\n        }`,
    `} catch { /* silent: network offline or listener teardown */ }`,
  ],
  [
    `  } catch {\n    }`,
    `  } catch { /* silent */ }`,
  ],
]);

console.log('\n🏁 All lint fixes applied. Run: npm run build');
