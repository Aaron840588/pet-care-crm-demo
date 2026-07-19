import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../store/DataContext';
import NumericInput from '../components/NumericInput';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { Clock, Pencil, Copy, Eye, X, Tag, ChevronDown, ChevronUp, Trash2, CalendarPlus } from 'lucide-react';
import { fmtDate, fmtDayLabel, generateDateRange, dateSortValue } from '../utils/dates';
import ViewBookingModal from '../features/schedule/ViewBookingModal';
import { downloadICS } from '../utils/icsExport';
import {
  DISC_MODES, calcDaySubtotal, calcDayDiscount, calcDayTotal, applyDiscount,
  emptyDiscount, defaultBookingForm,
} from '../utils/calculations';
import {
  addVisitDateToSchedule,
  buildVisitScheduleFromRange,
  getServiceLabel,
  getVisitDateBounds,
  hasSkippedVisitDates,
  makeDay,
  normalizeDay,
  removeVisitDateFromSchedule,
  sortVisitSchedule,
  getDayDiscountTotal,
  hasPerDayDiscounts,
} from '../utils/scheduleLogic';

const STATUS_FILTERS = ['all', 'active', 'pending', 'tentative', 'done'];
const STATUS_LABELS = {
  all: 'All',
  active: 'Active',
  pending: 'Upcoming',
  tentative: 'Tentative',
  done: 'Done',
};
const STATUS_FLOW = {
  pending: 'tentative',
  tentative: 'active',
  active: 'done',
  done: 'pending',
};

