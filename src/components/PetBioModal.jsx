import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Plus, Trash2, PawPrint, Phone, Utensils, AlertTriangle, FileText, Pill, Copy, PlusCircle } from 'lucide-react';
import { useData } from '../store/DataContext';
import { useToast } from './Toast';

const PET_TYPES = ['Dog', 'Cat'];

const PET_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#e67e22', '#16a085', '#d35400'];

const emptyPet = () => ({
  id: uuidv4(),
  name: '',
  type: 'Dog',
  color: PET_COLORS[Math.floor(Math.random() * PET_COLORS.length)],
  feedingTime: '',
  portionSize: '',
  allergies: '',
  vetName: '',
  vetPhone: '',
  notes: '',
  medications: [],
  medicationSequence: '',
});

export default function PetBioModal({ client, onClose }) {
  const { updateClient } = useData();
  const toast = useToast();
  const [pets, setPets] = useState(() => {
    if (client.pets?.length > 0) {
      return client.pets.map(p => ({ ...p, id: p.id || uuidv4() }));
    }
    return [emptyPet()];
  });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(pets[0]?.id || null);

  const updatePet = (id, field, value) => {
    setPets(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addMedication = (petId) => {
    setPets(prev => prev.map(p => {
      if (p.id !== petId) return p;
      return {
        ...p,
        medications: [...(p.medications || []), { id: uuidv4(), name: '', dose: '', frequency: '', instructions: '' }]
      };
    }));
  };

  const updateMedication = (petId, medId, field, value) => {
    setPets(prev => prev.map(p => {
      if (p.id !== petId) return p;
      return {
        ...p,
        medications: p.medications.map(m => m.id === medId ? { ...m, [field]: value } : m)
      };
    }));
  };

  const removeMedication = (petId, medId) => {
    setPets(prev => prev.map(p => {
      if (p.id !== petId) return p;
      return {
        ...p,
        medications: p.medications.filter(m => m.id !== medId)
      };
    }));
  };

  const copyMedications = (pet) => {
    let txt = `MEDICATIONS FOR ${pet.name?.toUpperCase() || 'PET'}:\n`;
    (pet.medications || []).forEach((m, i) => {
      const parts = [m.name, m.frequency, m.dose, m.instructions].filter(Boolean);
      txt += `${i + 1}. ${parts.join(' — ')}\n`;
    });
    if (pet.medicationSequence) txt += `\nSEQUENCE: ${pet.medicationSequence}`;
    navigator.clipboard.writeText(txt);
    toast('📋 Copied medication schedule!', 'success');
  };

  const addPet = () => {
    const np = emptyPet();
    setPets(prev => [...prev, np]);
    setExpandedId(np.id);
  };

  const removePet = (id) => {
    setPets(prev => {
      const next = prev.filter(p => p.id !== id);
      if (expandedId === id) setExpandedId(next[0]?.id || null);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClient(client.id, { pets });
      toast('🐾 Pet bios saved!', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      toast('Failed to save. Check your connection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`${client.name} pet bios`} style={{
      position: 'fixed', inset: 0, zIndex: 520,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px 20px 0 0',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 14px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>
              🐾 Pet Bios
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
              {client.name} · {pets.length} pet{pets.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button type="button" aria-label="Close pet bios" onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Pet tabs bar */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid #f0f0f0' }}>
          {pets.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setExpandedId(p.id)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: '20px',
                border: expandedId === p.id ? 'none' : '1.5px solid #eee',
                background: expandedId === p.id ? p.color : '#f5f5f5',
                color: expandedId === p.id ? '#fff' : '#555',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <PawPrint size={12} /> {p.name || 'Unnamed'}
            </button>
          ))}
          <button
            type="button"
            onClick={addPet}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1.5px dashed #ccc',
              background: 'transparent',
              color: '#999',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={12} /> Add Pet
          </button>
        </div>

        {/* Scrollable form body */}
        <div style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
          {pets.filter(p => p.id === expandedId).map(pet => (
            <div key={pet.id}>
              {/* Basic info row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#555', display: 'block', marginBottom: '6px' }}>Pet Name *</label>
                  <input
                    value={pet.name}
                    onChange={e => updatePet(pet.id, 'name', e.target.value)}
                    placeholder="e.g. Coco"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px', minHeight: '44px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#555', display: 'block', marginBottom: '6px' }}>Animal Type</label>
                  <select
                    value={pet.type}
                    onChange={e => updatePet(pet.id, 'type', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px', minHeight: '44px', boxSizing: 'border-box' }}
                  >
                    {PET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Section: Feeding */}
              <div style={{ background: '#f9fcf5', border: '1.5px solid #e3f0d8', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '13px', color: '#3a7c2a' }}>
                  <Utensils size={14} /> Feeding Info
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#666', display: 'block', marginBottom: '4px' }}>Feeding Times</label>
                    <input value={pet.feedingTime} onChange={e => updatePet(pet.id, 'feedingTime', e.target.value)} placeholder="e.g. 7am and 6pm" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '7px', fontSize: '13px', minHeight: '40px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#666', display: 'block', marginBottom: '4px' }}>Portion Size</label>
                    <input value={pet.portionSize} onChange={e => updatePet(pet.id, 'portionSize', e.target.value)} placeholder="e.g. 1 cup" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '7px', fontSize: '13px', minHeight: '40px', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Section: Allergies */}
              <div style={{ background: '#fff8f0', border: '1.5px solid #fde8c8', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '13px', color: '#b86a00' }}>
                  <AlertTriangle size={14} /> Allergies & Health Flags
                </div>
                <input value={pet.allergies} onChange={e => updatePet(pet.id, 'allergies', e.target.value)} placeholder="e.g. Chicken, certain grains..." style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #fde8c8', borderRadius: '7px', fontSize: '13px', minHeight: '40px', boxSizing: 'border-box' }} />
              </div>

              {/* Section: Vet */}
              <div style={{ background: '#f0f5ff', border: '1.5px solid #d0deff', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '13px', color: '#2040a0' }}>
                  <Phone size={14} /> Veterinarian / Emergency
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#666', display: 'block', marginBottom: '4px' }}>Vet Name</label>
                    <input value={pet.vetName} onChange={e => updatePet(pet.id, 'vetName', e.target.value)} placeholder="Dr. Santos" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #d0deff', borderRadius: '7px', fontSize: '13px', minHeight: '40px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#666', display: 'block', marginBottom: '4px' }}>Vet Phone</label>
                    <input value={pet.vetPhone} onChange={e => updatePet(pet.id, 'vetPhone', e.target.value)} placeholder="09171234567" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #d0deff', borderRadius: '7px', fontSize: '13px', minHeight: '40px', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Section: Notes */}
              <div style={{ background: '#fafafa', border: '1.5px solid #eee', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: 700, fontSize: '13px', color: '#555' }}>
                  <FileText size={14} /> Behavioral Notes / Quirks
                </div>
                <textarea
                  value={pet.notes}
                  onChange={e => updatePet(pet.id, 'notes', e.target.value)}
                  placeholder="e.g. Hides under the bed during storms. Loves belly rubs."
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #eee', borderRadius: '7px', fontSize: '13px', resize: 'vertical', minHeight: '72px', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
                />
              </div>

              {/* Section: Medications */}
              <div style={{ background: '#f5f0ff', border: '1.5px solid #ddd0ff', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: '#5b21b6' }}>
                    <Pill size={14} /> Medications
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(pet.medications || []).length > 0 && (
                      <button
                        type="button"
                        onClick={() => copyMedications(pet)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: '7px', padding: '5px 10px', color: '#5b21b6', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                      >
                        <Copy size={12} /> Copy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => addMedication(pet.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#7c3aed', border: 'none', borderRadius: '7px', padding: '5px 10px', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                    >
                      <PlusCircle size={12} /> Add Med
                    </button>
                  </div>
                </div>

                {(pet.medications || []).length === 0 && (
                  <div style={{ fontSize: '12px', color: '#a78bfa', textAlign: 'center', padding: '10px 0' }}>
                    No medications yet. Tap "Add Med" to add one.
                  </div>
                )}

                {(pet.medications || []).map((med, idx) => (
                  <div key={med.id} style={{ background: '#fff', border: '1px solid #e9d9ff', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: '5px' }}>#{idx + 1}</span>
                      <button type="button" onClick={() => removeMedication(pet.id, med.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', padding: '2px' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', display: 'block', marginBottom: '3px' }}>Medicine Name</label>
                        <input value={med.name} onChange={e => updateMedication(pet.id, med.id, 'name', e.target.value)} placeholder="e.g. Co-Amoxiclav" style={{ width: '100%', padding: '7px 9px', border: '1px solid #ddd0ff', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', display: 'block', marginBottom: '3px' }}>Dose</label>
                        <input value={med.dose} onChange={e => updateMedication(pet.id, med.id, 'dose', e.target.value)} placeholder="e.g. 1 mL" style={{ width: '100%', padding: '7px 9px', border: '1px solid #ddd0ff', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', display: 'block', marginBottom: '3px' }}>When to Give</label>
                      <input value={med.frequency} onChange={e => updateMedication(pet.id, med.id, 'frequency', e.target.value)} placeholder="e.g. 6am & 6pm" style={{ width: '100%', padding: '7px 9px', border: '1px solid #ddd0ff', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 700, color: '#7c3aed', display: 'block', marginBottom: '3px' }}>Special Instructions</label>
                      <input value={med.instructions} onChange={e => updateMedication(pet.id, med.id, 'instructions', e.target.value)} placeholder="e.g. Shake before use, give after food" style={{ width: '100%', padding: '7px 9px', border: '1px solid #ddd0ff', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                ))}

                {(pet.medications || []).length > 1 && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', display: 'block', marginBottom: '5px' }}>Administration Sequence</label>
                    <input
                      value={pet.medicationSequence || ''}
                      onChange={e => updatePet(pet.id, 'medicationSequence', e.target.value)}
                      placeholder="e.g. 1 → 2 → 3 → 6 → 7 → 5 (after 2hrs)"
                      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd0ff', borderRadius: '7px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>

              {/* Delete pet button */}
              {pets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePet(pet.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff0f0', border: '1.5px solid #ffd0d0', borderRadius: '8px', padding: '8px 14px', color: '#c0392b', fontWeight: 600, fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}
                >
                  <Trash2 size={14} /> Remove {pet.name || 'This Pet'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer action */}
        <div style={{ padding: '16px 20px calc(16px + var(--safe-bottom))', borderTop: '1px solid #f0f0f0', flexShrink: 0, display: 'flex', gap: '10px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', border: '1.5px solid #eee', borderRadius: '10px', background: '#fafafa', fontWeight: 600, cursor: 'pointer', minHeight: '48px' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 2, padding: '12px', border: 'none', borderRadius: '10px', background: 'var(--lime-dark)', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', minHeight: '48px', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : '💾 Save Pet Bios'}
          </button>
        </div>
      </div>
    </div>
  );
}
