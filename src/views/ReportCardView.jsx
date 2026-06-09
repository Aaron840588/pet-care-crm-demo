import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '../store/DataContext';
import { useToast } from '../components/Toast';
import { toPng } from 'html-to-image';
import { Download, Share2, Loader, Image as ImageIcon } from 'lucide-react';
import { todayLocalStr } from '../utils/dates';
import { shareImageFile, downloadImage } from '../utils/share';
import { assertPngDataUrlHasVisibleContent, waitForCaptureReady } from '../utils/imageExport';

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'energy',    label: 'Energy Level',     emoji: '🐾', options: ['Sleepy', 'Calm', 'Playful', 'Zoomies', 'Other'] },
  { id: 'social',    label: 'Sociability',       emoji: '🐱', options: ['Came to greet', 'Needed time', 'Hid', 'Clingy', 'Other'] },
  { id: 'appetite',  label: 'Appetite',          emoji: '🍽️', options: ['Ate all', 'Ate some', 'Ignored', 'Encouragement', 'Other'] },
  { id: 'potty',     label: 'Litter / Potty',   emoji: '🚽', options: ['Normal', 'Slight change', 'Not observed', 'Other'] },
  { id: 'condition', label: 'Condition Today',  emoji: '🩺', options: ['Normal', 'Minor concern', 'See notes', 'Other'] },
];

const MOOD_OPTIONS = [
  '😴 Caught Sleeping', '😁 Caught in 4K', '🎭 Drama Mode', '😇 Perfect Angel',
  '😤 A Bit Judgey', '🤪 Chaos Gremlin', '🥰 Extra Clingy', '😑 Unimpressed', 'Other'
];

const TASKS = [
  { id: 'fed', label: 'Fed', emoji: '🍽️' },
  { id: 'walked', label: 'Walked', emoji: '🦮' },
  { id: 'played', label: 'Played', emoji: '🎾' },
  { id: 'pooped', label: 'Potty Break', emoji: '✅' },
  { id: 'groomed', label: 'Groomed', emoji: '✨' },
  { id: 'meds', label: 'Medicine', emoji: '💊' },
  { id: 'otherTask', label: 'Other', emoji: '📌' },
];

