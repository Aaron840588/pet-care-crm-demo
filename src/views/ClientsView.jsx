import React, { useState } from 'react';
import { useData } from '../store/DataContext';
import ConfirmDialog from '../components/ConfirmDialog';
import PetBioModal from '../components/PetBioModal';
import { useToast } from '../components/Toast';
import { v4 as uuidv4 } from 'uuid';
import { PawPrint } from 'lucide-react';
import { fmtShort, dateSortValue } from '../utils/dates';

// ─── SVG Pet Logos ────────────────────────────────────────────────────────────
const CatSvg = ({ color, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Ears */}
    <polygon points="10,22 18,6 22,22" fill={color} />
    <polygon points="42,22 46,6 54,22" fill={color} />
    <polygon points="12,22 18,10 21,22" fill="#fff9" />
    <polygon points="43,22 46,10 52,22" fill="#fff9" />
    {/* Head */}
    <ellipse cx="32" cy="34" rx="22" ry="20" fill={color} />
    {/* Eyes */}
    <ellipse cx="22" cy="30" rx="5" ry="6" fill="#222" />
    <ellipse cx="42" cy="30" rx="5" ry="6" fill="#222" />
    <ellipse cx="23" cy="29" rx="2" ry="2" fill="#fff" />
    <ellipse cx="43" cy="29" rx="2" ry="2" fill="#fff" />
    {/* Nose */}
    <ellipse cx="32" cy="38" rx="3" ry="2" fill="#e88" />
    {/* Mouth */}
    <path d="M29 40 Q32 44 35 40" stroke="#c55" strokeWidth="1.5" fill="none" />
    {/* Whiskers */}
    <line x1="10" y1="37" x2="26" y2="38" stroke="#777" strokeWidth="1" />
    <line x1="10" y1="40" x2="26" y2="40" stroke="#777" strokeWidth="1" />
    <line x1="38" y1="38" x2="54" y2="37" stroke="#777" strokeWidth="1" />
    <line x1="38" y1="40" x2="54" y2="40" stroke="#777" strokeWidth="1" />
  </svg>
);

const DogSvg = ({ color, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Floppy ears */}
    <ellipse cx="12" cy="30" rx="9" ry="14" fill={color} transform="rotate(-15 12 30)" />
    <ellipse cx="52" cy="30" rx="9" ry="14" fill={color} transform="rotate(15 52 30)" />
    {/* Head */}
    <ellipse cx="32" cy="30" rx="20" ry="20" fill={color} />
    {/* Muzzle */}
    <ellipse cx="32" cy="40" rx="12" ry="8" fill="#fff6" />
    {/* Eyes */}
    <circle cx="23" cy="27" r="4.5" fill="#222" />
    <circle cx="41" cy="27" r="4.5" fill="#222" />
    <circle cx="24" cy="26" r="1.5" fill="#fff" />
    <circle cx="42" cy="26" r="1.5" fill="#fff" />
    {/* Nose */}
    <ellipse cx="32" cy="38" rx="5" ry="3.5" fill="#333" />
    <ellipse cx="31" cy="37" rx="1.5" ry="1" fill="#fff6" />
    {/* Mouth */}
    <path d="M27 42 Q32 47 37 42" stroke="#555" strokeWidth="1.5" fill="none" />
  </svg>
);

