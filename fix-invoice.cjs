const fs = require('fs');
let content = fs.readFileSync('src/views/InvoiceView.jsx', 'utf8');

// 1. Add errands to useData
content = content.replace(
  'const { clients, bookings, addInvoice } = useData();',
  'const { clients, bookings, addInvoice, errands = [], updateErrand } = useData();'
);

// 2. Add unbilled logic & importErrands function
const logicInjection = `
  const unbilledErrands = useMemo(() => {
    if (!data.clientId) return [];
    return errands.filter(e => e.clientId === data.clientId && e.status === 'done' && e.amount > 0 && !e.isBilled);
  }, [data.clientId, errands]);

  const handleImportErrands = useCallback(() => {
    if (unbilledErrands.length === 0) return;
    const newLines = unbilledErrands.map(e => ({
      ...newLineItem(),
      customName: 'Errand: ' + e.title,
      customRate: String(e.amount),
      days: 1,
      _errandId: e.id
    }));
    setLineItems(p => {
      // If the only line is empty, replace it
      if (p.length === 1 && !p[0].customName && !p[0].customRate) return newLines;
      return [...p, ...newLines];
    });
    toast('Added ' + unbilledErrands.length + ' errands to invoice line items.');
  }, [unbilledErrands, toast]);
`;

content = content.replace(
  '// ── Import from booking ────────────────────────────────────────────────────',
  logicInjection + '\n  // ── Import from booking ────────────────────────────────────────────────────'
);

// 3. Add UI Button under Booking Autocomplete
const uiInjection = `
          {/* Import Errands */}
          {unbilledErrands.length > 0 && (
            <div style={{ background: '#f5f7fa', borderRadius: '12px', padding: '14px', marginBottom: '18px', border: '1.5px dashed #c0c8d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#444' }}>🛒 Unbilled Errands Detected</div>
                <div style={{ fontSize: '12px', color: '#777' }}>This client has <strong>{unbilledErrands.length}</strong> reimbursable task(s).</div>
              </div>
              <button className="btn btn-dark btn-sm" onClick={handleImportErrands}>
                Import (₱{unbilledErrands.reduce((sum, e) => sum + e.amount, 0)})
              </button>
            </div>
          )}
          
          {/* Client + GCash */}`;

content = content.replace(
  '{/* Client + GCash */}',
  uiInjection
);

// 4. Update the handleSave to loop over lineItems
const saveInjection = `
        lineItems:       lineItems.map((item) => ({ ...item })),
      });
      
      // Sync Billed Errands
      for (const item of lineItems) {
        if (item._errandId) {
          try {
            await updateErrand(item._errandId, { isBilled: true });
          } catch (e) {
            console.error("Failed to mark errand as billed", e);
          }
        }
      }

      toast('✅ Invoice saved to records!');`;

content = content.replace(
  /lineItems:\s*lineItems\.map\(\(item\) => \(\{ \.\.\.item \}\)\),\s*\}\);\s*toast\('✅ Invoice saved to records!'\);/s,
  saveInjection
);

fs.writeFileSync('src/views/InvoiceView.jsx', content);
console.log('InvoiceView.jsx updated.');

// 5. Update ErrandsView to show Billed status and Un-Bill option.
let evContent = fs.readFileSync('src/views/ErrandsView.jsx', 'utf8');

const statusInjection = `
                    <div style={{ 
                      fontWeight: 700, fontSize: '16px',
                      textDecoration: errand.status === 'done' ? 'line-through' : 'none', 
                      color: errand.status === 'done' ? '#aaa' : '#222' 
                    }}>
                      {errand.title} {errand.isBilled && <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '8px', verticalAlign: 'middle', marginLeft: '6px', textDecoration: 'none', display: 'inline-block' }}>🧾 Billed</span>}
                    </div>`;

evContent = evContent.replace(
  /<div style={{\s*fontWeight: 700, fontSize: '16px',\s*textDecoration: errand\.status === 'done' \? 'line-through' : 'none',\s*color: errand\.status === 'done' \? '#aaa' : '#222'\s*}}>\s*\{errand\.title\}\s*<\/div>/g,
  statusInjection
);

const unbillInjection = `
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button 
                      onClick={() => { if(window.confirm('Delete this errand forever?')) deleteErrand(errand.id) }} 
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: '6px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                    {errand.isBilled && (
                       <button
                         onClick={() => { if(window.confirm('Un-bill this errand so it can be added to an invoice again?')) updateErrand(errand.id, { isBilled: false }) }}
                         style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '4px', fontSize: '10px', padding: '2px 4px', cursor: 'pointer', color: '#666' }}
                       >
                         Un-bill
                       </button>
                    )}
                  </div>`;

evContent = evContent.replace(
  /<button\s*onClick={\(\) => { if\(window\.confirm\('Delete this errand forever\?'\)\) deleteErrand\(errand\.id\) }}\s*title="Delete"\s*style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: '6px' }}\s*>\s*<Trash2 size={20} \/>\s*<\/button>/g,
  unbillInjection
);

fs.writeFileSync('src/views/ErrandsView.jsx', evContent);
console.log('ErrandsView.jsx updated.');

// Complete tasks
let taskContent = fs.readFileSync('C:\\Users\\aaron\\.gemini\\antigravity\\brain\\478c2eab-053c-4012-8e2a-057017d4ed94\\task.md', 'utf8');
taskContent = taskContent.replace(/\[ \]/g, '[x]');
fs.writeFileSync('C:\\Users\\aaron\\.gemini\\antigravity\\brain\\478c2eab-053c-4012-8e2a-057017d4ed94\\task.md', taskContent);
