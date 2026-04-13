const fs = require('fs');
let content = fs.readFileSync('src/views/InvoiceView.jsx', 'utf8');

// Inject the handleClearErrands function and hasImported check
const clearFuncStr = `
  const importedErrandCount = lineItems.filter(li => li._errandId).length;

  const handleClearErrands = useCallback(() => {
    setLineItems(p => {
      const filtered = p.filter(li => !li._errandId);
      return filtered.length > 0 ? filtered : [newLineItem()];
    });
    toast('Removed imported errands from invoice.');
  }, [toast]);
`;

content = content.replace(
  '// ── Import from booking ────────────────────────────────────────────────────',
  clearFuncStr + '\n  // ── Import from booking ────────────────────────────────────────────────────'
);

// Inject the UI button conditionally
const importBoxUI = `{/* Import Errands */}
          {(unbilledErrands.length > 0 || importedErrandCount > 0) && (
            <div style={{ background: '#f5f7fa', borderRadius: '12px', padding: '14px', marginBottom: '18px', border: '1.5px dashed #c0c8d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#444' }}>🛒 Errand Billing</div>
                <div style={{ fontSize: '12px', color: '#777' }}>This client has <strong>{unbilledErrands.length}</strong> reimbursable task(s).</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {importedErrandCount > 0 && (
                  <button className="btn btn-dark btn-sm" style={{ background: '#fca5a5', color: '#7f1d1d', border: 'none' }} onClick={handleClearErrands}>
                    Undo Import
                  </button>
                )}
                {unbilledErrands.length > 0 && (
                  <button className="btn btn-dark btn-sm" onClick={handleImportErrands}>
                    Import {unbilledErrands.length} items (₱{unbilledErrands.reduce((sum, e) => sum + e.amount, 0)})
                  </button>
                )}
              </div>
            </div>
          )}`;

content = content.replace(
  /\{\/\* Import Errands \*\/}.*?<\/button>\s*<\/div>\s*\)\}/s,
  importBoxUI
);

fs.writeFileSync('src/views/InvoiceView.jsx', content);
console.log('Undo import logic added');