const RabbitSvg = ({ color, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="22" cy="14" rx="6" ry="16" fill={color} />
    <ellipse cx="42" cy="14" rx="6" ry="16" fill={color} />
    <ellipse cx="22" cy="14" rx="3" ry="13" fill="#ffb0b0" />
    <ellipse cx="42" cy="14" rx="3" ry="13" fill="#ffb0b0" />
    <ellipse cx="32" cy="38" rx="20" ry="18" fill={color} />
    <circle cx="23" cy="34" r="4" fill="#222" />
    <circle cx="41" cy="34" r="4" fill="#222" />
    <circle cx="24" cy="33" r="1.5" fill="#fff" />
    <circle cx="42" cy="33" r="1.5" fill="#fff" />
    <ellipse cx="32" cy="41" rx="4" ry="3" fill="#ffb0b0" />
    <path d="M28 44 Q32 48 36 44" stroke="#e88" strokeWidth="1.5" fill="none" />
  </svg>
);

const BirdSvg = ({ color, size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="34" rx="18" ry="20" fill={color} />
    <ellipse cx="32" cy="20" rx="14" ry="14" fill={color} />
    <circle cx="26" cy="18" r="5" fill="#222" />
    <circle cx="27" cy="17" r="2" fill="#fff" />
    <polygon points="28,22 38,22 33,28" fill="#f90" />
    <ellipse cx="48" cy="34" rx="8" ry="5" fill={color} style={{transform:'rotate(-20deg)', transformOrigin:'center'}} />
    <ellipse cx="16" cy="34" rx="8" ry="5" fill={color} style={{transform:'rotate(20deg)', transformOrigin:'center'}} />
  </svg>
);

const getPetSvg = (type, color, size = 28) => {
  switch(type) {
    case 'dog': return <DogSvg color={color} size={size} />;
    case 'cat': return <CatSvg color={color} size={size} />;
    case 'rabbit': return <RabbitSvg color={color} size={size} />;
    case 'bird': return <BirdSvg color={color} size={size} />;
    default: return <PawPrint size={size} color={color} />;
  }
};

// ─── Top 10 Common Cat Colors in the Philippines ──────────────────────────────
const CAT_COLORS = [
  { label: 'Orange Tabby',    color: '#d4823a' },
  { label: 'Black',           color: '#2b2b2b' },
  { label: 'White',           color: '#e8e8e0', border: true },
  { label: 'Gray / Blue',     color: '#8090a0' },
  { label: 'Brown Tabby',     color: '#7a5230' },
  { label: 'Calico (Orange)', color: '#c47a35' },
  { label: 'Tuxedo',         color: '#2b2b2b' },
  { label: 'Tortoiseshell',   color: '#a0541e' },
  { label: 'Cream / Beige',   color: '#d4b896' },
  { label: 'Silver Tabby',    color: '#a0a8b0' },
];

const DOG_COLORS = [
  { label: 'Golden / Aspin',  color: '#c89648' },
  { label: 'Black',           color: '#2b2b2b' },
  { label: 'White',           color: '#e8e8e0', border: true },
  { label: 'Brown',           color: '#7a4a20' },
  { label: 'Gray',            color: '#888898' },
  { label: 'Cream',           color: '#d4c09a' },
  { label: 'Brindle',         color: '#6b4820' },
  { label: 'Spotted',         color: '#c4a060' },
];

export default function ClientsView() {
  const { clients, addClient, updateClient, removeClient, bookings } = useData();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [petBioClient, setPetBioClient] = useState(null);

  const emptyClient = { name: '', contact: '', address: '', pets: [], notes: '', keyStatus: 'none', keyDate: '', keyNotes: '' };
  const [formData, setFormData] = useState(emptyClient);

  const [petInput, setPetInput] = useState('');
  const [petIcon, setPetIcon] = useState('cat');
  const [petColor, setPetColor] = useState('#d4823a'); // default orange tabby

  const openAdd = () => { setFormData({ ...emptyClient }); setPetInput(''); setPetIcon('cat'); setPetColor('#d4823a'); setEditingId(null); setModalOpen(true); };
  const openEdit = (client) => { setFormData({ ...client, pets: client.pets || [] }); setEditingId(client.id); setModalOpen(true); };

  const handlePetTypeChange = (type) => {
    setPetIcon(type);
    if (type === 'cat') setPetColor('#d4823a');
    else if (type === 'dog') setPetColor('#c89648');
    else if (type === 'rabbit') setPetColor('#d4c09a');
    else if (type === 'bird') setPetColor('#58b0e0');
  };

  const handleAddPetObj = () => {
    if (petInput.trim() !== '') {
      setFormData(prev => ({ 
        ...prev, 
        pets: [...prev.pets, { name: petInput.trim(), icon: petIcon, color: petColor }] 
      }));
      setPetInput('');
    }
  };

  const removePet = (idx) => {
    setFormData(prev => ({ ...prev, pets: prev.pets.filter((_, i) => i !== idx) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingId) {
        await updateClient(editingId, formData);
        toast(`Updated ${formData.name}.`, 'success');
      } else {
        await addClient({ ...formData, id: uuidv4() });
        toast(`Added ${formData.name}.`, 'success');
      }

      setModalOpen(false);
    } catch (error) {
      console.error(error);
      toast('Unable to save this client right now.', 'error');
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      await removeClient(clientToDelete.id);
      toast(`Deleted ${clientToDelete.name}.`, 'info');
    } catch (error) {
      console.error(error);
      toast('Unable to delete this client right now.', 'error');
    } finally {
      setClientToDelete(null);
    }
  };

  const getKeyBadge = (status) => {
    switch(status) {
      case 'received': return <span className="key-badge key-received">Received ✓</span>;
      case 'pending': return <span className="key-badge key-pending">Pending</span>;
      case 'returned': return <span className="key-badge key-returned">Returned</span>;
      default: return <span className="key-badge key-none">No Key</span>;
    }
  };

  const colorPresets = petIcon === 'dog' ? DOG_COLORS : petIcon === 'cat' ? CAT_COLORS : null;

  return (
    <>
      <div className="ph">
        <div>
          <h2>Clients</h2>
          <p>Client profiles, pets & special instructions</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-lime" onClick={openAdd}>+ Add Client</button>
        </div>
      </div>

      <div className="clients-grid">
        {clients.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: '14px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
              <CatSvg color="#d4823a" size={48} />
              <DogSvg color="#c89648" size={48} />
            </div>
            <p style={{ color: 'var(--gray)', fontSize: '14px' }}>No clients yet. Add your first one!</p>
          </div>
        ) : (
          clients.map(c => (
             <div key={c.id} className="client-card">
                <div className="cc-name">{c.name}</div>
                <div className="cc-contact">{c.contact || 'No contact'} | {c.address || 'No address'}</div>
                <div className="pets-row">
                  {c.pets && c.pets.map((p, idx) => {
                    const petName = typeof p === 'string' ? p : p.name;
                    const petType = typeof p === 'string' ? 'paw' : p.icon;
                    const pColor = typeof p === 'string' ? '#888' : p.color;
                    return (
                      <span key={idx} className="pet-chip" style={{ border: `1.5px solid ${pColor}50`, backgroundColor: `${pColor}15` }}>
                        {getPetSvg(petType, pColor, 20)} <span style={{color: pColor, fontWeight: 700, fontSize: '12px'}}>{petName}</span>
                      </span>
                    );
                  })}
                  {(!c.pets || c.pets.length===0) && <span style={{fontSize:'12px',color:'var(--gray)'}}>No pets listed</span>}
                </div>
                <div className="cc-notes">
                  {c.notes || <i>No general notes provided.</i>}
                </div>

                {/* BOOKING HISTORY SUMMARY */}
                {(() => {
                  const clientBookings = bookings.filter(b => b.clientId === c.id);
                  const totalEarned = clientBookings.reduce((sum, b) => sum + (b.total || 0), 0);
                  const lastBooking = [...clientBookings].sort((a, b) => dateSortValue(b.startDate) - dateSortValue(a.startDate))[0];
                  if (clientBookings.length === 0) return null;
                  return (
                    <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div><span style={{ color: 'var(--gray)' }}>Bookings</span><br/><strong>{clientBookings.length}</strong></div>
                      <div><span style={{ color: 'var(--gray)' }}>Total Earned</span><br/><strong style={{ color: 'var(--green)' }}>₱{totalEarned}</strong></div>
                      {lastBooking && <div><span style={{ color: 'var(--gray)' }}>Last Booking</span><br/><strong>{fmtShort(lastBooking.startDate)}</strong></div>}
                    </div>
                  );
                })()}

                <div style={{ padding: '8px', background: 'var(--lime-pale)', borderRadius: '8px', marginBottom: '10px' }}>
                  <span style={{fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555'}}>Key Status:</span> {getKeyBadge(c.keyStatus)}
                </div>
                <div className="cc-actions">
                  <button type="button" className="btn btn-xs" aria-label={`View pet bios for client ${c.name}`} style={{ background: '#e8f4ff', color: '#2060c0', border: '1px solid #c0d8f0' }} onClick={() => setPetBioClient(c)}>🐾 Pet Bios{c.pets?.some(p => p.vetName || p.allergies || p.feedingTime) ? ` ✓` : ''}</button>
                  <button type="button" className="btn btn-xs btn-ghost" aria-label={`Edit profile for client ${c.name}`} onClick={() => openEdit(c)}>Edit</button>
                  <button type="button" className="btn btn-xs btn-danger" aria-label={`Delete profile for client ${c.name}`} onClick={() => setClientToDelete(c)}>Delete</button>
                </div>
             </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="overlay open">
          <div className="modal" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="modal-title" style={{ flexShrink: 0 }}>{editingId ? 'Edit Client' : 'Add Client'}</div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="modal-content-scroller" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div className="fg"><label>Client Name *</label><input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="e.g. Kuya Paolo" /></div>
                <div className="form-row">
                  <div className="fg"><label>Contact Number</label><input type="text" value={formData.contact} onChange={e=>setFormData({...formData, contact: e.target.value})} /></div>
                  <div className="fg"><label>Address / Location</label><input type="text" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} /></div>
                </div>

                {/* ── PET ADDER SECTION ── */}
                <div className="fg">
                  <label>Pets</label>
                  {/* Added pets list */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px', minHeight: '10px' }}>
                    {formData.pets.map((p, idx) => {
                      const petName = typeof p === 'string' ? p : p.name;
                      const petType = typeof p === 'string' ? 'paw' : p.icon;
                      const pColor = typeof p === 'string' ? '#888' : p.color;
                      return (
                        <div key={idx} style={{ background: `${pColor}15`, border: `1.5px solid ${pColor}50`, borderRadius: '20px', padding: '4px 12px 4px 8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {getPetSvg(petType, pColor, 22)}
                          <span style={{ fontWeight: 700, fontSize: '12px', color: pColor }}>{petName}</span>
                          <button
                            type="button"
                            onClick={() => removePet(idx)}
                            style={{ cursor: 'pointer', color: '#aaa', fontWeight: 'bold', fontSize: '14px', lineHeight: 1, marginLeft: '2px', background: 'none', border: 'none', padding: 0 }}
                            aria-label={`Remove ${petName}`}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pet builder row */}
                  <div style={{ background: '#fafafa', borderRadius: '10px', padding: '12px', border: '1px solid #eee' }}>
                    {/* Type selector */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'cat',    label: 'Cat',    Svg: CatSvg,    c: '#d4823a' },
                        { id: 'dog',    label: 'Dog',    Svg: DogSvg,    c: '#c89648' },
                        { id: 'rabbit', label: 'Rabbit', Svg: RabbitSvg, c: '#d4c09a' },
                        { id: 'bird',   label: 'Bird',   Svg: BirdSvg,   c: '#58b0e0' },
                      ].map(t => (
                        <button type="button" key={t.id}
                          onClick={() => handlePetTypeChange(t.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '6px 12px', borderRadius: '20px', border: `2px solid ${petIcon === t.id ? petColor : '#ddd'}`,
                            background: petIcon === t.id ? `${petColor}15` : '#fff',
                            cursor: 'pointer', fontWeight: 600, fontSize: '12px', transition: 'all .15s'
                          }}>
                          <t.Svg color={petIcon === t.id ? petColor : '#aaa'} size={20} />
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Color presets */}
                    {colorPresets && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#888', marginBottom: '6px' }}>
                          Common {petIcon === 'cat' ? 'Cat' : 'Dog'} Colors 🇵🇭
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {colorPresets.map(cp => (
                            <button type="button" key={`${cp.label}-${cp.color}`} onClick={() => setPetColor(cp.color)}
                              aria-label={`Choose ${cp.label} pet color`}
                              title={cp.label}
                              style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: cp.color,
                                border: petColor === cp.color ? '3px solid #333' : cp.border ? '2px solid #ccc' : '2px solid transparent',
                                cursor: 'pointer', transition: 'transform .1s, border .1s',
                                transform: petColor === cp.color ? 'scale(1.2)' : 'scale(1)',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                              }}
                            />
                          ))}
                          {/* Manual color picker */}
                          <label title="Custom color" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px dashed #bbb', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                            ✏️
                            <input type="color" value={petColor} onChange={e => setPetColor(e.target.value)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                          </label>
                        </div>

                        {/* Color name preview */}
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                          Selected: <strong style={{color: petColor}}>{colorPresets.find(c => c.color === petColor)?.label || 'Custom Color'}</strong>
                        </div>
                      </div>
                    )}

                    {/* Preview + Name input */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ background: `${petColor}20`, borderRadius: '8px', padding: '6px', flexShrink: 0, border: `1px solid ${petColor}50` }}>
                        {getPetSvg(petIcon, petColor, 32)}
                      </div>
                      <input type="text" value={petInput} onChange={e => setPetInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPetObj(); }}}
                        placeholder={`${petIcon === 'cat' ? 'e.g. Luna, Mochi' : petIcon === 'dog' ? 'e.g. Bruno, Coco' : 'Pet name...'}`}
                        style={{ flex: 1, margin: 0 }}
                      />
                      <button type="button" className="btn btn-sm btn-lime" onClick={handleAddPetObj}>Add</button>
                    </div>
                  </div>
                </div>

                <div className="fg"><label>Special Instructions / Notes</label>
                   <textarea value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} placeholder="Feeding schedule, medicine, quirks..."></textarea>
                </div>

                <div style={{ background: 'var(--lime-pale)', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#555', marginBottom: '10px' }}>🔑 Key Information</div>
                  <div className="form-row">
                    <div className="fg"><label>Key Status</label>
                      <select value={formData.keyStatus} onChange={e=>setFormData({...formData, keyStatus: e.target.value})}>
                        <option value="none">No key needed</option>
                        <option value="pending">Pending — not yet received</option>
                        <option value="received">Received ✓</option>
                        <option value="returned">Returned to owner</option>
                      </select>
                    </div>
                    <div className="fg"><label>Date Received</label><input type="date" value={formData.keyDate} onChange={e=>setFormData({...formData, keyDate: e.target.value})} /></div>
                  </div>
                  <div className="fg" style={{margin:0}}><label>Key Notes</label><input type="text" value={formData.keyNotes} onChange={e=>setFormData({...formData, keyNotes: e.target.value})} placeholder="e.g. Black key for Unit 4B" /></div>
                </div>
              </div>

              <div className="modal-actions modal-action-footer" style={{ flexShrink: 0, padding: '16px', borderTop: '1px solid #eee' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-lime">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {clientToDelete && (
        <ConfirmDialog
          title="Delete Client?"
          description={`This removes ${clientToDelete.name}'s client profile. Existing bookings and invoices stay as saved records.`}
          confirmLabel="Delete Client"
          onConfirm={handleDeleteClient}
          onCancel={() => setClientToDelete(null)}
        />
      )}

      {petBioClient && (
        <PetBioModal
          client={petBioClient}
          onClose={() => setPetBioClient(null)}
        />
      )}
    </>
  );
}
