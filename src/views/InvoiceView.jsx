import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../store/DataContext';
import ConfirmDialog from '../components/ConfirmDialog';
import NumericInput from '../components/NumericInput';
import { useToast } from '../components/Toast';
import { toPng } from 'html-to-image';
import { Plus, Trash2, ClipboardList, Share2 } from 'lucide-react';
import { shareImageFile, downloadImage } from '../utils/share';
import { calcDayDiscount, calcLine, DISC_MODES, newLineItem, EXTRA_PET_RATE } from '../utils/calculations';
import { buildDateNote, groupImportedLineItems, buildSingleDayInvoiceLines } from '../utils/invoiceLogic';
import { sortInvoiceImportBookings } from '../utils/bookingOrdering.mjs';
import { escapeHtml } from '../utils/htmlEscape.mjs';
import { fmtGcash, todayLocalStr, fmtDate } from '../utils/dates';
import { assertPngDataUrlHasVisibleContent, waitForCaptureReady } from '../utils/imageExport';

// ── Struck: renders a strikethrough that html-to-image can capture ───────────
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

const PREVIEW_CARD_WIDTH = 460;
const INVOICE_CAPTURE_WIDTH = 440;

export default function InvoiceView() {
  const { clients, bookings, addInvoice, errands = [], updateErrand } = useData();
  const toast  = useToast();
  const invoiceRef = useRef(null);
  const bookingHandoffRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const [data, setData] = useState({
    gcash:    '0917-000-0000',
    clientId: '',
    toName:   '',
    pets:     '',
    paid:     0,
    tip:      0,
  });

  const [lineItems, setLineItems]         = useState([newLineItem()]);
  const [importBookingId, setImportBookingId] = useState('');

  // Auto-fill name + pets when client changes
  useEffect(() => {
    if (!data.clientId) return;
    const c = clients.find(x => x.id === data.clientId);
    if (c) setData(p => ({
      ...p,
      toName: c.name,
      pets: c.pets ? c.pets.map(pp => typeof pp === 'string' ? pp : pp.name).join(', ') : '',
    }));
  }, [data.clientId, clients]);

  
  const unbilledErrands = useMemo(() => {
    if (!data.clientId) return [];
    return errands.filter(e => e.clientId === data.clientId && e.amount > 0 && !e.isBilled && e.status !== 'done');
  }, [data.clientId, errands]);

  const handleImportErrands = useCallback(() => {
    if (unbilledErrands.length === 0) return;
    const newLines = unbilledErrands.map(e => ({
      ...newLineItem(),
      customName: e.title || 'Errands / Pabili',
      customRate: '', // Rate left empty for Errands per user request
      days: 1,
      _errandId: e.id,
      isErrand: true,
      amount: e.amount, // Force amount, ignoring rate * days
      items: e.items && e.items.length > 0 ? e.items : []
    }));
    setLineItems(p => {
      // If the only line is empty, replace it
      if (p.length === 1 && !p[0].customName && !p[0].customRate) return newLines;
      return [...p, ...newLines];
    });
    toast('Added ' + unbilledErrands.length + ' errands to invoice line items.');
  }, [unbilledErrands, toast]);

  
  const importedErrandCount = lineItems.filter(li => li._errandId).length;

  const handleClearErrands = useCallback(() => {
    setLineItems(p => {
      const filtered = p.filter(li => !li._errandId);
      return filtered.length > 0 ? filtered : [newLineItem()];
    });
    toast('Removed imported errands from invoice.');
  }, [toast]);

  // ── Import from booking ────────────────────────────────────────────────────
  const importFromBooking = useCallback((id) => {
    setImportBookingId(id);
    if (!id) return;
    const b = bookings.find(x => x.id === id);
    if (!b) return;
    const c = clients.find(x => x.id === b.clientId);

    setData(p => ({
      ...p,
      clientId: b.clientId || '',
      toName:   b.clientName || c?.name || '',
      pets:     c?.pets ? c.pets.map(pp => typeof pp === 'string' ? pp : pp.name).join(', ') : '',
    }));

    if (b.daySchedule?.length > 0) {
      const days  = b.daySchedule;
      const hasPerDayDiscounts = days.some(day => calcDayDiscount(day) > 0);
      const groupedLines = groupImportedLineItems(days.flatMap(buildSingleDayInvoiceLines));

      if (hasPerDayDiscounts) {
        setLineItems(groupedLines.length > 0 ? groupedLines : [newLineItem()]);
        return;
      }

      const lines = groupedLines.map((line) => ({ ...line }));

      // Apply booking discount
      const disc = b.discount;
      if (disc?.mode && disc.mode !== 'none' && Number(disc.value) > 0 && lines.length > 0) {
        const targetType = disc.appliesTo || 'service';
        let targetIdx = lines.findIndex(l => l._itemType === targetType);
        if (targetIdx === -1) targetIdx = 0; // fallback to first line if target not found
        
        lines[targetIdx] = { 
          ...lines[targetIdx], 
          discountMode: disc.mode, 
          discountValue: disc.value, 
          discountLabel: disc.label || 'Discount' 
        };
      }

      setLineItems(lines.length > 0 ? lines : [newLineItem()]);
    } else {
      // Legacy single-service import
      const svcName  = b.service?.split('|')[0] || '';
      const svcPrice = Number(b.service?.split('|')[1] || 0);
      const dateNote = b.startDate && b.endDate ? buildDateNote([b.startDate, b.endDate]) : '';
      const disc     = b.discount;
      const targetType = disc?.appliesTo || 'service';

      const lines = [{
        ...newLineItem(),
        customName:    svcName,
        subtitle:      '(up to 2 pets)',
        days:          b.days || 1,
        note:          dateNote,
        customRate:    String(svcPrice),
        discountMode:  targetType === 'service' && disc?.mode !== 'none' ? disc?.mode || 'none' : 'none',
        discountValue: targetType === 'service' ? disc?.value || 0 : 0,
        discountLabel: targetType === 'service' ? disc?.label || '' : '',
      }];

      if (b.extraPets > 0) {
        const epRate = b.extraPets * EXTRA_PET_RATE;
        lines.push({ 
          ...newLineItem(), 
          customName: `Additional +${b.extraPets} Pet${b.extraPets !== 1 ? 's' : ''}`, 
          subtitle: `(₱${EXTRA_PET_RATE}/add'l pet = ₱${epRate})`, 
          days: b.days || 1, 
          note: dateNote, 
          customRate: String(epRate),
          discountMode:  targetType === 'extraPets' && disc?.mode !== 'none' ? disc?.mode || 'none' : 'none',
          discountValue: targetType === 'extraPets' ? disc?.value || 0 : 0,
          discountLabel: targetType === 'extraPets' ? disc?.label || '' : '',
        });
      }
      setLineItems(lines);
    }
  }, [bookings, clients]);

  useEffect(() => {
    if (bookingHandoffRef.current || bookings.length === 0) return;

    let bookingId = '';
    try {
      bookingId = sessionStorage.getItem('kats_invoice_booking_id') || '';
    } catch {
      bookingId = '';
    }
    if (!bookingId) return;

    const bookingExists = bookings.some((booking) => booking.id === bookingId);
    if (!bookingExists) return;

    bookingHandoffRef.current = true;
    try {
      sessionStorage.removeItem('kats_invoice_booking_id');
    } catch {
      // Ignore storage access errors.
    }
    importFromBooking(bookingId);
    toast('Invoice draft started from today\'s booking.');
  }, [bookings, importFromBooking, toast]);

  const setLine = useCallback(
    (id, patch) => setLineItems(p => p.map(li => li.id === id ? { ...li, ...patch } : li)),
    []
  );

  // Totals — memoized
  const { lineCalcs, grandTotal, fullTotal, balance } = useMemo(() => {
    const calcs = lineItems.map(calcLine);
    const grand = calcs.reduce((s, c) => s + c.finalAmount, 0);
    const full  = calcs.reduce((s, c) => s + c.baseAmount, 0);
    // B5/BL2: balance can never be negative
    const bal   = Math.max(0, grand - Number(data.paid || 0));
    return { lineCalcs: calcs, grandTotal: grand, fullTotal: full, balance: bal };
  }, [lineItems, data.paid]);

  // B6/CQ9: async save with error handling
  const handleSave = useCallback(async () => {
    if (!data.toName) {
      toast('Please set a client name before saving.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await addInvoice({
        dateSaved:       todayLocalStr(),
        clientId:        data.clientId || null, // U10: for revenue attribution
        gcash:           data.gcash,
        toName:          data.toName,
        pets:            data.pets,
        baseServiceName: lineItems.map(l => l.customName).filter(Boolean).join(', '),
        total:           Math.round(grandTotal * 100) / 100,
        paid:            Number(data.paid || 0),
        tip:             Number(data.tip  || 0),
        
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

      toast('✅ Invoice saved to records!');
    } catch (err) {
      console.error(err);
      toast('❌ Failed to save. Check your connection.', 'error');
    } finally {
      setSaving(false);
    }
  }, [data, lineItems, grandTotal, addInvoice, toast, updateErrand]);

  const fetchBgBase64 = async () => {
    try {
      const res = await fetch(`${window.location.origin}/invoice-bg.webp`);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Failed to fetch bg base64", e);
      return '';
    }
  };

  // Keep the capture node paintable; mobile browsers can skip negative-z/offscreen DOM.
  const buildInvoiceCaptureNode = useCallback(async (sourceEl) => {
    const bgDataUrl = await fetchBgBase64();
    const captureEl = sourceEl.cloneNode(true);
    const whiteCard = captureEl.querySelector('.inv-white-card');

    captureEl.setAttribute('aria-hidden', 'true');
    captureEl.style.cssText = `
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      display: block !important;
      width: ${INVOICE_CAPTURE_WIDTH}px !important;
      max-width: ${INVOICE_CAPTURE_WIDTH}px !important;
      min-height: 520px !important;
      padding: 16px 12px !important;
      box-sizing: border-box !important;
      background-color: #eef0d8 !important;
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
        background: #fff !important;
        border-radius: 16px !important;
        width: 100% !important;
        max-width: 100% !important;
        padding: 28px 20px 24px !important;
        box-shadow: 0 4px 24px rgba(0,0,0,0.10) !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        flex: none !important;
      `;
    }

    document.body.appendChild(captureEl);
    await waitForCaptureReady();
    return captureEl;
  }, []);

  const renderInvoicePng = useCallback(async () => {
    const el = invoiceRef.current;
    if (!el) return null;

    const captureEl = await buildInvoiceCaptureNode(el);

    // Set background-image separately — base64 data URLs contain semicolons
    // that break CSS parsing when embedded in cssText
    try {
      const dataUrl = await toPng(captureEl, {
        pixelRatio: 2,
        backgroundColor: '#eef0d8',
        cacheBust: true,
        skipFonts: true,
        width: INVOICE_CAPTURE_WIDTH,
        height: Math.ceil(captureEl.scrollHeight),
      });
      await assertPngDataUrlHasVisibleContent(dataUrl, 'Invoice image');
      return dataUrl;
    } finally {
      captureEl.remove();
    }
  }, [buildInvoiceCaptureNode]);

  // Download using html-to-image (pixel-perfect replication)
  const handleDownload = useCallback(async () => {
    if (!invoiceRef.current) return;
    try {
      const dataUrl = await renderInvoicePng();
      if (!dataUrl) return;

      const filename = `Invoice_${data.toName || 'Kat'}_${todayLocalStr()}.png`;
      downloadImage(dataUrl, filename);
      toast('✅ Invoice saved to gallery!');
    } catch (err) {
      console.error(err);
      toast('Download failed. Try again.', 'error');
    }
  }, [data.toName, toast, renderInvoicePng]);

  // Share using native share sheet (WhatsApp, Messenger, etc.)
  const handleShare = useCallback(async () => {
    if (!invoiceRef.current) return;
    try {
      const dataUrl = await renderInvoicePng();
      if (!dataUrl) return;

      const filename = `Invoice_${data.toName || 'Kat'}_${todayLocalStr()}.png`;
      const result = await shareImageFile(dataUrl, filename);
      if (result === 'shared') toast('✅ Invoice shared!');
      else if (result === 'unsupported') {
        downloadImage(dataUrl, filename);
        toast('Share not available — saved to gallery instead.');
      }
    } catch (err) {
      console.error(err);
      toast('Share failed. Try again.', 'error');
    }
  }, [data.toName, toast, renderInvoicePng]);


  // CB5: print only the invoice area
  const handlePrint = useCallback(() => {
    const el = invoiceRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=1100,height=980');
    if (!win) return;
    const styleMarkup = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    win.document.write(`
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Invoice — ${escapeHtml(data.toName || 'Kat')}</title>
        ${styleMarkup}
        <style>
          @page { margin: 0; }
          body {
            margin: 0;
            background: #fcff63;
            display: flex;
            justify-content: center;
            padding: 24px;
          }
          .inv-preview-outer {
            width: ${PREVIEW_CARD_WIDTH}px !important;
            max-width: ${PREVIEW_CARD_WIDTH}px !important;
            min-height: auto !important;
            padding: 24px 16px !important;
            box-sizing: border-box !important;
            background-size: cover !important;
            overflow: visible !important;
          }
          .inv-white-card {
            width: 100% !important;
            max-width: 100% !important;
            padding: 48px 44px 44px !important;
          }
        </style>
      </head>
      <body>${el.outerHTML}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }, [data.toName]);

  // U7: confirm before reset
  const handleReset = useCallback(() => {
    if (lineItems.length > 1 || lineItems[0].customName || lineItems[0].customRate) {
      setConfirmResetOpen(true);
      return;
    }
    setData({ gcash: '0917-000-0000', clientId: '', toName: '', pets: '', paid: 0, tip: 0 });
    setLineItems([newLineItem()]);
    setImportBookingId('');
  }, [lineItems]);

  const confirmReset = useCallback(() => {
    setData({ gcash: '0917-000-0000', clientId: '', toName: '', pets: '', paid: 0, tip: 0 });
    setLineItems([newLineItem()]);
    setImportBookingId('');
    setConfirmResetOpen(false);
  }, []);

  const sortedImportBookings = useMemo(
    () => sortInvoiceImportBookings(bookings),
    [bookings]
  );

  const getBookingOptionLabel = useCallback((booking) => {
    const serviceNames = booking.daySchedule?.length > 0
      ? [...new Set(booking.daySchedule.map((day) => day.service?.split('|')[0]).filter(Boolean))]
      : [];
    const serviceLabel = serviceNames.length > 0
      ? serviceNames.join(' + ')
      : booking.service?.split('|')[0] || 'Booking';
      
    const dateLabel = booking.startDate && booking.endDate
      ? `${fmtDate(booking.startDate)}${booking.startDate !== booking.endDate ? ` to ${fmtDate(booking.endDate)}` : ''}`
      : 'No date';
      
    const total = Number(booking.total ?? booking.finalTotal ?? 0);

    return `${dateLabel} — ${serviceLabel} (₱${total.toLocaleString('en-PH')})`;
  }, []);

  return (
    <>
      {/* ── Invoice CSS (moved to inline styles for CB4 compatibility) ── */}
      <style>{`
        /* ── INVOICE OUTER WRAPPER ─────────────────────────────────────────── */
        .inv-preview-outer {
          width: min(100%, ${PREVIEW_CARD_WIDTH}px);
          max-width: ${PREVIEW_CARD_WIDTH}px;
          min-height: 520px;
          background-color: #eef0d8;
          background-image: url('/invoice-bg.webp');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 28px 14px;
          border-radius: 16px;
          box-sizing: border-box;
          margin: 0 auto;
          overflow-x: hidden;
          overflow-y: visible;
        }

        .inv-white-card {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: ${PREVIEW_CARD_WIDTH}px;
          padding: 36px 28px 32px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.10);
          box-sizing: border-box;
          flex: 0 0 auto;
        }

        /* ── HEADER TYPOGRAPHY ─────────────────────────────────────────────── */
        .inv-h1 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 44px; font-weight: 900; text-align: center;
          margin: 0; color: #111; line-height: 1.05; letter-spacing: -0.5px;
        }
        .inv-sub {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px; font-style: italic; text-align: center;
          color: #555; margin: 5px 0 16px;
        }

        /* GCash pill — clean yellow, subtle */
        .inv-gcash-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fcff63;
          border-radius: 100px;
          padding: 7px 18px;
          line-height: 1;
          font-weight: 700; font-size: 14px;
          color: #111; font-family: Inter, sans-serif;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
          letter-spacing: 0.01em;
          box-sizing: border-box;
        }

        /* ── INVOICE TO ────────────────────────────────────────────────────── */
        .inv-to-label {
          font-size: 10.5px; font-weight: 800; font-family: Inter, sans-serif;
          letter-spacing: 1.8px; text-transform: uppercase;
          color: #666; margin: 24px 0 6px;
          padding-bottom: 6px; border-bottom: 1px solid #efefef;
        }
        .inv-to-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 17px; color: #111; margin-bottom: 3px; font-weight: 700;
        }
        .inv-to-pets {
          font-family: Inter, sans-serif;
          font-size: 13px; color: #777; margin-bottom: 20px; line-height: 1.5;
        }

        /* ── TABLE ─────────────────────────────────────────────────────────── */
        .inv-tbl {
          width: 100%; border-collapse: collapse;
          font-family: Inter, sans-serif; table-layout: fixed;
        }

        /* Lighter header — text-based, not heavy block */
        .inv-tbl-head td {
          background: #f5f5f3;
          color: #666;
          font-weight: 700; font-size: 11px; letter-spacing: 1.6px;
          text-transform: uppercase; padding: 9px 8px;
          text-align: left;
          border-bottom: 1.5px solid #ddd;
        }

        /* Rows with subtle separators */
        .inv-tbl-row td {
          padding: 14px 8px; text-align: left;
          border-bottom: 1px solid #f2f2f0;
          font-size: 14px; color: #333; vertical-align: top;
        }
        .inv-tbl-row:last-child td { border-bottom: none; }

        /* Columns */
        .inv-col-service { width: 50%; }
        .inv-col-days    { width: 12%; text-align: center !important; }
        .inv-col-rate    { width: 18%; text-align: right !important; }
        .inv-col-amount  { width: 20%; text-align: right !important; }

        /* Service text hierarchy */
        .inv-svc-name { font-size: 14px; font-weight: 600; line-height: 1.35; color: #111; }
        .inv-svc-sub  { font-size: 11px; color: #666; margin-top: 2px; font-style: italic; }
        .inv-day-note { font-size: 10.5px; color: #888; margin-top: 4px; line-height: 1.4; }
        .inv-svc-name, .inv-svc-sub, .inv-day-note, .inv-disc-lbl { overflow-wrap: anywhere; }
        .inv-day-count { font-weight: 700; color: #111; font-variant-numeric: tabular-nums; }
        .inv-col-rate, .inv-col-amount { white-space: nowrap; font-variant-numeric: tabular-nums; }

        /* Discount — de-emphasized */
        .inv-price-del {
          display: block; text-decoration: line-through;
          color: #ccc; font-size: 10px; margin-bottom: 1px;
        }
        .inv-disc-lbl {
          font-size: 10px; color: #d06060; font-style: italic;
          font-weight: 600; display: block; margin-top: 3px;
        }
        .inv-amt-del {
          display: block; text-decoration: line-through;
          color: #ccc; font-size: 10px; margin-bottom: 1px;
        }
        /* Final amounts are always bold and clearly visible */
        .inv-final-amt { font-weight: 700; color: #111; }

        /* ── TOTALS ─────────────────────────────────────────────────────────── */
        .inv-total-line {
          text-align: right; font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px; font-weight: 900; color: #111;
          padding: 18px 0 14px; margin-top: 4px;
          border-top: 1.5px solid #111;
        }

        .inv-summary-boxes { display: flex; flex-direction: column; align-items: flex-end; gap: 7px; }

        .inv-paid-row {
          display: inline-flex; justify-content: space-between; align-items: center;
          background: #fafafa; border: 1px solid #eee;
          padding: 9px 14px; border-radius: 7px; width: 190px; box-sizing: border-box;
          font-family: Inter, sans-serif; font-weight: 600; font-size: 13px; color: #555;
        }
        .inv-balance-row {
          display: inline-flex; justify-content: space-between; align-items: center;
          background: #111; padding: 10px 14px; border-radius: 7px; width: 190px; box-sizing: border-box;
          font-family: Inter, sans-serif; font-weight: 700; font-size: 14px; color: #fff;
        }
        .inv-tip-row {
          display: inline-flex; justify-content: space-between; align-items: center;
          background: #fffce8; border: 1px solid #e8d800;
          padding: 8px 14px; border-radius: 7px; width: 190px; box-sizing: border-box;
          font-family: Inter, sans-serif; font-weight: 600; font-size: 13px; color: #666;
        }

        /* ── MOBILE ─────────────────────────────────────────────────────────── */
        @media (max-width: 768px) {
          .inv-preview-outer { padding: 16px 10px; }
          .inv-white-card { padding: 26px 16px 24px; border-radius: 14px; }
          .inv-h1 { font-size: 36px; }
          .inv-sub { font-size: 16px; }
          .inv-gcash-pill { font-size: 12px; padding: 5px 14px; }
          .inv-to-label { margin: 18px 0 4px; }
          .inv-to-name { font-size: 15px; }
          .inv-to-pets { font-size: 12.5px; margin-bottom: 14px; }
          .inv-col-service { width: 46%; }
          .inv-col-days { width: 12%; }
          .inv-col-rate { width: 20%; }
          .inv-col-amount { width: 22%; }
          .inv-tbl-row td { padding: 10px 6px; font-size: 12.5px; }
          .inv-tbl-head td { padding: 8px 6px; font-size: 9.5px; letter-spacing: 1.1px; }
          .inv-svc-name { font-size: 13px; }
          .inv-svc-sub { font-size: 10.5px; }
          .inv-day-note { font-size: 10px; }
          .inv-total-line { font-size: 20px; padding: 14px 0 10px; }
          .inv-summary-boxes { align-items: stretch; }
          .inv-tip-row, .inv-paid-row, .inv-balance-row { width: 100%; }
        }
      `}</style>

      <div className="ph">
        <div>
          <h2>Invoice Builder</h2>
          <p>Auto-fill from schedule or build manually — downloads as image</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-ghost" onClick={handlePrint}>🖨️ Print</button>
          <button className="btn btn-lime" onClick={handleDownload}>⬇️ Save</button>
          <button className="btn btn-dark" onClick={handleShare}><Share2 size={15} /> Share</button>
        </div>
      </div>

      <div className="inv-layout">

        {/* ══ LEFT: FORM ══ */}
        <div className="inv-form">

          {/* Import from booking */}
          <div style={{ background: '#fdffd1', borderRadius: '12px', padding: '14px', marginBottom: '18px', border: '1.5px solid #d4d800' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.04em', color: '#555', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClipboardList size={13} /> Auto-fill from Schedule
            </div>
              <select
                value={importBookingId}
                onChange={e => importFromBooking(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #d4d800', fontSize: '14px', background: '#fff', fontFamily: 'var(--font-body)' }}
              >
                <option value="">— Pick a booking to auto-fill —</option>
                {sortedImportBookings.map(b => {
                  const client = clients.find(c => c.id === b.clientId);
                  const clientName = b.clientName || client?.name || 'Unknown Client';
                  const statusIcon = (b.status === 'active' || b.status === 'pending') ? '🗓️' : '✔️';
                  return (
                    <option key={b.id} value={b.id}>
                      {statusIcon} {clientName} — {getBookingOptionLabel(b)}
                    </option>
                  );
                })}
              </select>
            <div style={{ fontSize: '11px', color: '#777', marginTop: '6px' }}>
              Bookings with the latest dates appear first. Per-day bookings auto-group into service lines.
            </div>
          </div>

          
          {/* Import Errands */}
          {(unbilledErrands.length > 0 || importedErrandCount > 0) && (
            <div style={{ background: '#f5f7fa', borderRadius: '12px', padding: '14px', marginBottom: '18px', border: '1.5px dashed #c0c8d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#444' }}>🛒 Errand Billing</div>
                <div style={{ fontSize: '12px', color: '#777' }}>This client has <strong>{unbilledErrands.length}</strong> reimbursable task(s).</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
          )}
          
          {/* Client + GCash */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            Invoice Details
          </div>
          <div className="form-row">
            <div className="fg">
              <label>Client</label>
              <select value={data.clientId} onChange={e => setData({ ...data, clientId: e.target.value })}>
                <option value="">— Select client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>GCash Number</label>
              <NumericInput
                value={data.gcash}
                maxLength={11}
                fallbackValue=""
                preserveLeadingZeros
                onValueChange={(raw) => setData({ ...data, gcash: raw })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="fg">
              <label>Invoice To (Name)</label>
              <input type="text" value={data.toName} onChange={e => setData({ ...data, toName: e.target.value })} />
            </div>
            <div className="fg">
              <label>Pets Listed</label>
              <input type="text" value={data.pets} onChange={e => setData({ ...data, pets: e.target.value })} placeholder="Granite, Waffles, Cali…" />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '14px 0' }} />

          {/* Line Items */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700 }}>Service Line Items</div>
            <button className="btn btn-xs btn-lime" type="button" onClick={() => setLineItems(p => [...p, newLineItem()])}>
              <Plus size={12} /> Add Line
            </button>
          </div>

          {lineItems.map((li, idx) => {
            const c = lineCalcs[idx];
            if (!c) return null;
            return (
              <div key={li.id} style={{ background: '#fafaf8', borderRadius: '12px', padding: '14px', marginBottom: '10px', border: '1.5px solid #e8e8e0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Line {idx + 1}</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {idx > 0 && (
                      <button type="button" className="btn btn-xs btn-ghost" style={{ minHeight: '32px', padding: '3px 7px' }}
                        onClick={() => setLineItems(p => { const a = [...p]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; })}>
                        ▲
                      </button>
                    )}
                    {idx < lineItems.length - 1 && (
                      <button type="button" className="btn btn-xs btn-ghost" style={{ minHeight: '32px', padding: '3px 7px' }}
                        onClick={() => setLineItems(p => { const a = [...p]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a; })}>
                        ▼
                      </button>
                    )}
                    {lineItems.length > 1 && (
                      <button type="button" className="btn btn-xs btn-danger" onClick={() => setLineItems(p => p.filter(x => x.id !== li.id))}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg" style={{ margin: 0 }}>
                    <label>Service Name</label>
                    <input type="text" value={li.customName} placeholder="e.g. Twice-a-day Visit" onChange={e => setLine(li.id, { customName: e.target.value })} />
                  </div>
                  <div className="fg" style={{ margin: 0 }}>
                    <label>Subtitle</label>
                    <input type="text" value={li.subtitle} placeholder="e.g. (up to 2 cats)" onChange={e => setLine(li.id, { subtitle: e.target.value })} />
                  </div>
                </div>
                {!li.isErrand ? (
                  <div className="form-row" style={{ marginTop: '8px' }}>
                    <div className="fg" style={{ margin: 0 }}>
                      <label>Days</label>
                      <NumericInput
                        value={li.days}
                        min={1}
                        fallbackValue="1"
                        onValueChange={(raw) => setLine(li.id, { days: Math.max(1, Number.parseInt(raw || '1', 10) || 1) })}
                      />
                    </div>
                    <div className="fg" style={{ margin: 0 }}>
                      <label>Date Note</label>
                      <input type="text" value={li.note} placeholder="e.g. (March 28-29)" onChange={e => setLine(li.id, { note: e.target.value })} />
                    </div>
                    <div className="fg" style={{ margin: 0 }}>
                      <label>Rate ₱/day</label>
                      <NumericInput
                        value={li.customRate}
                        min={0}
                        fallbackValue=""
                        placeholder="0"
                        onValueChange={(raw) => setLine(li.id, { customRate: raw })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-row" style={{ marginTop: '8px', padding: '10px', background: '#F5F882', borderRadius: '8px' }}>
                    <div className="fg" style={{ margin: 0, opacity: 0.6 }}>
                      <label>Days (N/A for Errands)</label>
                      <input type="text" disabled value="—" />
                    </div>
                    <div className="fg" style={{ margin: 0, opacity: 0.6 }}>
                      <label>Rate (N/A for Errands)</label>
                      <input type="text" disabled value="—" />
                    </div>
                    <div className="fg" style={{ margin: 0 }}>
                      <label>Total Errand Amount ₱</label>
                      <NumericInput
                        value={li.amount}
                        min={0}
                        fallbackValue=""
                        placeholder="0"
                        onValueChange={(raw) => setLine(li.id, { amount: Number(raw) || 0 })}
                      />
                    </div>
                  </div>
                )}
                {/* Discount */}
                {!li.isErrand && (
                  <div style={{ marginTop: '10px', background: '#fffef0', borderRadius: '8px', padding: '10px', border: '1px solid #f0e870' }}>
                    <div className="fg" style={{ margin: '0 0 8px' }}>
                      <label>Discount</label>
                      <select value={li.discountMode} onChange={e => setLine(li.id, { discountMode: e.target.value, discountValue: 0 })}>
                        {DISC_MODES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    {li.discountMode !== 'none' && (
                      <div className="form-row">
                        <div className="fg" style={{ margin: 0 }}>
                          <label>{li.discountMode.includes('percent') ? '%' : '₱'} amount</label>
                          <NumericInput
                            value={li.discountValue}
                            min={0}
                            max={li.discountMode.includes('percent') ? 100 : undefined}
                            fallbackValue="0"
                            onValueChange={(raw) => setLine(li.id, { discountValue: Number.parseInt(raw || '0', 10) || 0 })}
                          />
                        </div>
                        <div className="fg" style={{ margin: 0 }}>
                          <label>Label (red italic)</label>
                          <input type="text" value={li.discountLabel} placeholder="e.g. Courtesy Discount" onChange={e => setLine(li.id, { discountLabel: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Line subtotal */}
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px', fontSize: '12px', alignItems: 'center' }}>
                  {c.discountAmount > 0 && !li.isErrand && <span style={{ textDecoration: 'line-through', color: '#777' }}>₱{c.baseAmount}</span>}
                  <span style={{ fontWeight: 800 }}>₱{c.finalAmount.toFixed(0)}</span>
                  {c.discountAmount > 0 && !li.isErrand && <span style={{ color: 'var(--green)', fontSize: '11px' }}>saved ₱{c.discountAmount.toFixed(0)}</span>}
                </div>
              </div>
            );
          })}

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '14px 0' }} />

          {/* Paid + Tip */}
          <div className="form-row">
            <div className="fg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>Amount Paid (₱)</label>
                <button
                  type="button"
                  className="btn btn-xs btn-lime"
                  style={{ fontSize: '10px', padding: '3px 8px', minHeight: '28px' }}
                  onClick={() => setData(d => ({ ...d, paid: Math.round(grandTotal) }))}
                  title="Set paid amount to full balance"
                >
                  ✓ Mark Paid in Full
                </button>
              </div>
              <NumericInput
                value={data.paid}
                min={0}
                fallbackValue="0"
                onValueChange={(raw) => setData({ ...data, paid: Number.parseInt(raw || '0', 10) || 0 })}
              />
            </div>
            <div className="fg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>🎉 Tip Received (₱)</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[10, 15].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      className="btn btn-xs btn-ghost"
                      style={{ fontSize: '10px', padding: '3px 7px', minHeight: '28px' }}
                      onClick={() => setData(d => ({ ...d, tip: Math.round(grandTotal * pct / 100) }))}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>
              <NumericInput
                value={data.tip}
                min={0}
                fallbackValue="0"
                placeholder="0"
                onValueChange={(raw) => setData({ ...data, tip: Number.parseInt(raw || '0', 10) || 0 })}
              />
              <div className="hint">Tips are tracked separately!</div>
            </div>
          </div>

          {/* Grand total preview */}
          <div style={{ background: '#fdffd1', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Grand Total</span>
            <span style={{ fontWeight: 900, fontSize: '20px' }}>₱{grandTotal.toFixed(0)}</span>
          </div>

          <div className="invoice-form-actions">
            <button type="button" className="btn btn-lime" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
              {saving ? '💾 Saving…' : '💾 Save to Records'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleReset}>🗑️ Reset</button>
          </div>
        </div>

        {/* ══ RIGHT: INVOICE PREVIEW ══ */}
        <div className="inv-preview-outer" ref={invoiceRef}>
          <div className="inv-white-card">

            {/* DEMO WATERMARK */}
            <div style={{
              border: '2px dashed #dc2626',
              borderRadius: '8px',
              padding: '8px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: '800',
              textTransform: 'uppercase',
              textAlign: 'center',
              letterSpacing: '0.05em',
              marginBottom: '16px',
              fontFamily: 'var(--font-body)'
            }}>
              ⚠️ DEMO ONLY — DO NOT PAY ⚠️
            </div>

            {/* HEADER */}
            <div style={{ textAlign: 'center' }}>
              <div className="inv-h1">INVOICE</div>
              <div className="inv-sub">Pet Care Operations CRM (Demo)</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                <div className="inv-gcash-pill">Gcash: {fmtGcash(data.gcash)}</div>
              </div>
            </div>

            {/* INVOICE TO */}
            <div className="inv-to-label">Invoice To:</div>
            <div className="inv-to-name">{data.toName || 'Client Name'}</div>
            <div className="inv-to-pets">{data.pets || 'Pet names'}</div>

            {/* TABLE */}
            <table className="inv-tbl">
              <tbody>
                <tr className="inv-tbl-head">
                  <td className="inv-col-service">Service</td>
                  <td className="inv-col-days">Days</td>
                  <td className="inv-col-rate">Rate</td>
                  <td className="inv-col-amount">Amount</td>
                </tr>

                {lineItems.map((li, idx) => {
                  const c        = lineCalcs[idx];
                  if (!c) return null;
                  const hasDisc  = c.discountAmount > 0;
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
                    <React.Fragment key={li.id}>
                      {/* Parent row — errand items shown inline like subtitle/date notes */}
                      <tr className="inv-tbl-row" style={isErrand ? { background: '#F5F882' } : {}}>
                        <td className="inv-col-service">
                          <div className="inv-svc-name">{li.customName || '—'}</div>
                          {li.subtitle && <div className="inv-svc-sub">{li.subtitle}</div>}
                          {li.note && <div className="inv-day-note">{li.note}</div>}
                          {/* Inline sub-items for errands — no separate rows */}
                          {isErrand && li.items && li.items.map((sub, i) => (
                            <React.Fragment key={i}>
                              <div className="inv-svc-sub">• {sub.title}</div>
                              {sub.note && <div className="inv-day-note" style={{ paddingLeft: '10px' }}>{sub.note}</div>}
                            </React.Fragment>
                          ))}
                        </td>
                        <td className="inv-col-days">
                          {!isErrand && <span className="inv-day-count">{li.days}</span>}
                        </td>
                        <td className="inv-col-rate">
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
                              {hasDisc && <span className="inv-disc-lbl" style={{ margin: '2px 0 0 0' }}>{discLabel}</span>}
                            </div>
                          )}
                        </td>
                        <td className="inv-col-amount">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            {hasDisc && !isErrand ? (
                              <div style={{ whiteSpace: 'nowrap' }}>
                                <Struck style={{ marginRight: '4px' }}>{c.baseAmount}</Struck>
                                <span className="inv-final-amt">{c.finalAmount.toFixed(0)}</span>
                              </div>
                            ) : (
                              <span className="inv-final-amt">{c.finalAmount.toFixed(0)}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* TOTAL */}
            <div className="inv-total-line">
              {fullTotal > grandTotal ? (
                <>
                  <Struck style={{ fontSize: '16px', marginRight: '8px', fontWeight: 700 }}>₱{fullTotal.toFixed(0)}</Struck>
                  Total: ₱{grandTotal.toFixed(0)}
                </>
              ) : (
                <>Total: ₱{grandTotal.toFixed(0)}</>
              )}
            </div>

            {/* PAID / TIP / BALANCE */}
            <div className="inv-summary-boxes">
              {Number(data.tip) > 0 && (
                <div className="inv-tip-row">
                  <span>💝 Tip</span>
                  <span>₱{data.tip}</span>
                </div>
              )}
              <div className="inv-paid-row">
                <span>Paid</span>
                <span>₱{Number(data.paid || 0)}</span>
              </div>
              <div className="inv-balance-row">
                <span>Balance</span>
                {/* B5/BL2: balance clamped to ≥ 0 */}
                <span>₱{balance.toFixed(0)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {confirmResetOpen && (
        <ConfirmDialog
          title="Reset Invoice?"
          description="This clears the current invoice form and line items. Saved invoice records will stay intact."
          confirmLabel="Reset Invoice"
          tone="warning"
          onConfirm={confirmReset}
          onCancel={() => setConfirmResetOpen(false)}
        />
      )}
    </>
  );
}
