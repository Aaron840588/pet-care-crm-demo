import React, { useMemo, useState } from 'react';
import Tesseract from 'tesseract.js';
import {
  CircleDollarSign,
  HeartPulse,
  PawPrint,
  Pencil,
  Plus,
  Save,
  ScanText,
  Syringe,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useData } from '../store/DataContext';
import { useToast } from '../components/Toast';
import { todayLocalStr } from '../utils/dates';
import { getOwnPetCareStatus, parseGcashDonationText } from '../utils/ownPetLogic';
import NumericInput from '../components/NumericInput';

const emptyPetForm = {
  name: '',
  type: 'Cat',
  sex: '',
  birthday: '',
  color: '',
  isSick: false,
  sickStartedAt: '',
  sicknessNotes: '',
  vaccinesUpdated: true,
  lastVaccineDate: '',
  nextVaccineDate: '',
  vaccineNotes: '',
  notes: '',
};

const emptyDonationForm = {
  petId: '',
  donorName: '',
  amount: '',
  rawDate: '',
  referenceNumber: '',
  channel: 'GCash',
  notes: '',
  rawText: '',
  screenshotName: '',
  dateRecorded: todayLocalStr(),
};

const money = (value) => `PHP ${Number(value || 0).toLocaleString('en-PH')}`;

const statusStyle = (tone) => {
  if (tone === 'danger') return { background: '#fff0f0', color: 'var(--red)', border: '1px solid #f5cece' };
  if (tone === 'warning') return { background: '#fff4e0', color: '#9a5a00', border: '1px solid #f2ce82' };
  if (tone === 'notice') return { background: '#fff8d7', color: '#6f5a00', border: '1px solid #e6d46b' };
  return { background: '#e6f7ed', color: 'var(--green)', border: '1px solid #bfe5c9' };
};

