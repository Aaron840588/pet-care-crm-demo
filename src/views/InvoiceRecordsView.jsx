import React, { useMemo, useState } from 'react';
import { useData } from '../store/DataContext';
import ConfirmDialog from '../components/ConfirmDialog';
import NumericInput from '../components/NumericInput';
import { useToast } from '../components/Toast';
import { CheckCircle, CircleDollarSign, Pencil, X, Check } from 'lucide-react';
import { dateSortValue, fmtDate, getDateParts } from '../utils/dates';
import { calcLine } from '../utils/calculations';

// ⭐ Struck: renders a strikethrough that html-to-image can capture
const Struck = ({ children, style }) => (
  <span style={{ position: 'relative', display: 'inline-block', color: '#888', fontSize: '10px', ...style }}>
    {children}
    <span style={{
      position: 'absolute', left: '0px', right: '0px', top: '50%',
      height: '1.5px', background: '#888', display: 'block',
      transform: 'translateY(-50%)',
    }} />
  </span>
);

const toMoneyValue = (value) => Math.max(0, Number.parseInt(String(value ?? '0'), 10) || 0);

export default function InvoiceRecordsView() {
  const { invoices, removeInvoice, updateInvoice } = useData();
  const toast = useToast();

  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState({
    toName: '',
    pets: '',
    baseServiceName: '',
    total: '0',
    paid: '0',
    tip: '0',
    dateSaved: '',
  });
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  const startEdit = (invoice) => {
    setEditingInvoice(invoice);
    setEditForm({
      toName: invoice.toName || '',
      pets: invoice.pets || '',
      baseServiceName: invoice.baseServiceName || '',
      total: String(Math.round(Number(invoice.total || 0))),
      paid: String(Math.round(Number(invoice.paid || 0))),
      tip: String(Math.round(Number(invoice.tip || 0))),
      dateSaved: invoice.dateSaved || '',
    });
  };

  const cancelEdit = () => setEditingInvoice(null);

  const setEdit = (patch) => setEditForm((current) => ({ ...current, ...patch }));

  const editTotal = toMoneyValue(editForm.total);
  const editPaid = Math.min(editTotal, toMoneyValue(editForm.paid));
  const editTip = toMoneyValue(editForm.tip);
  const editBalance = Math.max(0, editTotal - editPaid);

  const saveEdit = async () => {
    if (!editingInvoice) return;

    try {
      await updateInvoice(editingInvoice.id, {
        toName: editForm.toName.trim() || editingInvoice.toName || 'Client',
        pets: editForm.pets.trim(),
        baseServiceName: editForm.baseServiceName.trim(),
        total: editTotal,
        paid: editPaid,
        tip: editTip,
        dateSaved: editForm.dateSaved || new Date().toISOString().split('T')[0],
      });
      toast(`Updated invoice record for ${editForm.toName.trim() || editingInvoice.toName}.`, 'success');
      setEditingInvoice(null);
    } catch (error) {
      console.error(error);
      toast('Unable to update this invoice right now.', 'error');
    }
  };

  const getInvoiceSortValue = (invoice) => {
    if (invoice.dateSaved) return dateSortValue(invoice.dateSaved);
    if (typeof invoice.createdAt?.toMillis === 'function') return invoice.createdAt.toMillis();
    return 0;
  };

  const sortedInvoices = useMemo(() =>
    [...invoices].sort((a, b) => {
      const diff = getInvoiceSortValue(b) - getInvoiceSortValue(a);
      if (diff !== 0) return diff;
      return String(b.id || '').localeCompare(String(a.id || ''));
    }),
  [invoices]);

  const groupedInvoices = useMemo(() => {
    const groups = [];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    sortedInvoices.forEach(inv => {
      let label = 'Unknown Date';
      if (inv.dateSaved) {
        const parts = getDateParts(inv.dateSaved);
        if (parts) label = `${MONTHS[parts.m - 1]} ${parts.y}`;
      }
      let group = groups.find(g => g.label === label);
      if (!group) {
        group = { label, invoices: [] };
        groups.push(group);
      }
      group.invoices.push(inv);
    });
    return groups;
  }, [sortedInvoices]);

  const handleDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      await removeInvoice(invoiceToDelete.id);
      toast(`Deleted invoice for ${invoiceToDelete.toName}.`, 'info');
    } catch (error) {
      console.error(error);
      toast('Unable to delete this invoice right now.', 'error');
    } finally {
      setInvoiceToDelete(null);
    }
  };

  return (
    <>
      <div className="ph">
        <div>
          <h2>Invoice Records</h2>
          <p>Edit the saved invoice record details here without rebuilding the invoice from scratch.</p>
        </div>
      </div>

      <div className="inv-records-mobile" style={{ display: 'none' }}>
        {groupedInvoices.map((group) => (
          <React.Fragment key={group.label}>
            <div style={{ padding: '4px 8px', margin: '14px 0 8px', fontWeight: 800, fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid #eee' }}>
              {group.label}
            </div>
            {group.invoices.map((invoice) => {
            const balance = Math.max(0, Number(invoice.total || 0) - Number(invoice.paid || 0));
            const isPaid = balance <= 0;

            return (
              <div key={invoice.id} className="card" style={{ margin: '0 0 12px', borderLeft: `4px solid ${isPaid ? 'var(--green)' : 'var(--orange)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>{invoice.toName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray)' }}>{invoice.pets}</div>
                  </div>
                  {isPaid ? (
                    <span style={{ background: '#e6f7ed', color: 'var(--green)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <CheckCircle size={12} /> PAID
                    </span>
                  ) : (
                    <span style={{ background: '#fff4e0', color: 'var(--orange)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      UNPAID
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '10px', lineHeight: 1.5 }}>
                  {invoice.baseServiceName} • {invoice.dateSaved ? fmtDate(invoice.dateSaved) : 'No save date'}
                </div>

                <div className="invoice-record-summary" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '60px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '2px' }}>TOTAL</div>
                    <div style={{ fontWeight: 700 }}>PHP {invoice.total}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '60px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '2px' }}>PAID</div>
                    <div style={{ fontWeight: 700, color: 'var(--green)' }}>PHP {invoice.paid}</div>
                  </div>
                  {Number(invoice.tip || 0) > 0 && (
                    <div style={{ flex: 1, minWidth: '60px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '2px' }}>TIP 💝</div>
                      <div style={{ fontWeight: 700, color: '#b8860b' }}>PHP {invoice.tip}</div>
                    </div>
                  )}
                  <div style={{ flex: `1.5`, minWidth: '70px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', marginBottom: '2px' }}>BALANCE</div>
                    <div style={{ fontWeight: 800, color: isPaid ? 'var(--green)' : 'var(--red)' }}>PHP {balance}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-xs btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => startEdit(invoice)}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button type="button" className="btn btn-xs btn-danger" onClick={() => setInvoiceToDelete(invoice)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          </React.Fragment>
        ))}

        {sortedInvoices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '14px', color: 'var(--gray)' }}>
            <CircleDollarSign size={40} style={{ margin: '0 auto 16px', color: 'var(--lime-dark)' }} />
            <p>No saved invoices yet. Go to Invoice Builder and save one first.</p>
          </div>
        )}
      </div>

      <div className="inv-records-desktop">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date Saved</th>
                  <th>Invoice To</th>
                  <th>Pets</th>
                  <th>Service</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Tip 💝</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedInvoices.length === 0 ? (
                  <tr className="empty-row"><td colSpan="10">No invoices saved yet. Go to Invoice Builder to save one.</td></tr>
                ) : groupedInvoices.map((group) => (
                  <React.Fragment key={group.label}>
                    <tr style={{ background: '#f8f8f8' }}>
                      <td colSpan="10" style={{ padding: '8px 12px', fontWeight: 800, fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', borderTop: '2px solid #eaeaea', borderBottom: '1px solid #eaeaea' }}>
                        {group.label}
                      </td>
                    </tr>
                    {group.invoices.map((invoice) => {
                      const balance = Math.max(0, Number(invoice.total || 0) - Number(invoice.paid || 0));
                      const isPaid = balance <= 0;

                      return (
                        <tr key={invoice.id} style={{ background: isPaid ? '#fffffe' : '#fff9f0' }}>
                          <td style={{ fontSize: '12px', color: 'var(--gray)' }}>{invoice.dateSaved ? fmtDate(invoice.dateSaved) : 'No save date'}</td>
                          <td style={{ fontWeight: 'bold' }}>{invoice.toName}</td>
                          <td style={{ fontSize: '12px', color: 'var(--gray)', maxWidth: '140px' }}>{invoice.pets}</td>
                          <td style={{ fontSize: '12px', maxWidth: '280px', lineHeight: 1.45 }}>{invoice.baseServiceName}</td>
                          <td style={{ fontWeight: 700 }}>PHP {invoice.total}</td>
                          <td><span style={{ fontWeight: 600, color: invoice.paid > 0 ? 'var(--green)' : '#999' }}>PHP {invoice.paid}</span></td>
                          <td>
                            {Number(invoice.tip || 0) > 0 
                              ? <span style={{ fontWeight: 700, color: '#b8860b' }}>PHP {invoice.tip}</span>
                              : <span style={{ color: '#ddd' }}>—</span>}
                          </td>
                          <td style={{ fontWeight: 800, color: isPaid ? 'var(--green)' : 'var(--red)' }}>PHP {balance}</td>
                          <td>
                            {isPaid
                              ? <span className="badge b-active" style={{ display: 'inline-flex', gap: '4px' }}><CheckCircle size={11} /> Paid</span>
                              : <span className="badge b-pending">Unpaid</span>
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <button type="button" className="btn btn-xs btn-ghost" onClick={() => startEdit(invoice)} title="Edit invoice record">
                                <Pencil size={12} /> Edit
                              </button>
                              <button type="button" className="btn btn-xs btn-danger" onClick={() => setInvoiceToDelete(invoice)}>Del</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .inv-records-mobile { display: block !important; }
          .inv-records-desktop { display: none; }
        }
      `}</style>

      {editingInvoice && (
        <div className="overlay open" onClick={cancelEdit}>
          <div className="modal" style={{ maxWidth: '600px', borderRadius: '20px', maxHeight: '90dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-title" style={{ margin: 0, padding: '24px 24px 12px', flexShrink: 0, borderBottom: '1px solid #f0f0f0' }}>
              Edit Invoice Record
            </div>

            <div className="modal-content-scroller" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* ── Full Invoice Preview (if lineItems were saved) ── */}
              {editingInvoice.lineItems?.length > 0 && (
                <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: '12px', padding: '14px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>Invoice Preview</div>
                  <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f3' }}>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1.5px solid #ddd' }}>Service</td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1.5px solid #ddd', textAlign: 'center' }}>Days</td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1.5px solid #ddd', textAlign: 'right' }}>Rate</td>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1.5px solid #ddd', textAlign: 'right' }}>Amount</td>
                    </tr>
                  </thead>
                  <tbody>
                    {editingInvoice.lineItems.map((li, i) => {
                      const c = calcLine(li);
                      const hasDisc = c.discountAmount > 0;
                      const isErrand = li.isErrand || String(li.customName || '').toLowerCase().includes('errand');
                      const autoDiscLabel = (() => {
                        if (!hasDisc) return '';
                        const val = li.discountValue || 0;
                        const mode = li.discountMode || '';
                        if (mode === 'total_flat')    return `₱${c.discountAmount.toFixed(0)} Off`;
                        if (mode === 'total_percent') return `${val}% Off`;
                        if (mode === 'rate_flat')     return `₱${val}/day Off`;
                        if (mode === 'rate_percent')  return `${val}% Rate Off`;
                        return 'Discount';
                      })();
                      const discLabel = li.discountLabel?.trim() || autoDiscLabel;
                      return (
                        <React.Fragment key={li.id || i}>
                          <tr style={{ borderBottom: '1px solid #f2f2f0', background: isErrand ? '#F5F882' : 'transparent' }}>
                            <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 600, color: '#111' }}>{li.customName || '—'}</div>
                              {li.subtitle && <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>{li.subtitle}</div>}
                              {li.note && <div style={{ fontSize: '9.5px', color: '#bbb', marginTop: '2px' }}>{li.note}</div>}
                              {/* Render sub-items inline inside the td */}
                              {isErrand && li.items && li.items.length > 0 && li.items.map((sub, j) => (
                                <React.Fragment key={j}>
                                  <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>• {sub.title}</div>
                                  {sub.note && <div style={{ fontSize: '9.5px', color: '#bbb', marginTop: '2px', paddingLeft: '10px' }}>{sub.note}</div>}
                                </React.Fragment>
                              ))}
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700 }}>{!isErrand && li.days}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              {!isErrand && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                  {hasDisc && Number.isInteger(c.displayRate) ? (
                                    <div style={{ whiteSpace: 'nowrap' }}>
                                      <Struck style={{ marginRight: '4px' }}>{c.rate}</Struck>
                                      <span>{c.displayRate.toFixed(0)}</span>
                                    </div>
                                  ) : (
                                    <span>{c.rate}</span>
                                  )}
                                  {hasDisc && <span style={{ fontSize: '9px', color: '#d06060', fontStyle: 'italic', fontWeight: 600, marginTop: '3px', display: 'block' }}>{discLabel}</span>}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 700 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                {hasDisc && !isErrand ? (
                                  <div style={{ whiteSpace: 'nowrap' }}>
                                    <Struck style={{ marginRight: '4px' }}>{c.baseAmount}</Struck>
                                    <span>{c.finalAmount.toFixed(0)}</span>
                                  </div>
                                ) : (
                                  <span>{c.finalAmount.toFixed(0)}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
                <div style={{ textAlign: 'right', marginTop: '10px', paddingTop: '8px', borderTop: '1.5px solid #ddd' }}>
                  {(() => {
                    const fullTotal = editingInvoice.lineItems.reduce((s, li) => {
                      const c = calcLine(li);
                      return s + c.baseAmount;
                    }, 0);
                    const grandTotal = Number(editingInvoice.total || 0);
                    return (
                      <span style={{ fontSize: '14px', fontWeight: 800 }}>
                        {fullTotal > grandTotal && (
                          <Struck style={{ marginRight: '8px', fontSize: '12px', fontWeight: 700 }}>₱{fullTotal.toFixed(0)}</Struck>
                        )}
                        Total: ₱{grandTotal.toFixed(0)}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}

            <p style={{ color: 'var(--gray)', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
              Update the saved record fields below.
            </p>

            <div className="form-row">
              <div className="fg" style={{ flex: 2 }}>
                <label>Invoice To</label>
                <input
                  type="text"
                  value={editForm.toName}
                  onChange={(event) => setEdit({ toName: event.target.value })}
                />
              </div>
              <div className="fg" style={{ flex: 1.5 }}>
                <label>Date Invoiced</label>
                <input
                  type="date"
                  value={editForm.dateSaved}
                  onChange={(event) => setEdit({ dateSaved: event.target.value })}
                />
              </div>
            </div>

            <div className="fg">
              <label>Pets</label>
              <input
                type="text"
                value={editForm.pets}
                onChange={(event) => setEdit({ pets: event.target.value })}
              />
            </div>

            <div className="fg">
              <label>Service Summary</label>
              <textarea
                value={editForm.baseServiceName}
                onChange={(event) => setEdit({ baseServiceName: event.target.value })}
                style={{ minHeight: '86px' }}
              />
            </div>

            <div className="form-row">
              <div className="fg">
                <label>Total (PHP)</label>
                <NumericInput
                  value={editForm.total}
                  min={0}
                  fallbackValue="0"
                  onValueChange={(raw) => setEdit({ total: raw })}
                />
              </div>
              <div className="fg">
                <label>Paid (PHP)</label>
                <NumericInput
                  value={editForm.paid}
                  min={0}
                  fallbackValue="0"
                  onValueChange={(raw) => setEdit({ paid: raw })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="fg">
                <label>Tip (PHP)</label>
                <NumericInput
                  value={editForm.tip}
                  min={0}
                  fallbackValue="0"
                  onValueChange={(raw) => setEdit({ tip: raw })}
                />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Balance</label>
                <div style={{ width: '100%', padding: '11px 13px', borderRadius: '10px', border: '1.5px solid #ddd', background: '#fafafa', fontWeight: 800, fontSize: '16px', color: editBalance > 0 ? 'var(--red)' : 'var(--green)' }}>
                  PHP {editBalance}
                </div>
              </div>
            </div>

            </div>

            <div className="modal-actions modal-action-footer" style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid #eee', marginTop: 0 }}>
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                <X size={14} /> Cancel
              </button>
              <button type="button" className="btn btn-lime" onClick={saveEdit}>
                <Check size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceToDelete && (
        <ConfirmDialog
          title="Delete Invoice Record?"
          description={`This removes the saved invoice for ${invoiceToDelete.toName}.`}
          confirmLabel="Delete Record"
          onConfirm={handleDelete}
          onCancel={() => setInvoiceToDelete(null)}
        />
      )}
    </>
  );
}
