import React, { useRef, useState } from 'react';
import { useData } from '../store/DataContext';
import ConfirmDialog from '../components/ConfirmDialog';
import NumericInput from '../components/NumericInput';
import { useToast } from '../components/Toast';
import { Download, Upload, Plus, Pencil, Trash2, Check, X, Wifi, WifiOff } from 'lucide-react';

export default function SettingsView() {
  const { exportData, importData, services, setServices, syncStatus } = useData();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

  // ── Service editor state ──────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSub, setEditSub] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newSub, setNewSub] = useState('up to 2 pets');
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const startEdit = (svc) => {
    setEditingId(svc.id);
    setEditName(svc.name);
    setEditPrice(String(svc.price));
    setEditSub(svc.defaultSub || '');
    setAdding(false);
  };

  const saveEdit = () => {
    if (!editName.trim() || !editPrice) return;
    setServices(prev => prev.map(s =>
      s.id === editingId
        ? { ...s, name: editName.trim(), price: Number(editPrice), defaultSub: editSub.trim() }
        : s
    ));
    setEditingId(null);
  };

  const deleteService = (id) => {
    if (services.length <= 1) {
      toast('Keep at least one service in the list.', 'warning');
      return;
    }

    setServiceToDelete(id);
  };

  const saveNew = () => {
    if (!newName.trim() || !newPrice) return;
    const newId = Date.now().toString();
    setServices(prev => [...prev, {
      id: newId,
      name: newName.trim(),
      price: Number(newPrice),
      defaultSub: newSub.trim()
    }]);
    setNewName(''); setNewPrice(''); setNewSub('up to 2 pets');
    setAdding(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await importData(ev.target.result);
        toast('Backup imported successfully.', 'success');
      } catch (error) {
        console.error(error);
        toast(error?.message || 'Import failed. Check that the backup file is valid JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const confirmDeleteService = () => {
    if (!serviceToDelete) return;
    setServices(prev => prev.filter(s => s.id !== serviceToDelete));
    setServiceToDelete(null);
    toast('Service removed.', 'info');
  };

  return (
    <>
      <div className="ph">
        <div>
          <h2>Settings</h2>
          <p>Manage your services, prices, and data backups</p>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── SYNC STATUS ── */}
        <div className="card" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px' }}>
          <div style={{
            background: syncStatus === 'online' ? '#e6f7ed' : '#fff4e0',
            borderRadius: '10px', padding: '10px', flexShrink: 0
          }}>
            {syncStatus === 'online'
              ? <Wifi size={22} color="var(--green)" />
              : <WifiOff size={22} color="var(--orange)" />
            }
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>
              {syncStatus === 'online' ? '🟢 Live — Syncing to Cloud' : '🟡 Offline — Changes saved locally'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
              {syncStatus === 'online'
                ? 'Any device opening this app will see the same data.'
                : 'Data will auto-sync to all devices when internet returns.'}
            </div>
          </div>
        </div>

        {/* ── SERVICES EDITOR ── */}
        <div className="card" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #f0f0ee' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>🛎 My Services & Prices</div>
                <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
                  These show up in the Schedule booking form and invoices.
                </div>
              </div>
              {!adding && (
                <button className="btn btn-lime btn-sm" onClick={() => { setAdding(true); setEditingId(null); }}>
                  <Plus size={14} /> Add Service
                </button>
              )}
            </div>
          </div>

          {/* Add new service row */}
          {adding && (
            <div style={{ background: 'var(--lime-pale)', padding: '16px 22px', borderBottom: '1px solid #dde8a0' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '10px', color: '#555' }}>
                New Service
              </div>
              <div className="service-edit-row">
                <div className="fg" style={{ margin: 0 }}>
                  <label>Service Name *</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Overnight Stay" autoFocus />
                </div>
                <div className="fg" style={{ margin: 0 }}>
                  <label>Price (₱/day) *</label>
                  <NumericInput
                    value={newPrice}
                    min={1}
                    fallbackValue=""
                    onValueChange={setNewPrice}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>
              <div className="fg" style={{ margin: '0 0 12px' }}>
                <label>Description (optional)</label>
                <input value={newSub} onChange={e => setNewSub(e.target.value)}
                  placeholder="e.g. up to 3 pets" />
              </div>
              <div className="service-action-row">
                <button type="button" className="btn btn-lime btn-sm" onClick={saveNew}>
                  <Check size={14} /> Save Service
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Services list */}
          {services.map((svc, idx) => (
            <div key={svc.id} style={{
              padding: '16px 22px',
              borderBottom: idx < services.length - 1 ? '1px solid #f4f4f0' : 'none',
              background: editingId === svc.id ? '#fffef5' : '#fff'
            }}>
              {editingId === svc.id ? (
                // Edit mode
                <div>
                  <div className="service-edit-row">
                    <div className="fg" style={{ margin: 0 }}>
                      <label>Service Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                    </div>
                    <div className="fg" style={{ margin: 0 }}>
                      <label>Price (₱/day)</label>
                      <NumericInput
                        value={editPrice}
                        min={1}
                        fallbackValue=""
                        onValueChange={setEditPrice}
                      />
                    </div>
                  </div>
                  <div className="fg" style={{ margin: '0 0 12px' }}>
                    <label>Description</label>
                    <input value={editSub} onChange={e => setEditSub(e.target.value)} />
                  </div>
                  <div className="service-action-row">
                    <button type="button" className="btn btn-lime btn-sm" onClick={saveEdit}>
                      <Check size={14} /> Save Changes
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View mode
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    background: 'var(--lime)', borderRadius: '10px',
                    padding: '10px 14px', fontWeight: 800, fontSize: '15px',
                    minWidth: '80px', textAlign: 'center', flexShrink: 0
                  }}>
                    ₱{svc.price}
                    <div style={{ fontWeight: 500, fontSize: '9px', color: '#555', marginTop: '1px' }}>/day</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{svc.name}</div>
                    {svc.defaultSub && (
                      <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '2px' }}>{svc.defaultSub}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button type="button" className="btn btn-xs btn-ghost" onClick={() => startEdit(svc)} title="Edit">
                      <Pencil size={12} />
                    </button>
                    <button type="button" className="btn btn-xs btn-danger" onClick={() => deleteService(svc.id)} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── BACKUP MODULE ── */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>
            📦 Data Backup
          </div>
          <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6, marginBottom: '20px' }}>
            Your data lives in the cloud (Firebase). As an extra safety net, you can export a local copy as a <code>.json</code> file and restore it at any time.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-lime" style={{ flex: 1, justifyContent: 'center', minWidth: '140px' }} onClick={exportData}>
              <Download size={18} /> Export Backup
            </button>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, justifyContent: 'center', minWidth: '140px', opacity: isDemo ? 0.5 : 1, cursor: isDemo ? 'not-allowed' : 'pointer' }}
              onClick={isDemo ? () => toast('Import is disabled in Demo Sandbox Mode.', 'error') : () => fileInputRef.current.click()}
              disabled={isDemo}
            >
              <Upload size={18} /> {isDemo ? 'Import (Disabled)' : 'Import Backup'}
            </button>
          </div>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        </div>

        {/* ── APP INFO ── */}
        <div style={{ textAlign: 'center', padding: '10px', color: 'var(--gray)', fontSize: '11px', lineHeight: 1.6 }}>
          Pet Care Operations CRM 🐾<br/>
          Portfolio Demo Sandbox<br/>
          GCash: 0917-000-0000
        </div>

      </div>

      {serviceToDelete && (
        <ConfirmDialog
          title="Delete Service?"
          description="This removes the service from future booking and invoice forms. Existing saved bookings keep their own copied values."
          confirmLabel="Delete Service"
          onConfirm={confirmDeleteService}
          onCancel={() => setServiceToDelete(null)}
        />
      )}
    </>
  );
}