export default function OwnPetsView() {
  const {
    ownPets,
    addOwnPet,
    updateOwnPet,
    removeOwnPet,
    donations,
    addDonation,
    removeDonation,
  } = useData();
  const toast = useToast();

  const [petForm, setPetForm] = useState(emptyPetForm);
  const [editingPetId, setEditingPetId] = useState(null);
  const [donationForm, setDonationForm] = useState(emptyDonationForm);
  const [ocrBusy, setOcrBusy] = useState(false);

  const donationsByPet = useMemo(() => {
    const totals = {};
    donations.forEach((donation) => {
      const petId = donation.petId || 'unassigned';
      totals[petId] = (totals[petId] || 0) + Number(donation.amount || 0);
    });
    return totals;
  }, [donations]);

  const sickCount = useMemo(() => ownPets.filter((pet) => pet.isSick).length, [ownPets]);
  const vaccineWatchCount = useMemo(() => (
    ownPets.filter((pet) => {
      const status = getOwnPetCareStatus(pet);
      return status.key === 'vaccine_due_soon' || status.key === 'vaccine_overdue';
    }).length
  ), [ownPets]);
  const totalDonations = useMemo(
    () => donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0),
    [donations],
  );

  const setPet = (patch) => setPetForm((prev) => ({ ...prev, ...patch }));
  const setDonation = (patch) => setDonationForm((prev) => ({ ...prev, ...patch }));

  const resetPetForm = () => {
    setPetForm(emptyPetForm);
    setEditingPetId(null);
  };

  const handlePetSubmit = async (event) => {
    event.preventDefault();
    if (!petForm.name.trim()) {
      toast('Pet name is required.', 'error');
      return;
    }

    const payload = {
      ...petForm,
      name: petForm.name.trim(),
      type: petForm.type || 'Pet',
      isSick: Boolean(petForm.isSick),
      vaccinesUpdated: Boolean(petForm.vaccinesUpdated),
    };

    try {
      if (editingPetId) {
        await updateOwnPet(editingPetId, payload);
        toast('Pet record updated.');
      } else {
        await addOwnPet(payload);
        toast('Pet record added.');
      }
      resetPetForm();
    } catch (error) {
      console.error(error);
      toast('Could not save pet record.', 'error');
    }
  };

  const editPet = (pet) => {
    setPetForm({ ...emptyPetForm, ...pet, isSick: Boolean(pet.isSick), vaccinesUpdated: pet.vaccinesUpdated !== false });
    setEditingPetId(pet.id);
  };

  const handleDonationScreenshot = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDonation({ screenshotName: file.name });
    setOcrBusy(true);
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const rawText = result?.data?.text || '';
      const parsed = parseGcashDonationText(rawText);
      setDonationForm((prev) => ({
        ...prev,
        donorName: parsed.donorName || prev.donorName,
        amount: parsed.amount ? String(parsed.amount) : prev.amount,
        rawDate: parsed.rawDate || prev.rawDate,
        referenceNumber: parsed.referenceNumber || prev.referenceNumber,
        rawText,
        screenshotName: file.name,
      }));
      toast('GCash screenshot scanned. Review the fields before saving.');
    } catch (error) {
      console.error(error);
      toast('Could not read the screenshot. You can type the details manually.', 'error');
    } finally {
      setOcrBusy(false);
    }
  };

  const handleDonationSubmit = async (event) => {
    event.preventDefault();
    const amount = Number(donationForm.amount || 0);
    if (!amount || amount < 0) {
      toast('Donation amount is required.', 'error');
      return;
    }

    try {
      await addDonation({
        ...donationForm,
        amount,
        dateRecorded: donationForm.dateRecorded || todayLocalStr(),
      });
      setDonationForm({ ...emptyDonationForm, petId: donationForm.petId });
      toast('Donation recorded.');
    } catch (error) {
      console.error(error);
      toast('Could not save donation.', 'error');
    }
  };

  const getPetName = (petId) => ownPets.find((pet) => pet.id === petId)?.name || 'Unassigned';

  return (
    <>
      <div className="ph">
        <div>
          <h2>Own Pets</h2>
          <p>Personal pet health, vaccines, and GCash donation records.</p>
        </div>
      </div>

      <div className="stats-row own-pets-stats">
        <div className="stat">
          <div className="stat-label">Pets</div>
          <div className="stat-val">{ownPets.length}</div>
          <div className="stat-sub">tracked individually</div>
        </div>
        <div className="stat">
          <div className="stat-label">Sick</div>
          <div className="stat-val">{sickCount}</div>
          <div className="stat-sub">needs monitoring</div>
        </div>
        <div className="stat">
          <div className="stat-label">Vaccines</div>
          <div className="stat-val">{vaccineWatchCount}</div>
          <div className="stat-sub">due or overdue</div>
        </div>
        <div className="stat lime">
          <div className="stat-label">Donations</div>
          <div className="stat-val">{money(totalDonations)}</div>
          <div className="stat-sub">recorded support</div>
        </div>
      </div>

      <div className="own-pets-layout">
        <section className="own-pets-column">
          <form className="card own-pet-form" onSubmit={handlePetSubmit}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PawPrint size={17} /> {editingPetId ? 'Edit Pet' : 'Add Own Pet'}
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Pet Name *</label>
                <input value={petForm.name} onChange={e => setPet({ name: e.target.value })} placeholder="e.g. Rosemarie" />
              </div>
              <div className="fg">
                <label>Type</label>
                <select value={petForm.type} onChange={e => setPet({ type: e.target.value })}>
                  <option>Cat</option>
                  <option>Dog</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Sex</label>
                <select value={petForm.sex} onChange={e => setPet({ sex: e.target.value })}>
                  <option value="">Not set</option>
                  <option>Female</option>
                  <option>Male</option>
                </select>
              </div>
              <div className="fg">
                <label>Color / Markings</label>
                <input value={petForm.color} onChange={e => setPet({ color: e.target.value })} placeholder="e.g. orange tabby" />
              </div>
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Birthday / Estimate</label>
                <input type="date" value={petForm.birthday} onChange={e => setPet({ birthday: e.target.value })} />
              </div>
              <div className="fg">
                <label>Currently Sick</label>
                <select value={petForm.isSick ? 'yes' : 'no'} onChange={e => setPet({ isSick: e.target.value === 'yes' })}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
            {petForm.isSick && (
              <div className="form-row">
                <div className="fg">
                  <label>Sick Since</label>
                  <input type="date" value={petForm.sickStartedAt} onChange={e => setPet({ sickStartedAt: e.target.value })} />
                </div>
                <div className="fg">
                  <label>Sickness Notes</label>
                  <input value={petForm.sicknessNotes} onChange={e => setPet({ sicknessNotes: e.target.value })} placeholder="symptoms, vet, meds" />
                </div>
              </div>
            )}
            <div className="form-row">
              <div className="fg">
                <label>Vaccines Updated</label>
                <select value={petForm.vaccinesUpdated ? 'yes' : 'no'} onChange={e => setPet({ vaccinesUpdated: e.target.value === 'yes' })}>
                  <option value="yes">Yes</option>
                  <option value="no">No / Unsure</option>
                </select>
              </div>
              <div className="fg">
                <label>Last Vaccine</label>
                <input type="date" value={petForm.lastVaccineDate} onChange={e => setPet({ lastVaccineDate: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Upcoming Vaccine</label>
                <input type="date" value={petForm.nextVaccineDate} onChange={e => setPet({ nextVaccineDate: e.target.value })} />
              </div>
              <div className="fg">
                <label>Vaccine Notes</label>
                <input value={petForm.vaccineNotes} onChange={e => setPet({ vaccineNotes: e.target.value })} placeholder="vaccine type / vet" />
              </div>
            </div>
            <div className="fg">
              <label>General Notes</label>
              <textarea value={petForm.notes} onChange={e => setPet({ notes: e.target.value })} placeholder="food, medicine, temperament, rescue details" />
            </div>
            <div className="service-action-row">
              {editingPetId && (
                <button type="button" className="btn btn-ghost" onClick={resetPetForm}>
                  <X size={14} /> Cancel Edit
                </button>
              )}
              <button type="submit" className="btn btn-lime">
                {editingPetId ? <Save size={14} /> : <Plus size={14} />}
                {editingPetId ? 'Save Pet' : 'Add Pet'}
              </button>
            </div>
          </form>

          <div className="own-pet-card-grid">
            {ownPets.length === 0 ? (
              <div className="card" style={{ color: 'var(--gray)' }}>No own pets recorded yet.</div>
            ) : ownPets.map((pet) => {
              const careStatus = getOwnPetCareStatus(pet);
              const petDonations = donationsByPet[pet.id] || 0;
              return (
                <article key={pet.id} className="card own-pet-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700 }}>{pet.name}</div>
                      <div style={{ color: 'var(--gray)', fontSize: '12px', marginTop: '3px' }}>
                        {[pet.type, pet.sex, pet.color].filter(Boolean).join(' - ') || 'Pet profile'}
                      </div>
                    </div>
                    <span style={{ ...statusStyle(careStatus.tone), borderRadius: '999px', padding: '5px 9px', fontSize: '11px', fontWeight: 800 }}>
                      {careStatus.label}
                    </span>
                  </div>

                  <div className="own-pet-detail-grid">
                    <div>
                      <div className="schedule-card-label"><HeartPulse size={12} /> Health</div>
                      <div className="schedule-card-value">
                        {pet.isSick ? `Sick since ${pet.sickStartedAt || 'not set'}` : 'Not marked sick'}
                      </div>
                      {pet.sicknessNotes && <div className="li-sub">{pet.sicknessNotes}</div>}
                    </div>
                    <div>
                      <div className="schedule-card-label"><Syringe size={12} /> Vaccines</div>
                      <div className="schedule-card-value">{pet.vaccinesUpdated ? 'Updated' : 'Needs update'}</div>
                      {pet.nextVaccineDate && <div className="li-sub">Next: {pet.nextVaccineDate}</div>}
                    </div>
                    <div>
                      <div className="schedule-card-label"><CircleDollarSign size={12} /> Donations</div>
                      <div className="schedule-card-total">{money(petDonations)}</div>
                    </div>
                  </div>

                  {pet.notes && <div style={{ color: 'var(--gray)', fontSize: '12px', lineHeight: 1.5, marginTop: '12px' }}>{pet.notes}</div>}
                  <div className="schedule-card-actions">
                    <button type="button" className="btn btn-sm btn-ghost" aria-label={`Edit details for ${pet.name}`} onClick={() => editPet(pet)}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" aria-label={`Delete ${pet.name}`} onClick={() => removeOwnPet(pet.id)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="own-pets-column">
          <form className="card" onSubmit={handleDonationSubmit}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ScanText size={17} /> GCash Donation Screenshot
            </div>
            <div className="fg">
              <label>Screenshot</label>
              <label className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>
                <Upload size={15} />
                {ocrBusy ? 'Scanning...' : 'Upload GCash Screenshot'}
                <input type="file" accept="image/*" onChange={handleDonationScreenshot} style={{ display: 'none' }} />
              </label>
            </div>
            <div className="fg">
              <label>For Pet</label>
              <select value={donationForm.petId} onChange={e => setDonation({ petId: e.target.value })}>
                <option value="">Unassigned / general fund</option>
                {ownPets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Donor Name</label>
                <input value={donationForm.donorName} onChange={e => setDonation({ donorName: e.target.value })} placeholder="from screenshot" />
              </div>
              <div className="fg">
                <label>Amount *</label>
                <NumericInput min={0} value={donationForm.amount} onValueChange={val => setDonation({ amount: val })} placeholder="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="fg">
                <label>GCash Date Text</label>
                <input value={donationForm.rawDate} onChange={e => setDonation({ rawDate: e.target.value })} placeholder="e.g. June 5, 2026 10:42 AM" />
              </div>
              <div className="fg">
                <label>Reference No.</label>
                <input value={donationForm.referenceNumber} onChange={e => setDonation({ referenceNumber: e.target.value.replace(/\D/g, '') })} placeholder="GCash ref" />
              </div>
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Date Recorded</label>
                <input type="date" value={donationForm.dateRecorded} onChange={e => setDonation({ dateRecorded: e.target.value })} />
              </div>
              <div className="fg">
                <label>Screenshot File</label>
                <input value={donationForm.screenshotName} onChange={e => setDonation({ screenshotName: e.target.value })} placeholder="optional" />
              </div>
            </div>
            <div className="fg">
              <label>Notes</label>
              <textarea value={donationForm.notes} onChange={e => setDonation({ notes: e.target.value })} placeholder="medicine, vet bill, food, donor request" />
            </div>
            {donationForm.rawText && (
              <div className="fg">
                <label>OCR Text</label>
                <textarea value={donationForm.rawText} onChange={e => setDonation({ rawText: e.target.value })} />
              </div>
            )}
            <button type="submit" className="btn btn-lime" style={{ width: '100%', justifyContent: 'center' }}>
              <Save size={15} /> Save Donation
            </button>
          </form>

          <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CircleDollarSign size={17} /> Donation Records
            </div>
            {donations.length === 0 ? (
              <div style={{ color: 'var(--gray)' }}>No donations recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {donations.map((donation) => (
                  <div key={donation.id} className="own-donation-row">
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800 }}>{donation.donorName || 'Unknown donor'}</div>
                      <div className="li-sub">
                        {getPetName(donation.petId)} - {donation.rawDate || donation.dateRecorded || 'No date'}
                      </div>
                      {donation.referenceNumber && <div className="li-sub">Ref {donation.referenceNumber}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: '16px' }}>{money(donation.amount)}</div>
                      <button type="button" className="btn btn-xs btn-danger" aria-label={`Delete donation from ${donation.donorName || 'unknown donor'}`} title="Delete donation" onClick={() => removeDonation(donation.id)}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
