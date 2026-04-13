const fs = require('fs');

const dateImports = `import { fmtShort, dateSortValue } from './dates';\nimport { calcDayDiscount, newLineItem, EXTRA_PET_RATE } from './calculations';\n\n`;

// 1. Invoice
let invoicePath = 'src/views/InvoiceView.jsx';
let invoice = fs.readFileSync(invoicePath, 'utf8');

const applyDiscStart = invoice.indexOf('const applyDiscountAcrossLines =');
const buildSingleEndStr = '  }));\n};\n';
let singleEnd = invoice.indexOf(buildSingleEndStr, applyDiscStart);
if (singleEnd !== -1) {
    singleEnd += buildSingleEndStr.length;
}

if (applyDiscStart > -1 && singleEnd > -1) {
    const extractedMath = invoice.substring(applyDiscStart, singleEnd);
    invoice = invoice.substring(0, applyDiscStart) + invoice.substring(singleEnd);
    
    // Add import statement to InvoiceView
    const newImports = `import { applyDiscountAcrossLines, buildDateNote, buildMergedDateNote, groupImportedLineItems, buildSingleDayInvoiceLines } from '../utils/invoiceLogic';\n`;
    
    // insert right below existing custom imports
    const importMark = `import { calcDayDiscount, calcLine, DISC_MODES, newLineItem, EXTRA_PET_RATE } from '../utils/calculations';\n`;
    
    if (invoice.includes(importMark)) {
      invoice = invoice.replace(importMark, importMark + newImports);
    } else {
       // fallback
       invoice = newImports + invoice;
    }

    fs.writeFileSync('src/utils/invoiceLogic.js', dateImports + extractedMath);
    fs.writeFileSync(invoicePath, invoice);
    console.log('Invoice math extracted to src/utils/invoiceLogic.js');
}

// 2. Schedule
let schedulePath = 'src/views/ScheduleView.jsx';
let schedule = fs.readFileSync(schedulePath, 'utf8');

const getServiceStart = schedule.indexOf('const getServiceLabel = (b) => {');
const hasPerDayEndStr = 'const hasPerDayDiscounts = (schedule = []) => getDayDiscountTotal(schedule) > 0;\n';
let hasPerDayEnd = schedule.indexOf(hasPerDayEndStr, getServiceStart);
if (hasPerDayEnd !== -1) {
    hasPerDayEnd += hasPerDayEndStr.length;
}

if (getServiceStart > -1 && hasPerDayEnd > -1) {
    const extractedScheduleMath = schedule.substring(getServiceStart, hasPerDayEnd);
    schedule = schedule.substring(0, getServiceStart) + schedule.substring(hasPerDayEnd);

    // Add import statement to ScheduleView
    const newSchedImports = `import { getServiceLabel, emptyDiscounts, makeDay, normalizeDay, getDayDiscountTotal, hasPerDayDiscounts } from '../utils/scheduleLogic';\n`;
    
    const schedImportMark = `import { calcDayDiscount } from '../utils/calculations';\n`;
    if (schedule.includes(schedImportMark)) {
      schedule = schedule.replace(schedImportMark, schedImportMark + newSchedImports);
    } else {
      schedule = newSchedImports + schedule;
    }

    fs.writeFileSync('src/utils/scheduleLogic.js', extractedScheduleMath);
    fs.writeFileSync(schedulePath, schedule);
    console.log('Schedule math extracted to src/utils/scheduleLogic.js');
}
