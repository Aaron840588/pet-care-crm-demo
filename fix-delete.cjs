const fs = require('fs');
let content = fs.readFileSync('src/views/InvoiceView.jsx', 'utf8');

const target = `{lineItems.length > 1 && (
                      <button type="button" className="btn btn-xs btn-danger" onClick={() => setLineItems(p => p.filter(x => x.id !== li.id))}>
                        <Trash2 size={11} />
                      </button>
                    )}`;

const replacement = `<button type="button" className="btn btn-xs btn-danger" onClick={() => {
                        setLineItems(p => {
                          if (p.length === 1) return [newLineItem()];
                          return p.filter(x => x.id !== li.id);
                        });
                      }}>
                        <Trash2 size={11} />
                      </button>`;

content = content.replace(target, replacement);

fs.writeFileSync('src/views/InvoiceView.jsx', content);
console.log('Fixed deletion');