export default function ScheduleView() {
  const { bookings, addBooking, updateBooking, removeBooking, clients, services } = useData();
  const toast = useToast();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [filter,      setFilter]      = useState('active');
  const [viewBooking, setViewBooking] = useState(null);
  const [daySchedule, setDaySchedule] = useState([]);
  const [visitDateToAdd, setVisitDateToAdd] = useState('');
  // U4: default collapsed — show only count summary for long bookings
  const [showDays,    setShowDays]    = useState(false);
  const [confirmId,   setConfirmId]   = useState(null); // M4: inline confirm
  const [saving,      setSaving]      = useState(false);

  const [formData, setFormData] = useState({ ...defaultBookingForm });

  const getDefaultService = useCallback(() => {
    if (!services.length) return '';
    return `${services[0].name}|${services[0].price}`;
  }, [services]);

  // ── B1+B2: Date change — uses local-safe generateDateRange, decouple from formData ──
  const buildDaySchedule = useCallback((start, end, prevSchedule = []) => {
    return buildVisitScheduleFromRange(start, end, prevSchedule, getDefaultService());
  }, [getDefaultService]);

  const syncDaySchedule = useCallback((nextSchedule) => {
    const sorted = sortVisitSchedule(nextSchedule);
    const bounds = getVisitDateBounds(sorted);
    setDaySchedule(sorted);
    if (bounds.startDate && bounds.endDate) {
      setFormData(f => ({ ...f, startDate: bounds.startDate, endDate: bounds.endDate }));
    }
    return sorted;
  }, []);

  const handleStartDateChange = useCallback((value) => {
    setFormData(f => {
      const newEndDate = (!f.endDate || f.endDate < value) ? value : f.endDate;
      const newSchedule = buildDaySchedule(value, newEndDate, daySchedule);
      setDaySchedule(newSchedule);
      return { ...f, startDate: value, endDate: newEndDate };
    });
  }, [buildDaySchedule, daySchedule]);

  const handleEndDateChange = useCallback((value) => {
    setFormData(f => {
      const newSchedule = buildDaySchedule(f.startDate, value, daySchedule);
      setDaySchedule(newSchedule);
      return { ...f, endDate: value };
    });
  }, [buildDaySchedule, daySchedule]);

  const handleAddVisitDate = useCallback(() => {
    if (!visitDateToAdd) return;
    const nextSchedule = addVisitDateToSchedule(
      daySchedule,
      visitDateToAdd,
      getDefaultService(),
      formData.timeText,
    );
    syncDaySchedule(nextSchedule);
    setVisitDateToAdd('');
    setShowDays(true);
  }, [daySchedule, formData.timeText, getDefaultService, syncDaySchedule, visitDateToAdd]);

  const handleRemoveVisitDate = useCallback((date) => {
    const nextSchedule = removeVisitDateFromSchedule(daySchedule, date);
    if (!nextSchedule.length) return;
    syncDaySchedule(nextSchedule);
  }, [daySchedule, syncDaySchedule]);

  const set = useCallback((patch) => setFormData(f => ({ ...f, ...patch })), []);

  const applyServiceToAll = useCallback((svc) => {
    if (!svc) return;
    setDaySchedule(prev => prev.map(d => ({ ...d, service: svc })));
  }, []);

  const applyTimeToAll = useCallback((time) => {
    setDaySchedule(prev => prev.map(d => ({ ...d, time })));
  }, []);

  const updateDay = useCallback((idx, field, val) => {
    setDaySchedule(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }, []);

  const updateDayDiscount = useCallback((idx, type, field, value) => {
    setDaySchedule(prev => prev.map((day, i) => {
      if (i !== idx) return day;
      return {
        ...day,
        discounts: {
          ...day.discounts,
          [type]: { ...(day.discounts?.[type] || { amount: 0, label: '' }), [field]: value },
        },
      };
    }));
  }, []);

  const applyChargeToAll = useCallback((field, value) => {
    setDaySchedule(prev => prev.map(d => ({ ...d, [field]: value })));
  }, []);

  const applyDiscountToAll = useCallback((type, amount, label) => {
    setDaySchedule(prev => prev.map(day => ({
      ...day,
      discounts: {
        ...day.discounts,
        [type]: { amount, label },
      },
    })));
  }, []);

  const openAdd = useCallback(() => {
    setFormData({ ...defaultBookingForm });
    setDaySchedule([]);
    setVisitDateToAdd('');
    setShowDays(false);
    setEditingId(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((booking) => {
    setFormData({
      clientId:  booking.clientId  || '',
      startDate: booking.startDate || '',
      endDate:   booking.endDate   || '',
      status:    booking.status    || 'pending',
      timeText:  booking.timeText  || '',
      notes:     booking.notes     || '',
      discount:  booking.discount  || emptyDiscount,
    });

    if (booking.daySchedule?.length > 0) {
      setDaySchedule(booking.daySchedule.map(normalizeDay));
    } else {
      // B4: single setDaySchedule call, not duplicate
      const baseService = booking.service || getDefaultService();
      const dates = generateDateRange(booking.startDate, booking.endDate);
      const extraPets = Number(booking.extraPets || 0);
      // Populate per-day time from the booking-level timeText for legacy bookings
      const legacyTime = booking.timeText || '';
      setDaySchedule(dates.map(d => normalizeDay({ ...makeDay(d, baseService, legacyTime), extraPets })));
    }
    setVisitDateToAdd('');
    setShowDays(false);
    setEditingId(booking.id);
    setModalOpen(true);
  }, [getDefaultService]);

  const cloneBooking = useCallback((booking) => {
    setFormData({
      ...defaultBookingForm,
      clientId: booking.clientId || '',
      startDate: booking.startDate || '',
      endDate: booking.endDate || '',
      status: 'pending',
      timeText: booking.timeText || '',
      notes:    booking.notes    || '',
      discount: booking.discount || emptyDiscount,
    });
    if (booking.daySchedule?.length > 0) {
      setDaySchedule(booking.daySchedule.map(normalizeDay));
    } else {
      const baseService = booking.service || getDefaultService();
      const dates = generateDateRange(booking.startDate, booking.endDate);
      const extraPets = Number(booking.extraPets || 0);
      const legacyTime = booking.timeText || '';
      setDaySchedule(dates.map(d => normalizeDay({ ...makeDay(d, baseService, legacyTime), extraPets })));
    }
    setVisitDateToAdd('');
    setShowDays(false);
    setEditingId(null);
    setModalOpen(true);
  }, [getDefaultService]);

  // ── Save booking ─────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    const normalizedSchedule = sortVisitSchedule(daySchedule);
    const scheduleBounds = getVisitDateBounds(normalizedSchedule);
    const startDate = scheduleBounds.startDate || formData.startDate;
    const endDate = scheduleBounds.endDate || formData.endDate;
    if (!formData.clientId || !startDate || !endDate) return;
    setSaving(true);
    try {
      const client     = clients.find(c => c.id === formData.clientId);
      const clientName = client?.name || 'Unknown';
      const numDays    = normalizedSchedule.length || generateDateRange(startDate, endDate).length || 1;
      const gross      = normalizedSchedule.reduce((s, d) => s + calcDaySubtotal(d), 0);
      const totalFromDays = normalizedSchedule.reduce((s, d) => s + calcDayTotal(d), 0);
      const usePerDayDiscounts = hasPerDayDiscounts(normalizedSchedule);
      const total      = usePerDayDiscounts
        ? totalFromDays
        : applyDiscount(gross, numDays, formData.discount);

      // Dominant service (most common) for backward compat
      const svcCounts = {};
      normalizedSchedule.forEach(d => { svcCounts[d.service] = (svcCounts[d.service] || 0) + 1; });
      const dominantService = Object.entries(svcCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || getDefaultService();

      const payload = {
        ...formData,
        startDate,
        endDate,
        clientName,
        days:     numDays,
        total:    Math.round(total * 100) / 100,
        service:  dominantService,
        discount: usePerDayDiscounts ? emptyDiscount : formData.discount,
        daySchedule: normalizedSchedule.length > 0 ? normalizedSchedule : undefined,
        extraPets: normalizedSchedule.length > 0
          ? Math.round(normalizedSchedule.reduce((s, d) => s + Number(d.extraPets || 0), 0) / numDays)
          : 0,
      };

      if (editingId) await updateBooking(editingId, payload);
      else           await addBooking(payload);

      setModalOpen(false);
      toast(`✅ Booking ${editingId ? 'updated' : 'added'} successfully!`);
    } catch (err) {
      console.error(err);
      toast('❌ Failed to save booking. Check your connection.', 'error');
    } finally {
      setSaving(false);
    }
  }, [formData, daySchedule, clients, editingId, addBooking, updateBooking, getDefaultService, toast]);

  const cycleStatus = useCallback((booking) => {
    const next = STATUS_FLOW[booking.status] || 'pending';
    updateBooking(booking.id, { status: next });
  }, [updateBooking]);

  // M4/B17: inline confirm for delete (replaces window.confirm)
  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmId) return;
    try {
      await removeBooking(confirmId);
      toast('Booking deleted.', 'info');
    } catch {
      toast('Failed to delete. Try again.', 'error');
    } finally {
      setConfirmId(null);
    }
  }, [confirmId, removeBooking, toast]);

  const getStatusBadge = (status) => {
    if (status === 'active')  return <span className="badge b-active"  style={{ cursor: 'pointer' }}>● Active</span>;
    if (status === 'pending') return <span className="badge b-pending" style={{ cursor: 'pointer' }}>● Upcoming</span>;
    if (status === 'tentative') return <span className="badge b-tentative" style={{ cursor: 'pointer' }}><Pencil size={11} /> Needs confirmation</span>;
    return <span className="badge b-done" style={{ cursor: 'pointer' }}>✓ Done</span>;
  };

  const appendTimeText = (text) => {
    const current = formData.timeText ? formData.timeText.trim() + ', ' : '';
    set({ timeText: current + text });
  };

  const getBookingDateLabel = useCallback((booking) => {
    const schedule = booking.daySchedule?.length > 0 ? sortVisitSchedule(booking.daySchedule) : [];
    if (schedule.length > 0 && hasSkippedVisitDates(schedule)) {
      const labels = schedule.slice(0, 3).map((day) => fmtDate(day.date)).join(', ');
      return schedule.length > 3 ? `${labels} +${schedule.length - 3} more` : labels;
    }
    if (!booking.startDate || !booking.endDate) return 'No dates';
    return booking.startDate === booking.endDate
      ? fmtDate(booking.startDate)
      : `${fmtDate(booking.startDate)} to ${fmtDate(booking.endDate)}`;
  }, []);

  // P2: memoize filtered + sorted bookings
  const filteredBookings = useMemo(() =>
    bookings
      .filter(b => filter === 'all' || b.status === filter)
      .sort((a, b) => dateSortValue(a.startDate) - dateSortValue(b.startDate)),
    [bookings, filter]
  );

  const getBookingRenderMeta = useCallback((booking) => {
    const uniqueServices = booking.daySchedule?.length > 0
      ? [...new Set(booking.daySchedule.map((day) => day.service?.split('|')[0]).filter(Boolean))]
      : null;
    const dayDiscountTotal = getDayDiscountTotal(booking.daySchedule || []);
    const hasLegacyDiscount = booking.discount?.mode && booking.discount.mode !== 'none' && Number(booking.discount.value) > 0;
    const hasDiscount = dayDiscountTotal > 0 || hasLegacyDiscount;
    const hasPerDayTimes = booking.daySchedule?.some((day) => day.time);
    const timeLabel = booking.timeText || (hasPerDayTimes ? 'Per-day times set' : 'Any Time');

    return {
      uniqueServices,
      dayDiscountTotal,
      hasDiscount,
      timeLabel,
    };
  }, []);

  // P3: live cost preview inside modal only
  const { gross, discountedTotal, saved } = useMemo(() => {
    if (!modalOpen || !daySchedule.length) return { gross: 0, discountedTotal: 0, saved: 0 };
    const g = daySchedule.reduce((s, d) => s + calcDaySubtotal(d), 0);
    const dt = hasPerDayDiscounts(daySchedule)
      ? daySchedule.reduce((s, d) => s + calcDayTotal(d), 0)
      : applyDiscount(g, daySchedule.length, formData.discount);
    return { gross: g, discountedTotal: dt, saved: g - dt };
  }, [modalOpen, daySchedule, formData.discount]);

  return (
    <>
      <div className="ph">
        <div>
          <h2>Schedule</h2>
          <p>All bookings — tap a status badge to cycle it.</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-lime" onClick={openAdd}>+ Add Booking</button>
        </div>
      </div>

      <div className="filter-bar">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`fchip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="schedule-mobile-list">
        {filteredBookings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: 0 }}>
            No bookings found
          </div>
        ) : filteredBookings.map((b) => {
            const { uniqueServices, dayDiscountTotal, hasDiscount, timeLabel } = getBookingRenderMeta(b);

            return (
              <div
                key={b.id}
                className={`card schedule-mobile-card ${b.status === 'tentative' ? 'schedule-card-tentative' : ''}`}
                style={{ marginBottom: '12px', borderTop: b.status === 'tentative' ? '4px solid #d6bf5f' : '4px solid var(--lime)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', lineHeight: 1.2 }}>{b.clientName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '4px' }}>
                      {uniqueServices ? uniqueServices.join(' + ') : getServiceLabel(b)}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', padding: 0, flexShrink: 0 }}
                    onClick={() => cycleStatus(b)}
                    title="Tap to change status"
                  >
                    {getStatusBadge(b.status)}
                  </button>
                </div>

                <div className="schedule-card-summary">
                  <div>
                    <div className="schedule-card-label">Dates</div>
                    {hasSkippedVisitDates(b.daySchedule || []) && (
                      <div className="schedule-card-value" style={{ color: 'var(--gray)', fontSize: '11px', marginBottom: '2px' }}>
                        Selected: {getBookingDateLabel(b)}
                      </div>
                    )}
                    <div className="schedule-card-value">{fmtDate(b.startDate)} → {fmtDate(b.endDate)}</div>
                  </div>
                  <div>
                    <div className="schedule-card-label">Time</div>
                    <div className="schedule-card-value">{timeLabel}</div>
                  </div>
                  <div>
                    <div className="schedule-card-label">Days</div>
                    <div className="schedule-card-value">{b.days}</div>
                  </div>
                  <div>
                    <div className="schedule-card-label">Total</div>
                    <div className="schedule-card-total">₱{b.total}</div>
                  </div>
                </div>

                {hasDiscount && (
                  <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff0c0', color: '#7a5200', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}>
                    <Tag size={11} />
                    {dayDiscountTotal > 0
                      ? `₱${dayDiscountTotal.toFixed(0)} discount across days`
                      : `${b.discount.mode.includes('percent') ? `${b.discount.value}%` : `₱${b.discount.value}`} off`
                    }
                  </div>
                )}

                <div className="schedule-card-actions">
                  <button type="button" className="btn btn-sm btn-ghost" aria-label={`View details of booking for ${b.clientName}`} onClick={() => setViewBooking(b)}>
                    <Eye size={13} /> View
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" aria-label={`Edit booking for ${b.clientName}`} onClick={() => openEdit(b)}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" aria-label={`Clone booking for ${b.clientName}`} onClick={() => cloneBooking(b)}>
                    <Copy size={13} /> Clone
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    aria-label={`Export ${b.clientName} booking to calendar`}
                    title="Export to Google / Apple Calendar"
                    onClick={() => {
                      const matchedClient = clients.find(c => c.id === b.clientId);
                      downloadICS(b, matchedClient);
                    }}
                  >
                    <CalendarPlus size={13} /> Calendar
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" aria-label={`Delete booking for ${b.clientName}`} onClick={() => setConfirmId(b.id)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* ── Schedule Table ── */}
      <div className="schedule-desktop-table card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Service(s)</th>
                <th>Dates</th>
                <th>Time</th>
                <th>Days</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0
                ? <tr className="empty-row"><td colSpan="8">No bookings found</td></tr>
                : filteredBookings.map(b => {
                    const { uniqueServices, dayDiscountTotal, hasDiscount, timeLabel } = getBookingRenderMeta(b);

                    return (
                      <tr key={b.id} className={b.status === 'tentative' ? 'schedule-row-tentative' : undefined}>
                        <td style={{ fontWeight: 'bold' }}>{b.clientName}</td>
                        <td>
                          {uniqueServices
                            ? <>
                                <span style={{ fontWeight: 700, fontSize: '12px' }}>
                                  {uniqueServices.join(' + ')}
                                </span>
                                {uniqueServices.length > 1 && (
                                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--gray)', marginTop: '2px' }}>
                                    {uniqueServices.map(svc => {
                                      const count = b.daySchedule.filter(d => d.service?.split('|')[0] === svc).length;
                                      return `${svc}×${count}d`;
                                    }).join(', ')}
                                  </span>
                                )}
                              </>
                            : <>
                                {b.service?.split('|')[0]}
                                {b.extraPets > 0 && (
                                  <span style={{ display: 'block', color: 'var(--gray)', fontSize: '10px' }}>
                                    +{b.extraPets} extra pet{b.extraPets !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </>
                          }
                          {hasDiscount && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '3px', background: '#fff0c0', color: '#7a5200', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>
                              <Tag size={9} />
                              {dayDiscountTotal > 0
                                ? `₱${dayDiscountTotal.toFixed(0)} spread across days`
                                : `${b.discount.mode.includes('percent') ? `${b.discount.value}%` : `₱${b.discount.value}`} off`
                              }
                              {dayDiscountTotal <= 0 && b.discount.label ? ` · ${b.discount.label}` : ''}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', lineHeight: 1.5 }}>
                          {hasSkippedVisitDates(b.daySchedule || []) && (
                            <>
                              <span style={{ color: 'var(--gray)', fontSize: '11px', fontWeight: 600 }}>
                                Selected: {getBookingDateLabel(b)}
                              </span>
                              <br />
                            </>
                          )}
                          <span style={{ fontWeight: 600 }}>{fmtDate(b.startDate)}</span>
                          <br /><span style={{ color: 'var(--gray)' }}>to</span><br />
                          <span style={{ fontWeight: 600 }}>{fmtDate(b.endDate)}</span>
                        </td>
                        <td>
                          <span className="time-flex">
                            <Clock size={12} style={{ marginRight: '4px', marginBottom: '-2px' }} />
                            {timeLabel}
                          </span>
                        </td>
                        <td>{b.days}</td>
                        <td style={{ fontWeight: 'bold' }}>
                          ₱{b.total}
                          {hasDiscount && <div style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 600 }}>discounted</div>}
                        </td>
                        <td onClick={() => cycleStatus(b)} title="Tap to change status" style={{ cursor: 'pointer' }}>
                          {getStatusBadge(b.status)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button className="btn btn-xs btn-ghost" aria-label={`View details of booking for ${b.clientName}`} onClick={() => setViewBooking(b)}>
                              <Eye size={11} /> View
                            </button>
                            <button className="btn btn-xs btn-ghost" aria-label={`Edit booking for ${b.clientName}`} onClick={() => openEdit(b)}>
                              <Pencil size={11} /> Edit
                            </button>
                            <button className="btn btn-xs btn-ghost" aria-label={`Clone booking for ${b.clientName}`} onClick={() => cloneBooking(b)}>
                              <Copy size={11} /> Clone
                            </button>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                downloadICS(b);
                              }}
                              className="btn btn-xs btn-ghost"
                              aria-label={`Export ${b.clientName} booking to calendar`}
                              title="Export to Calendar"
                              style={{ textDecoration: 'none' }}
                            >
                              <CalendarPlus size={11} /> Calendar
                            </a>
                            <button className="btn btn-xs btn-danger" aria-label={`Delete booking for ${b.clientName}`} title="Delete booking" onClick={() => setConfirmId(b.id)}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── INLINE DELETE CONFIRM (M4: replaces window.confirm) ── */}
      {confirmId && (
        <ConfirmDialog
          title="Delete Booking?"
          description="Are you sure you want to completely remove this booking? This action cannot be undone."
          confirmLabel="Delete Booking"
          tone="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {modalOpen && (
        <div className="overlay open">
          <div className="modal" style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexShrink: 0 }}>
              <div className="modal-title" style={{ margin: 0 }}>
                {editingId ? 'Edit Booking' : 'Add Booking'}
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: '6px' }}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="modal-content-scroller" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {/* Client + Status */}
              <div className="form-row">
                <div className="fg">
                  <label>Client *</label>
                  <select required value={formData.clientId} onChange={e => set({ clientId: e.target.value })}>
                    <option value="">— Select client —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => set({ status: e.target.value })}>
                    <option value="pending">Upcoming</option>
                    <option value="tentative">Tentative / needs confirmation</option>
                    <option value="active">Active (ongoing)</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="form-row">
                <div className="fg">
                  <label>Start Date *</label>
                  <input
                    required type="date" value={formData.startDate}
                    onChange={e => handleStartDateChange(e.target.value)}
                  />
                </div>
                <div className="fg">
                  <label>End Date *</label>
                  <input
                    required type="date" value={formData.endDate}
                    onChange={e => handleEndDateChange(e.target.value)}
                  />
                </div>
              </div>

              {/* ── PER-DAY SCHEDULE ── */}
              {daySchedule.length > 0 && (
                <div style={{ marginBottom: '14px', border: '1.5px solid #d9d49a', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Header — collapsible (U4: defaults collapsed) */}
                  <div
                    style={{ background: '#f5f2c8', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setShowDays(v => !v)}
                  >
                    <span style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      📅 Per-Day Services &amp; Charges
                      <span style={{ fontWeight: 900, marginLeft: '6px' }}>
                        ({daySchedule.length} day{daySchedule.length !== 1 ? 's' : ''})
                      </span>
                      {!showDays && (
                        <span style={{ fontWeight: 500, marginLeft: '8px', fontSize: '11px', opacity: .75 }}>
                          — tap to expand
                        </span>
                      )}
                    </span>
                    {showDays ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', background: '#fffef8', borderTop: '1px solid #eee8aa', flexWrap: 'wrap' }}>
                    <label htmlFor="visit-date-to-add" style={{ fontSize: '11px', fontWeight: 700, color: '#555', margin: 0, whiteSpace: 'nowrap' }}>
                      Add Visit Date
                    </label>
                    <input
                      id="visit-date-to-add"
                      type="date"
                      value={visitDateToAdd}
                      onChange={e => setVisitDateToAdd(e.target.value)}
                      style={{ flex: 1, minWidth: '150px', padding: '7px 9px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      disabled={!visitDateToAdd}
                      onClick={handleAddVisitDate}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <CalendarPlus size={12} /> Add Date
                    </button>
                  </div>

                  {showDays && (
                    <div style={{ padding: '10px 12px', background: '#fffef8' }}>
                      {/* Apply-to-all: Service */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', background: '#f4f4f0', padding: '8px 10px', borderRadius: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>Service — all days:</span>
                        <select
                          onChange={e => { applyServiceToAll(e.target.value); e.target.value = ''; }}
                          style={{ flex: 1, minWidth: '160px', padding: '6px 8px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                          <option value="">— Pick a service —</option>
                          {services.map(s => (
                            <option key={s.id} value={`${s.name}|${s.price}`}>{s.name} — ₱{s.price}</option>
                          ))}
                        </select>
                      </div>

                      {/* Apply-to-all: Time */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px', background: '#f4f4f0', padding: '8px 10px', borderRadius: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>Time — all days:</span>
                        <input
                          type="text"
                          placeholder="e.g. 9:00 PM or 7AM & 8PM"
                          onBlur={e => { if (e.target.value) { applyTimeToAll(e.target.value); e.target.value = ''; } }}
                          style={{ flex: 1, minWidth: '120px', padding: '6px 8px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'var(--font-body)' }}
                        />
                        {['7AM','8AM','9AM','5PM','6PM','7PM','9PM','2x/day'].map(chip => (
                          <button
                            key={chip} type="button"
                            onClick={() => applyTimeToAll(chip)}
                            style={{ padding: '4px 9px', fontSize: '10px', borderRadius: '20px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', fontFamily: 'var(--font-body)', fontWeight: 600 }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      {/* Day rows (M1: compact scrollable layout) */}
                      <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {daySchedule.map((day, idx) => (
                          <div key={day.date} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #eee', padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                              <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                                {fmtDayLabel(day.date)}
                              </div>
                              {daySchedule.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVisitDate(day.date)}
                                  title="Remove this visit date"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 6px', fontSize: '10px', borderRadius: '14px', border: '1px solid #f5cece', background: '#fff0f0', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, flexShrink: 0 }}
                                >
                                  <X size={11} /> Remove
                                </button>
                              )}
                            </div>

                            {/* Service selector — full width */}
                            <select
                              value={day.service}
                              onChange={e => updateDay(idx, 'service', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '6px' }}
                            >
                              {services.map(s => (
                                <option key={s.id} value={`${s.name}|${s.price}`}>{s.name} — ₱{s.price}</option>
                              ))}
                            </select>

                            {/* Per-day time input */}
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={day.time || ''}
                                onChange={e => updateDay(idx, 'time', e.target.value)}
                                placeholder="Visit time (e.g. 9:00 PM)"
                                style={{ flex: 1, minWidth: '130px', padding: '5px 8px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'var(--font-body)', color: '#222' }}
                              />
                              {['7AM','8AM','9AM','5PM','6PM','7PM','9PM'].map(chip => (
                                <button
                                  key={chip} type="button"
                                  onClick={() => updateDay(idx, 'time', day.time ? `${day.time} & ${chip}` : chip)}
                                  style={{ padding: '4px 7px', fontSize: '10px', borderRadius: '16px', border: '1px solid #ddd', background: day.time?.includes(chip) ? 'var(--lime)' : '#fff', cursor: 'pointer', whiteSpace: 'nowrap', touchAction: 'manipulation', fontFamily: 'var(--font-body)', fontWeight: 600, lineHeight: 1.2 }}
                                >
                                  {chip}
                                </button>
                              ))}
                              {day.time && (
                                <button
                                  type="button"
                                  onClick={() => updateDay(idx, 'time', '')}
                                  style={{ padding: '4px 7px', fontSize: '10px', borderRadius: '16px', border: '1px solid #f5cece', background: '#fff0f0', color: 'var(--red)', cursor: 'pointer', touchAction: 'manipulation', fontFamily: 'var(--font-body)', fontWeight: 600 }}
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Charge row (M1: compact grid) */}
                            <div className="day-charge-grid">
                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>+Pets {day.extraPets > 0 && <button type="button" onClick={() => applyChargeToAll('extraPets', day.extraPets)} title="Apply to all days" style={{ fontSize: '8px', padding: '0 4px', borderRadius: '4px', border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer', marginLeft: '2px', fontFamily: 'var(--font-body)' }}>→all</button>}</label>
                                <NumericInput
                                  value={day.extraPets}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'extraPets', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>
                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>Spec ₱ {day.specialNeeds > 0 && <button type="button" onClick={() => applyChargeToAll('specialNeeds', day.specialNeeds)} title="Apply to all days" style={{ fontSize: '8px', padding: '0 4px', borderRadius: '4px', border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer', marginLeft: '2px', fontFamily: 'var(--font-body)' }}>→all</button>}</label>
                                <NumericInput
                                  value={day.specialNeeds}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'specialNeeds', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>
                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>Dist ₱ {day.distance > 0 && <button type="button" onClick={() => applyChargeToAll('distance', day.distance)} title="Apply to all days" style={{ fontSize: '8px', padding: '0 4px', borderRadius: '4px', border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer', marginLeft: '2px', fontFamily: 'var(--font-body)' }}>→all</button>}</label>
                                <NumericInput
                                  value={day.distance}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'distance', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>
                              <div className="day-charge-field">
                                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '2px' }}>+Visit ₱ {day.extraVisit > 0 && <button type="button" onClick={() => applyChargeToAll('extraVisit', day.extraVisit)} title="Apply to all days" style={{ fontSize: '8px', padding: '0 4px', borderRadius: '4px', border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer', marginLeft: '2px', fontFamily: 'var(--font-body)' }}>→all</button>}</label>
                                <NumericInput
                                  value={day.extraVisit}
                                  min={0}
                                  fallbackValue="0"
                                  onValueChange={(raw) => updateDay(idx, 'extraVisit', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                  inputStyle={{ width: '100%', padding: '5px 6px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}
                                />
                              </div>
                              <div className="day-total" style={{ textAlign: 'right', paddingBottom: '2px' }}>
                                <span style={{ fontWeight: 800, fontSize: '13px' }}>₱{calcDayTotal(day)}</span>
                                {calcDayDiscount(day) > 0 && (
                                  <div style={{ fontSize: '10px', color: 'var(--green)', marginTop: '2px' }}>
                                    saved ₱{calcDayDiscount(day).toFixed(0)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Special needs note */}
                            {day.specialNeeds > 0 && (
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text" value={day.specialNeedsNote}
                                  onChange={e => updateDay(idx, 'specialNeedsNote', e.target.value)}
                                  placeholder="Special needs note (e.g. Spay wound care)"
                                  style={{ width: '100%', marginTop: '6px', padding: '5px 8px', fontSize: '12px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'var(--font-body)' }}
                                />
                                {day.specialNeedsNote?.trim().length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => applyChargeToAll('specialNeedsNote', day.specialNeedsNote)}
                                    title="Copy note to all days"
                                    style={{
                                      position: 'absolute', right: '6px', top: '10px',
                                      fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                                      border: '1px solid #aaa', background: '#f5f5f5', cursor: 'pointer'
                                    }}
                                  >
                                    →all
                                  </button>
                                )}
                              </div>
                            )}

                            {/* ── Per-component discounts ── */}
                            {(() => {
                              const disc = day.discounts || {};
                              const rows = [
                                { type: 'service', label: 'Service', show: true },
                                { type: 'extraPets', label: `+${day.extraPets} Pets`, show: Number(day.extraPets) > 0 },
                                { type: 'specialNeeds', label: 'Special Needs', show: Number(day.specialNeeds) > 0 },
                                { type: 'distance', label: 'Distance', show: Number(day.distance) > 0 },
                                { type: 'extraVisit', label: 'Extra Visit', show: Number(day.extraVisit) > 0 },
                              ].filter(r => r.show);
                              const anyDisc = rows.some(r => Number(disc[r.type]?.amount || 0) > 0);
                              return (
                                <div style={{ marginTop: '8px', borderTop: '1px solid #f0e070', paddingTop: '8px' }}>
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#bbb', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                    Discounts {anyDisc ? <span style={{ color: 'var(--green)' }}>- ₱{calcDayDiscount(day).toFixed(0)} total</span> : '(optional)'}
                                  </div>
                                  {rows.map(({ type, label }) => {
                                    const d = disc[type] || { amount: 0, label: '' };
                                    return (
                                      <div key={type} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '10px', color: '#888', width: '68px', flexShrink: 0, fontWeight: 600 }}>{label}</span>
                                        <NumericInput
                                          value={d.amount || 0}
                                          min={0}
                                          fallbackValue="0"
                                          onValueChange={(raw) => updateDayDiscount(idx, type, 'amount', Math.max(0, Number.parseInt(raw || '0', 10) || 0))}
                                          inputStyle={{ width: '70px', padding: '4px 6px', fontSize: '12px', borderRadius: '7px', border: `1px solid ${Number(d.amount) > 0 ? '#f0c0bc' : '#ddd'}`, textAlign: 'center', background: '#fff' }}
                                        />
                                        <input
                                          type="text"
                                          value={d.label || ''}
                                          onChange={e => updateDayDiscount(idx, type, 'label', e.target.value)}
                                          placeholder="reason"
                                          style={{ flex: 1, padding: '4px 7px', fontSize: '11px', borderRadius: '7px', border: `1px solid ${Number(d.amount) > 0 ? '#f0c0bc' : '#ddd'}`, fontFamily: 'var(--font-body)', background: '#fff' }}
                                        />
                                        {(Number(d.amount) > 0 || d.label) && (
                                          <button
                                            type="button"
                                            title="Apply this discount to all days"
                                            onClick={() => { applyDiscountToAll(type, Number(d.amount) || 0, d.label || ''); }}
                                            style={{ fontSize: '8px', padding: '2px 5px', borderRadius: '4px', border: '1px solid #f0c0bc', background: '#fff7f5', color: '#c05050', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-body)', fontWeight: 700 }}
                                          >→all</button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Visit Time */}
              <div className="fg" style={{ background: '#f8f8f8', padding: '14px', borderRadius: '10px', border: '1px solid #eee' }}>
                <label>Visit Time &amp; Logistics</label>
                <input
                  type="text" value={formData.timeText}
                  onChange={e => set({ timeText: e.target.value })}
                  placeholder="e.g. 8:00 AM, Flexible Morning"
                  style={{ fontSize: '16px' }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {['Morning', 'Afternoon', 'Evening', '7:00 AM', '8:00 AM', '9:00 AM', '5:00 PM', '6:00 PM', 'Flexible', '2x a day'].map(chip => (
                    <button
                      key={chip} type="button" className="btn btn-xs btn-ghost"
                      onClick={() => appendTimeText(chip)}
                      style={{ fontSize: '11px', borderRadius: '20px', backgroundColor: '#fff' }}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="fg">
                <label>Special Instructions</label>
                <textarea
                  value={formData.notes}
                  onChange={e => set({ notes: e.target.value })}
                  placeholder="Feeding schedule, locked gates, medicine, etc."
                />
              </div>

              {/* ── LIVE COST PREVIEW (P3: inside modal, only when open) ── */}
              {daySchedule.length > 0 && (
                <div style={{ background: 'var(--lime-pale)', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '8px' }}>
                    💰 Cost Preview
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px' }}>
                    {daySchedule.map((day, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                        <span style={{ flex: 1, marginRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fmtDayLabel(day.date)} — {day.service?.split('|')[0] || '?'}
                          {day.extraPets > 0 ? ` +${day.extraPets}🐾` : ''}
                          {day.specialNeeds > 0 ? ' +spec' : ''}
                          {day.distance > 0 ? ' +dist' : ''}
                          {calcDayDiscount(day) > 0 ? ` -disc ${calcDayDiscount(day).toFixed(0)}` : ''}
                        </span>
                        <span style={{ fontWeight: 600, flexShrink: 0 }}>₱{calcDayTotal(day)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #d4e860', paddingTop: '6px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {saved > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#777' }}>
                            <span>Gross</span>
                            <span style={{ textDecoration: 'line-through' }}>₱{gross}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--green)', fontWeight: 600 }}>
                            <span>Discount</span><span>−₱{saved.toFixed(0)}</span>
                          </div>
                        </>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '15px' }}>
                        <span>Total</span><span>₱{discountedTotal.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* M3: sticky footer actions so Save is always visible */}
              </div>
              <div className="modal-actions modal-action-footer" style={{ flexShrink: 0, padding: '16px', borderTop: '1px solid #eee' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-lime" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VISIT QUICK-VIEW MODAL ── */}
      <ViewBookingModal 
        viewBooking={viewBooking} 
        setViewBooking={setViewBooking} 
        clients={clients} 
      />
    </>
  );
}

