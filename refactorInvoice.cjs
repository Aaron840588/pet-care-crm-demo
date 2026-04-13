const fs = require('fs');

const invPath = 'src/views/InvoiceView.jsx';
let content = fs.readFileSync(invPath, 'utf8');

// 1. Remove Struck
const struckStart = content.indexOf('const Struck = ({ children, style }) => (');
if (struckStart !== -1) {
  let prevComment = content.lastIndexOf('//', struckStart);
  if (prevComment === -1) prevComment = struckStart;
  
  const struckEnd = content.indexOf(';', struckStart) + 1;
  content = content.substring(0, prevComment) + content.substring(struckEnd);
}

// 2. Replace Preview
const previewStart = content.indexOf('{/* ── RIGHT: INVOICE PREVIEW ── */}');
if (previewStart !== -1) {
  const outerDivEnd = content.indexOf('{confirmResetOpen && (', previewStart);
  
  const componentUse = `{/* ── RIGHT: INVOICE PREVIEW ── */}
        <InvoicePreviewCard 
          invoiceRef={invoiceRef}
          data={data}
          lineItems={lineItems}
          lineCalcs={lineCalcs}
          fullTotal={fullTotal}
          grandTotal={grandTotal}
          balance={balance}
        />
      </div>

      `;
  
  content = content.substring(0, previewStart) + componentUse + content.substring(outerDivEnd);
}

// 3. Add Import
if (!content.includes('InvoicePreviewCard')) {
  const importTag = "import InvoicePreviewCard from '../features/invoices/InvoicePreviewCard';\n";
  const dateImportEnd = content.indexOf("import { fmtShort", 0);
  content = content.substring(0, dateImportEnd) + importTag + content.substring(dateImportEnd);
}

fs.writeFileSync(invPath, content);
console.log('Refactored InvoiceView successfully.');
