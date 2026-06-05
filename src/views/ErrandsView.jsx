import React, { useState } from 'react';
import { useData } from '../store/DataContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { CheckCircle2, Circle, Plus, Trash2, CheckSquare, Edit, X } from 'lucide-react';
import NumericInput from '../components/NumericInput';

export default function ErrandsView() {
  const { errands, clients, addErrand, updateErrand, deleteErrand } = useData();
  const [activeTab, setActiveTab] = useState('pending');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errandToDelete, setErrandToDelete] = useState(null);
  
  const [form, setForm] = useState(() => ({
    title: '',
    clientId: '',
    items: [{ id: Math.random().toString(36).substr(2, 9), title: '', note: '', amount: '' }]
  }));

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      title: '',
      clientId: '',
      items: [{ id: generateId(), title: '', note: '', amount: '' }]
    });
    setFormOpen(true);
  };

  const openEdit = (errand) => {
    setEditingId(errand.id);
    let newItems = errand.items || [];
    // Migrate legacy errands that only had 'amount' and no items
    if (newItems.length === 0 && errand.amount) {
      newItems = [{ id: generateId(), title: errand.title || 'Item', note: 'Migrated item', amount: errand.amount }];
    }
    // Ensure at least one empty item exists if blank
    if (newItems.length === 0) {
      newItems = [{ id: generateId(), title: '', note: '', amount: '' }];
    }

    setForm({
      title: errand.title || '',
      clientId: errand.clientId || '',
      items: newItems
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() && form.items.every(i => !i.title.trim())) return; // Must have some title
    
    // Clean up empty lines
    const validItems = form.items.filter(i => i.title.trim() || Number(i.amount) > 0).map(i => ({
      title: i.title.trim() || 'Untitled Item',
      note: i.note.trim() || '',
      amount: i.amount ? Number(i.amount) : 0
    }));

    // Auto-calculate exact total amount
    const totalAmount = validItems.reduce((sum, item) => sum + item.amount, 0);

    const payload = {
      title: form.title.trim() || 'Various Errands',
      clientId: form.clientId || null,
      amount: totalAmount, // Master amount is now dynamically updated
      items: validItems,
    };

    if (editingId) {
      updateErrand(editingId, payload);
    } else {
      addErrand({
        ...payload,
        status: 'pending'
      });
    }

    setFormOpen(false);
  };

  const confirmDeleteErrand = async () => {
    if (!errandToDelete) return;
    await deleteErrand(errandToDelete.id);
    setErrandToDelete(null);
  };

  const updateItem = (id, field, val) => {
    setForm(f => ({
      ...f,
      items: f.items.map(it => it.id === id ? { ...it, [field]: val } : it)
    }));
  };

  const removeItem = (id) => {
    setForm(f => ({
      ...f,
      items: f.items.filter(it => it.id !== id)
    }));
  };

  const getErrandTime = (e) => {
    if (e?.createdAt?.toMillis) return e.createdAt.toMillis();
    return 0;
  };

  const addItemRow = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { id: generateId(), title: '', note: '', amount: '' }]
    }));
  };

  const pending = errands.filter(e => e.status !== 'done').sort((a, b) => getErrandTime(b) - getErrandTime(a));
  const completed = errands.filter(e => e.status === 'done').sort((a, b) => getErrandTime(b) - getErrandTime(a));
  const displayErrands = activeTab === 'pending' ? pending : completed;

  return (
    <div>
      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--black) 0%, #2d3822 100%)',
        borderRadius: '20px', padding: '28px 32px', marginBottom: '22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
      }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--lime)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
            🛒 Shopping & Errands
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: '#fff', fontWeight: 700, lineHeight: 1.1, marginBottom: '6px' }}>
            Errands & Pabili Tracking
          </h2>
          <p style={{ color: '#888', fontSize: '13px' }}>Mark off client requested items and tasks</p>
        </div>
        {!formOpen && (
          <button type="button" className="btn btn-lime" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> New Errand
          </button>
        )}
      </div>

      {/* ── TABS ── */}
      {!formOpen && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            style={{ 
              padding: '10px 18px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer',
              background: activeTab === 'pending' ? '#111' : '#f0f0f0', 
              color: activeTab === 'pending' ? '#fff' : '#777', touchAction: 'manipulation'
            }}
          >
            Pending ({pending.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('done')}
            style={{ 
              padding: '10px 18px', borderRadius: '20px', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer',
              background: activeTab === 'done' ? '#111' : '#f0f0f0', 
              color: activeTab === 'done' ? '#fff' : '#777', touchAction: 'manipulation'
            }}
          >
            Completed
          </button>
        </div>
      )}

      {/* ── FORM ── */}
      {formOpen && (
        <div className="card" style={{ marginBottom: '22px', border: '2px solid var(--lime-dark)', background: '#fff', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontWeight: 800, fontSize: '18px' }}>{editingId ? 'Edit Errand' : 'Add New Errand'}</div>
            <button type="button" aria-label="Close errand form" onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#777' }}>Errand Core Details</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="List Title (e.g. Ate Jasmine's Groceries)"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ flex: '1 1 200px', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ccc', fontFamily: 'var(--font-body)', fontSize: '14px' }}
              />
              <select 
                value={form.clientId}
                onChange={e => setForm({ ...form, clientId: e.target.value })}
                style={{ flex: '1 1 200px', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ccc', background: '#fff', fontFamily: 'var(--font-body)', fontSize: '14px' }}
              >
                <option value="">-- Attach to Client (Optional) --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: '#fafafa', borderRadius: '14px', padding: '16px', border: '1px solid #eee', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#777', marginBottom: '10px' }}>Itemized List</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {form.items.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#fff', fontSize: '10px', fontWeight: 800, color: '#aaa', width: '24px', height: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '10px', border: '1px solid #eee' }}>
                    {i+1}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input 
                        type="text" placeholder="Item (e.g. Cat Food)" value={item.title || ''}
                        onChange={e => updateItem(item.id, 'title', e.target.value)}
                        style={{ flex: '1 1 140px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minWidth: '120px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', flex: '1 0 auto' }}>
                        <NumericInput 
                          placeholder="Cost (₱)" value={item.amount ?? ''}
                          onValueChange={val => updateItem(item.id, 'amount', val)}
                          inputStyle={{ flex: 1, maxWidth: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                        />
                        {form.items.length > 1 && (
                          <button type="button" aria-label={`Remove item ${i + 1}`} onClick={() => removeItem(item.id)} style={{ background: '#fff0f0', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '0 14px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <input 
                        type="text" placeholder="Any notes? (e.g. Make sure it's chicken flavor)" value={item.note || ''}
                        onChange={e => updateItem(item.id, 'note', e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid transparent', background: '#f5f5f5', fontSize: '13px', color: '#555' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItemRow} 
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px dashed #ccc', background: 'transparent', color: '#666', fontWeight: 700, fontSize: '11px', marginTop: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Add Another Item
            </button>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
            <button type="button" className="btn btn-dark" onClick={handleSave} style={{ flex: '1 1 auto', paddingLeft: '30px', paddingRight: '30px', minHeight: '48px' }}>
              {editingId ? 'Update Record' : 'Save Errand'}
            </button>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#333', marginLeft: 'auto', background: '#f5f7fa', padding: '8px 16px', borderRadius: '12px', border: '1.5px solid #e0e6ed' }}>
              Total: ₱{form.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* ── ERRANDS LIST ── */}
      {!formOpen && (
        <div>
          {displayErrands.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', background: '#fffdf9' }}>
              <div style={{ margin: '0 auto 16px', background: 'var(--lime-pale)', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#889922' }}>
                <CheckSquare size={40} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No {activeTab} errands</h3>
              <p style={{ color: 'var(--gray)', fontSize: '13px' }}>
                You're all caught up! Kat has no more shopping tasks here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {displayErrands.map(errand => {
                const client = clients.find(c => c.id === errand.clientId);
                const hasItems = errand.items && errand.items.length > 0;
                
                return (
                  <div key={errand.id} className="card" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
                    {/* Header Strip */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: errand.status === 'done' ? '#fcfcfc' : '#fff' }}>
                      <button
                        type="button"
                        onClick={() => updateErrand(errand.id, { status: errand.status === 'done' ? 'pending' : 'done' })}
                        aria-label={errand.status === 'done' ? `Mark ${errand.title} pending` : `Mark ${errand.title} done`}
                        title={errand.status === 'done' ? 'Mark Pending' : 'Mark Done'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, paddingRight: '16px', color: errand.status === 'done' ? 'var(--green)' : '#ddd', display: 'flex' }}
                      >
                        {errand.status === 'done' ? <CheckCircle2 size={30} /> : <Circle size={30} />}
                      </button>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 800, fontSize: '16px',
                          textDecoration: errand.status === 'done' ? 'line-through' : 'none', 
                          color: errand.status === 'done' ? '#aaa' : '#222' 
                        }}>
                          {errand.title} {errand.isBilled && <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: '10px', verticalAlign: 'middle', marginLeft: '6px', textDecoration: 'none', display: 'inline-block' }}>🧾 Billed</span>}
                        </div>
                        {client && (
                          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', fontWeight: 600 }}>
                            👤 {client.name}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEdit(errand)} 
                          aria-label={`Edit ${errand.title}`}
                          style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', color: '#555', padding: '8px', borderRadius: '8px' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setErrandToDelete(errand)}
                          aria-label={`Delete ${errand.title}`}
                          style={{ background: '#fef2f2', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '8px', borderRadius: '8px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Items List (if expanded data exists) */}
                    {(hasItems || errand.amount > 0) && (
                      <div style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', padding: '16px 20px 16px 66px' }}>
                        {hasItems ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                            {errand.items.map((it, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <div style={{ color: errand.status === 'done' ? '#aaa' : '#444' }}>
                                  <span style={{ fontWeight: 600 }}>{it.title}</span>
                                  {it.note && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', fontStyle: 'italic' }}>{it.note}</div>}
                                </div>
                                <div style={{ fontWeight: 700, color: errand.status === 'done' ? '#aaa' : '#333' }}>
                                  ₱{(it.amount || 0).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', marginBottom: '12px' }}>Legacy flat-rate errand</div>
                        )}
                        
                        {/* Total Strip */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #ccc', paddingTop: '10px', fontSize: '14px' }}>
                          <span style={{ fontWeight: 800, color: '#aaa', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '.05em' }}>Grand Total</span>
                          <span style={{ fontWeight: 800, color: 'var(--green)' }}>₱{(errand.amount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {errandToDelete && (
        <ConfirmDialog
          title="Delete Errand?"
          description={`This removes ${errandToDelete.title} from the errand list.`}
          confirmLabel="Delete Errand"
          onConfirm={confirmDeleteErrand}
          onCancel={() => setErrandToDelete(null)}
        />
      )}
    </div>
  );
}