export default function ReportCardView() {
  const { clients, bookings } = useData();
  const toast = useToast();
  const cardRef = useRef(null);
  const bookingHandoffRef = useRef(false);

  const [form, setForm] = useState({
    clientId: '', petNames: '',
    visitDate: todayLocalStr(), sitterName: 'Kat',
    energy: '', social: '', appetite: '', potty: '', condition: '',
    checkedTasks: {}, observations: '', mood: '', message: '',
  });
  const [downloading, setDownloading] = useState(false);
  const [photos, setPhotos] = useState([]);

  const fld = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (bookingHandoffRef.current || bookings.length === 0) return;

    let bookingId = '';
    try {
      bookingId = sessionStorage.getItem('kats_report_booking_id') || '';
    } catch {
      bookingId = '';
    }
    if (!bookingId) return;

    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return;

    const client = clients.find((item) => item.id === booking.clientId);
    if (booking.clientId && !client) return;

    const pets = client?.pets || [];
    const petNames = pets
      .map((pet) => (typeof pet === 'string' ? pet : pet.name || ''))
      .filter(Boolean)
      .join(', ');
    const todayVisit = booking.daySchedule?.find((day) => day.date === todayLocalStr());

    bookingHandoffRef.current = true;
    try {
      sessionStorage.removeItem('kats_report_booking_id');
    } catch {
      // Ignore storage access errors.
    }

    setForm((prev) => ({
      ...prev,
      clientId: booking.clientId || prev.clientId,
      petNames: petNames || prev.petNames,
      visitDate: todayVisit?.date || booking.startDate || prev.visitDate,
      sitterName: prev.sitterName || 'Kat',
    }));
    toast('Report card started from today\'s booking.');
  }, [bookings, clients, toast]);

  // ── Photo handling ────────────────────────────────────────────────────────
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (photos.length + files.length > 4) { toast('Maximum 4 photos.', 'error'); return; }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let w = img.width, h = img.height;
          if (w > MAX) { h = Math.floor(h * MAX / w); w = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          setPhotos(prev => [...prev, canvas.toDataURL('image/jpeg', 0.85)]);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const removePhoto = idx => setPhotos(p => p.filter((_, i) => i !== idx));

  const movePhoto = (idx, dir) => {
    setPhotos(prev => {
      const arr = [...prev];
      if (dir === -1 && idx > 0) {
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      } else if (dir === 1 && idx < arr.length - 1) {
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      }
      return arr;
    });
  };

  // ── Data helpers ──────────────────────────────────────────────────────────
  const selectedClient = clients.find(c => c.id === form.clientId);
  const petMedTasks = React.useMemo(() => {
    if (!selectedClient?.pets?.length) return [];
    const tasks = [];
    selectedClient.pets.forEach(pet => {
      (pet.medications || []).forEach(med => {
        if (med.name) tasks.push({ id: `med-${pet.id}-${med.id}`, label: `${pet.name ? pet.name + ': ' : ''}${med.name}${med.dose ? ' (' + med.dose + ')' : ''}`, emoji: '💊', isMed: true });
      });
    });
    return tasks;
  }, [selectedClient]);
  const allTasks = [...TASKS, ...petMedTasks];

  const toggleTask = id => {
    setForm(prev => {
      const checked = { ...(prev.checkedTasks || {}) };
      if (checked[id]) delete checked[id];
      else { checked[id] = true; }
      return { ...prev, checkedTasks: checked };
    });
  };

  const fmtDate = ds => ds ? new Date(ds + 'T00:00:00').toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '—';
  const checkedTasks = form.checkedTasks || {};

  // ── PNG generation ────────────────────────────────────────────────────────
  const fetchBgBase64 = async () => {
    try {
      const res = await fetch(`${window.location.origin}/invoice-bg.webp`);
      const blob = await res.blob();
      return new Promise(resolve => { const r = new FileReader(); r.onloadend = () => resolve(r.result); r.readAsDataURL(blob); });
    } catch { return ''; }
  };

  const buildReportCaptureNode = useCallback(async (sourceEl) => {
    const bgDataUrl = await fetchBgBase64();
    const captureEl = sourceEl.cloneNode(true);
    const whiteCard = captureEl.querySelector('.rc-white-card');

    captureEl.setAttribute('aria-hidden', 'true');
    captureEl.style.cssText = `
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      display: block !important;
      width: 640px !important;
      max-width: 640px !important;
      min-height: 520px !important;
      padding: 22px 18px !important;
      box-sizing: border-box !important;
      background-color: #d4e84a !important;
      background-size: cover !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
      border-radius: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      opacity: 1 !important;
      transform: none !important;
      visibility: visible !important;
    `;
    captureEl.style.backgroundImage = bgDataUrl ? `url(${bgDataUrl})` : 'none';

    if (whiteCard) {
      whiteCard.style.cssText = `
        background: #fffef8 !important;
        border-radius: 12px !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 28px 24px 24px !important;
        box-shadow: 0 6px 30px rgba(0,0,0,0.18) !important;
        box-sizing: border-box !important;
        margin: 0 !important;
      `;
    }

    document.body.appendChild(captureEl);
    await waitForCaptureReady();
    return captureEl;
  }, []);

  const renderReportPng = useCallback(async () => {
    const el = cardRef.current;
    if (!el) return null;

    const captureEl = await buildReportCaptureNode(el);

    try {
      const dataUrl = await toPng(captureEl, {
        pixelRatio: 2,
        backgroundColor: '#d4e84a',
        cacheBust: true,
        skipFonts: true,
        width: 640,
        height: Math.ceil(captureEl.scrollHeight),
      });
      await assertPngDataUrlHasVisibleContent(dataUrl, 'Report card image');
      return dataUrl;
    } finally {
      captureEl.remove();
    }
  }, [buildReportCaptureNode]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const dataUrl = await renderReportPng();
      if (!dataUrl) return;
      downloadImage(dataUrl, `ReportCard_${selectedClient?.name || form.petNames || 'Visit'}_${form.visitDate}.png`);
      toast('✅ Report card saved!');
    } catch { toast('Download failed.', 'error'); }
    finally { setDownloading(false); }
  }, [form, selectedClient, toast, renderReportPng]);

  const handleShare = useCallback(async () => {
    setDownloading(true);
    try {
      const dataUrl = await renderReportPng();
      if (!dataUrl) return;
      const name = `ReportCard_${selectedClient?.name || form.petNames || 'Visit'}_${form.visitDate}.png`;
      const result = await shareImageFile(dataUrl, name);
      if (result === 'shared') toast('✅ Shared!');
      else { downloadImage(dataUrl, name); toast('Saved instead.'); }
    } catch { toast('Share failed.', 'error'); }
    finally { setDownloading(false); }
  }, [form, selectedClient, toast, renderReportPng]);

  // photo[0] = pet photo (top), photos[1..] = mood photos
  const petPhoto = photos[0] || null;
  const moodPhotos = photos.slice(1);

  // ── Preview option chip ───────────────────────────────────────────────────
  const PreviewChip = ({ label, selected }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '3px 9px', borderRadius: '100px', fontSize: '10px',
      fontWeight: selected ? 700 : 400, fontFamily: 'Inter, sans-serif',
      border: selected ? '2px solid #7a9a20' : '1px solid #ddd',
      background: selected ? '#f0fce0' : 'transparent',
      color: selected ? '#4a7010' : '#bbb',
    }}>
      {label}{selected ? ' ✓' : ''}
    </span>
  );

  return (
    <div>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap" rel="stylesheet" />

      {/* ── PAGE HEADER ── */}
      <div className="ph">
        <div>
          <h2>Visit Report Card</h2>
          <p>Generate a cute pet check-up report to send the owner</p>
        </div>
        <div className="ph-actions" style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={handleDownload} disabled={downloading} className="btn btn-lime">
            {downloading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Download size={16} /> Save</>}
          </button>
          <button type="button" onClick={handleShare} disabled={downloading} className="btn btn-dark">
            <Share2 size={15} /> Share
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start', maxWidth: '1100px' }} className="report-grid">

        {/* ══ LEFT: FORM ══ */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', marginBottom: '18px' }}>📋 Visit Details</div>

          <div className="fg" style={{ marginBottom: '12px' }}>
            <label>Client</label>
            <select value={form.clientId} onChange={e => {
              fld('clientId', e.target.value);
              fld('petNames', '');
            }} style={{ width: '100%', minHeight: '44px', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px' }}>
              <option value="">— Select a client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Individual pet picker */}
          {selectedClient?.pets?.length > 0 && (
            <div className="fg" style={{ marginBottom: '12px' }}>
              <label>Which Pet is This Report For?</label>
              <select
                value={form.petNames}
                onChange={e => fld('petNames', e.target.value)}
                style={{ width: '100%', minHeight: '44px', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="">— Select a pet —</option>
                {selectedClient.pets.length > 1 && (
                  <option value={selectedClient.pets.map((p) => typeof p === 'string' ? p : p.name).filter(Boolean).join(', ')}>
                    All pets
                  </option>
                )}
                {selectedClient.pets.map((p, i) => {
                  const name = typeof p === 'string' ? p : p.name;
                  return <option key={i} value={name}>{name}</option>;
                })}
              </select>
            </div>
          )}

          {/* Manual pet name (fallback if no pets on client) */}
          {(!selectedClient?.pets?.length) && (
            <div className="fg" style={{ marginBottom: '12px' }}>
              <label>Pet Name</label>
              <input value={form.petNames || ''} onChange={e => fld('petNames', e.target.value)} placeholder="e.g. Coco" />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div className="fg"><label>Visit Date</label><input type="text" value={form.visitDate || ''} onChange={e => fld('visitDate', e.target.value)} placeholder="e.g. April 12-14" /></div>
            <div className="fg"><label>Sitter Name</label><input value={form.sitterName || ''} onChange={e => fld('sitterName', e.target.value)} /></div>
          </div>

          {/* Photos */}
          <div className="fg" style={{ marginBottom: '16px' }}>
            <label>Upload Photos — 1st = Pet Profile, 2nd+ = Mood Photos (Max 4)</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8f8f8', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 14px', cursor: photos.length >= 4 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600, color: '#444', marginTop: '4px', opacity: photos.length >= 4 ? 0.6 : 1 }}>
              <ImageIcon size={16} /> {photos.length >= 4 ? 'Max Reached' : `Choose Photos… (${photos.length}/4)`}
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} style={{ display: 'none' }} disabled={photos.length >= 4} />
            </label>
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                {photos.map((p, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-8px', left: '-4px', background: idx === 0 ? '#7a9a20' : '#888', color: '#fff', fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', zIndex: 1 }}>{idx === 0 ? 'PROFILE' : `MOOD ${idx}`}</div>
                    <img src={p} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: idx === 0 ? '2px solid #7a9a20' : '1px solid #ccc', display: 'block' }} alt="" />
                    <button onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', zIndex: 2 }}>×</button>
                    <div style={{ position: 'absolute', bottom: '2px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {idx > 0 && <button type="button" onClick={() => movePhoto(idx, -1)} style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '10px' }}>&lt;</button>}
                      {idx < photos.length - 1 && <button type="button" onClick={() => movePhoto(idx, 1)} style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '10px' }}>&gt;</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Behavioral Assessment */}
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#555', marginBottom: '8px' }}>Behavioral Assessment</div>
          <div style={{ background: '#fafaf8', borderRadius: '12px', border: '1.5px solid #eee', marginBottom: '16px', overflow: 'hidden' }}>
            {CATEGORIES.map((cat, i) => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '10px', borderBottom: i < CATEGORIES.length - 1 ? '1px solid #eee' : 'none' }}>
                <span style={{ fontSize: '18px', width: '26px', flexShrink: 0, textAlign: 'center' }}>{cat.emoji}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#555', width: '100px', flexShrink: 0, lineHeight: 1.3 }}>{cat.label}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', flex: 1 }}>
                  {cat.options.map(opt => (
                    <button key={opt} type="button" onClick={() => fld(cat.id, form[cat.id] === opt ? '' : opt)} style={{
                      padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: form[cat.id] === opt ? 700 : 500,
                      border: form[cat.id] === opt ? '2px solid #7a9a20' : '1.5px solid #ddd',
                      background: form[cat.id] === opt ? '#f0fce0' : '#fff', color: form[cat.id] === opt ? '#4a7010' : '#999',
                      cursor: 'pointer', transition: 'all .15s', outline: 'none',
                    }}>
                      {opt}{form[cat.id] === opt ? ' ✓' : ''}
                    </button>
                  ))}
                  {form[cat.id] === 'Other' && (
                    <input type="text" placeholder="Specify..." value={form[cat.id + '_other'] || ''} onChange={e => fld(cat.id + '_other', e.target.value)} style={{ padding: '0 8px', fontSize: '11px', borderRadius: '8px', border: '1.5px solid #7a9a20', background: '#f0fce0', outline: 'none' }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Notable Observations */}
          <div className="fg" style={{ marginBottom: '14px' }}>
            <label>📝 Notable Observations</label>
            <textarea value={form.observations || ''} onChange={e => fld('observations', e.target.value)}
              placeholder={`e.g. "Kept scratching right ear intermittently"`} rows={2}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
          </div>

          {/* Today's Mood */}
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#555', marginBottom: '8px' }}>📸 Today's Mood</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {MOOD_OPTIONS.map(m => (
              <button key={m} type="button" onClick={() => fld('mood', form.mood === m ? '' : m)} style={{
                padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: form.mood === m ? 700 : 500,
                border: form.mood === m ? '2px solid #7a9a20' : '1.5px solid #ddd',
                background: form.mood === m ? '#f0fce0' : '#fafafa', color: form.mood === m ? '#4a7010' : '#888',
                cursor: 'pointer', transition: 'all .15s',
              }}>{m}</button>
            ))}
            {form.mood === 'Other' && (
              <input type="text" placeholder="Specify mood..." value={form.mood_other || ''} onChange={e => fld('mood_other', e.target.value)} style={{ padding: '0 10px', fontSize: '12px', borderRadius: '100px', border: '2px solid #7a9a20', background: '#f0fce0', outline: 'none' }} />
            )}
          </div>

          {/* Tasks */}
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#555', marginBottom: '8px' }}>Tasks Completed</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            {allTasks.map(t => (
              <button key={t.id} type="button" onClick={() => toggleTask(t.id)} style={{
                display: 'flex', gap: '6px', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                border: checkedTasks[t.id] ? '2px solid var(--lime-dark)' : '1.5px solid #eee',
                background: checkedTasks[t.id] ? (t.isMed ? '#f0eeff' : '#f0fce8') : '#fafafa',
                fontWeight: 600, fontSize: '12px', transition: 'all .15s', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                  <span>{t.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{t.label}</span>
                  {checkedTasks[t.id] && <span style={{ color: t.isMed ? '#7c3aed' : 'var(--lime-dark)' }}>✓</span>}
                </div>
              </button>
            ))}
            {checkedTasks['otherTask'] && (
              <input type="text" placeholder="Specify other task..." value={form.otherTaskNote || ''} onChange={e => fld('otherTaskNote', e.target.value)} style={{ gridColumn: '1 / -1', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #99dd88', background: '#e8fce4', fontSize: '12px', marginTop: '-6px' }} />
            )}
          </div>

          {/* Personal Message */}
          <div className="fg">
            <label>Personal Message to Owner</label>
            <textarea value={form.message || ''} onChange={e => fld('message', e.target.value)}
              placeholder="e.g. All good today, nothing concerning ♡" rows={2}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '13px', resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* ══ RIGHT: LIVE PREVIEW ══ */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#999', marginBottom: '10px', textAlign: 'center' }}>
            Preview — downloads as PNG
          </div>

          {/* Outer: yellow cat doodle bg */}
          <div ref={cardRef} className="rc-preview-outer" style={{
            width: '640px', maxWidth: '640px', margin: '0 auto', padding: '22px 20px',
            boxSizing: 'border-box',
            background: '#d4e84a url(/invoice-bg.webp) center/cover no-repeat',
            borderRadius: '20px', minHeight: '480px',
          }}>
            {/* White clipboard card */}
            <div className="rc-white-card" style={{
              background: '#fffef8', borderRadius: '12px', width: '100%',
              padding: '24px 20px 20px', boxShadow: '0 6px 30px rgba(0,0,0,0.18)', boxSizing: 'border-box',
            }}>

              {/* ── HEADER ── */}
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '28px', fontWeight: 900, color: '#111', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  ♡ PET CHECK-UP REPORT ♡
                </div>
                <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '13px', fontStyle: 'italic', color: '#777', marginTop: '4px' }}>
                  Kat&apos;s Pet-Sitting Services
                </div>
              </div>

              {/* ── PET PROFILE ROW ── */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1.5px dashed #e0dcc8' }}>
                {/* Pet photo — bigger */}
                <div style={{ width: '160px', height: '160px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0, border: '3px solid #b8d060', background: '#f5f5e8', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  {petPhoto
                    ? <img src={petPhoto} alt="Pet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', flexDirection: 'column', gap: '4px' }}>
                        <span>🐱</span>
                        <span style={{ fontSize: '8px', color: '#ccc', fontFamily: 'Inter, sans-serif' }}>Upload photo</span>
                      </div>
                  }
                </div>
                {/* Pet info */}
                <div style={{ flex: 1, fontFamily: 'Inter, sans-serif', paddingTop: '4px' }}>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#111', marginBottom: '4px' }}>
                    {form.petNames || <span style={{ color: '#ccc' }}>Pet Name</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>{fmtDate(form.visitDate)}</div>
                  <div style={{ fontSize: '11px', color: '#777', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div>Visit Date: {fmtDate(form.visitDate)}</div>
                    <div>Sitter: {form.sitterName}</div>
                    {selectedClient?.name && <div style={{ color: '#bbb' }}>Owner: {selectedClient.name}</div>}
                  </div>
                </div>
              </div>

              {/* ── BEHAVIORAL ROWS ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                {CATEGORIES.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderRadius: '8px', background: '#f9f9f2', border: '1px solid #ebebdc', gap: '8px' }}>
                    <span style={{ fontSize: '14px', width: '20px', flexShrink: 0 }}>{cat.emoji}</span>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#888', letterSpacing: '.5px', textTransform: 'uppercase', width: '65px', flexShrink: 0, lineHeight: 1.2 }}>{cat.label}:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', overflow: 'visible', gap: '4px', flex: 1, whiteSpace: 'normal' }}>
                      {cat.options.map(opt => <PreviewChip key={opt} label={opt === 'Other' && form[cat.id] === 'Other' ? (form[cat.id + '_other'] || 'Other') : opt} selected={form[cat.id] === opt} />)}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── NOTABLE OBSERVATIONS ── */}
              <div style={{ background: '#f9f9f0', border: '1px dashed #c8c890', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '5px' }}>Notable Observations:</div>
                <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.6, fontStyle: form.observations ? 'normal' : 'italic' }}>
                  {form.observations
                    ? <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc' }}>{form.observations.split('\n').filter(l => l.trim()).map((line, i) => <li key={i}>{line}</li>)}</ul>
                    : <span style={{ color: '#ccc' }}>No special observations</span>
                  }
                </div>
              </div>

              {/* ── TODAY'S MOOD ── */}
              {(form.mood || moodPhotos.length > 0 || Object.keys(checkedTasks).length > 0) && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Today's Mood
                  </div>
                  {form.mood && (
                    <div style={{ background: '#f5f9e8', border: '1px solid #d4e090', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#333', fontFamily: 'Inter, sans-serif' }}>{form.mood === 'Other' && form.mood_other ? form.mood_other : form.mood}</div>
                    </div>
                  )}
                  {moodPhotos.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                      {moodPhotos.map((mp, idx) => (
                        <div key={idx} style={{ flex: moodPhotos.length === 1 ? '1 1 100%' : '0 1 calc(50% - 4px)' }}>
                          <img src={mp} alt={`Mood ${idx + 1}`} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: '10px', border: '2px solid #b8d060', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {Object.keys(checkedTasks).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {allTasks.filter(t => checkedTasks[t.id]).map(t => (
                        <span key={t.id} style={{ fontSize: '9px', background: t.isMed ? '#f0eeff' : '#e8fce4', border: `1px solid ${t.isMed ? '#c4b5fd' : '#99dd88'}`, borderRadius: '6px', padding: '3px 7px', fontWeight: 700, color: t.isMed ? '#5b21b6' : '#2a7a20', fontFamily: 'Inter, sans-serif' }}>
                          {t.emoji} {t.id === 'otherTask' && form.otherTaskNote ? form.otherTaskNote : t.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── FOOTER ── */}
              <div style={{ borderTop: '1.5px dashed #e0dcc8', paddingTop: '12px', textAlign: 'center' }}>
                {form.message && (
                  <div style={{ fontSize: '11px', color: '#555', fontStyle: 'italic', fontFamily: 'Inter, sans-serif', marginBottom: '10px' }}>
                    {form.message}
                  </div>
                )}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#F5F882', borderRadius: '100px', padding: '7px 20px', fontWeight: 800, fontSize: '12px', color: '#333', fontFamily: 'Inter, sans-serif' }}>
                  Cared for by {form.sitterName} 🐾
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .report-grid {
            grid-template-columns: 1fr !important;
            max-width: 100% !important;
          }

          .report-grid > div {
            min-width: 0 !important;
            width: 100% !important;
          }

          .rc-preview-outer {
            width: 100% !important;
            max-width: 640px !important;
            padding: 18px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
