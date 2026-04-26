import React, { useCallback, useState, useMemo } from 'react';
import { useData } from '../store/DataContext';
import { useToast } from '../components/Toast';
import { KeyRound, ReceiptText, CalendarCheck2, Users, TrendingUp, Plus, Check, Trash2, ChevronLeft, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import { fmtDate, dateSortValue } from '../utils/dates';

const getLocalTodayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getSessionLabel = (timeText) => {
  if (!timeText) return null;
  const t = timeText.toLowerCase();
  if ((t.includes('2x') || t.includes('twice')) || (t.includes('am') && t.includes('pm'))) return 'AM + PM';
  if (t.includes('am') || t.includes('morning'))   return 'AM';
  if (t.includes('pm') || t.includes('afternoon') || t.includes('evening')) return 'PM';
  return null;
};

const getServiceLabel = (b) => {
  if (b.daySchedule?.length > 0) {
    const svcs = [...new Set(b.daySchedule.map(d => d.service?.split('|')[0]).filter(Boolean))];
    return svcs.length === 1 ? svcs[0] : 'Multiple services';
  }
  return b.service?.split('|')[0] || '—';
};

const fmtMoney = (v) => `₱${Number(v || 0).toLocaleString('en-PH')}`;

// ─── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ bookings }) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // All dates in the current view month that have bookings
  const bookedDates = useMemo(() => {
    const set = new Set();
    bookings.forEach(b => {
      if (b.status === 'done') return;
      // iterate from startDate to endDate
      if (!b.startDate || !b.endDate) return;
      const [sy, sm, sd] = b.startDate.split('-').map(Number);
      const [ey, em, ed] = b.endDate.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd);
      const end   = new Date(ey, em - 1, ed);
      const cur   = new Date(start);
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = cur.getMonth();
        const d = cur.getDate();
        if (y === viewYear && m === viewMonth) {
          set.add(d);
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    return set;
  }, [bookings, viewYear, viewMonth]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayInView = today.getFullYear() === viewYear && today.getMonth() === viewMonth
    ? today.getDate() : null;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={16} color="#555" />
        </button>
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>{monthName}</span>
        <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={16} color="#555" />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const isToday   = day === todayInView;
          const isBooked  = bookedDates.has(day);
          return (
            <div key={day} style={{
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px', padding: '5px 2px',
              background: isToday ? 'var(--lime)' : isBooked ? '#f0fce8' : 'transparent',
              border: isToday ? '2px solid var(--lime-dark)' : isBooked ? '1.5px solid #c8e8a8' : '1.5px solid transparent',
              cursor: 'default',
            }}>
              <span style={{ fontSize: '12px', fontWeight: isToday ? 800 : isBooked ? 700 : 400, color: isToday ? '#111' : isBooked ? '#2a6e00' : '#555', lineHeight: 1 }}>
                {day}
              </span>
              {isBooked && (
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isToday ? '#111' : 'var(--lime-dark)', marginTop: '3px', display: 'block' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #eee', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#777' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--lime)', border: '1.5px solid var(--lime-dark)', display: 'inline-block' }} />
          Today
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#777' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f0fce8', border: '1.5px solid #c8e8a8', display: 'inline-block' }} />
          Pet-sit day
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardView({ setActiveTab }) {
  const { bookings, clients, invoices, reminders, errands, addReminder, toggleReminder, removeReminder, updateInvoice, updateBooking, updateErrand } = useData();
  const toast = useToast();
  const [newReminder, setNewReminder]       = useState('');
  const [markingDone, setMarkingDone]       = useState(null);

  const todayStr = useMemo(() => getLocalTodayStr(), []);

  const totalClients   = clients.length;
  const upcomingCount  = useMemo(() => bookings.filter(b => b.status === 'pending').length, [bookings]);
  const unpaidInvoices = useMemo(() => invoices.filter(i => (i.total - i.paid) > 0), [invoices]);
  const unpaidBalance  = useMemo(() => unpaidInvoices.reduce((sum, i) => sum + (i.total - i.paid), 0), [unpaidInvoices]);
  const keysPending    = useMemo(() => clients.filter(c => c.keyStatus === 'pending'), [clients]);
  const pendingErrands = useMemo(() => errands.filter(e => e.status === 'pending'), [errands]);

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState(null); // { invoice }
  const [paymentAmount, setPaymentAmount] = useState('');

  const todaysSchedule = useMemo(() =>
    bookings.filter(b => b.startDate <= todayStr && b.endDate >= todayStr && b.status !== 'done'),
    [bookings, todayStr]
  );

  const upcoming = useMemo(() =>
    bookings
      .filter(b => b.status === 'pending')
      .sort((a, b) => dateSortValue(a.startDate) - dateSortValue(b.startDate))
      .slice(0, 4),
    [bookings]
  );

  const todayFull = new Date().toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleMarkBookingDone = useCallback(async (b) => {
    setMarkingDone(b.id);
    try {
      await updateBooking(b.id, { status: 'done' });
      toast(`✅ ${b.clientName} marked as done!`);
    } catch (e) {
      console.error(e);
      toast('Could not update. Try again.', 'error');
    } finally {
      setMarkingDone(null);
    }
  }, [updateBooking, toast]);

  const handleMarkInvoicePaid = useCallback(async () => {
    if (!paymentModal) return;
    const inv = paymentModal;
    const adding = parseFloat(paymentAmount) || 0;
    if (adding <= 0) { toast('Enter a valid amount.', 'error'); return; }
    const paid    = Number(inv.paid  || 0);
    const total   = Number(inv.total || 0);
    const balance = total - paid;
    // Amount that goes toward clearing the balance
    const towardBalance = Math.min(adding, balance);
    const newPaid       = paid + towardBalance;
    // Anything above the balance is a tip
    const tipAdding     = Math.max(adding - balance, 0);
    const newTip        = Number(inv.tip || 0) + tipAdding;
    const updates = { paid: newPaid };
    if (tipAdding > 0) updates.tip = newTip;
    try {
      await updateInvoice(inv.id, updates);
      const isFull = newPaid >= total;
      if (tipAdding > 0) {
        toast(`✅ ${inv.toName} paid! 🎉 Tip: ₱${tipAdding.toLocaleString()}`);
      } else {
        toast(isFull ? `✅ ${inv.toName} fully paid!` : `Recorded ₱${adding.toLocaleString()} payment for ${inv.toName}.`);
      }
    } catch {
      toast('Unable to update. Try again.', 'error');
    } finally {
      setPaymentModal(null);
      setPaymentAmount('');
    }
  }, [paymentModal, paymentAmount, toast, updateInvoice]);

  const openPaymentModal = (inv) => {
    setPaymentModal(inv);
    setPaymentAmount('');
  };

  const openBookingWorkflow = useCallback((booking, workflow) => {
    if (!booking?.id || !setActiveTab) return;
    try {
      if (workflow === 'invoice') {
        sessionStorage.setItem('kats_invoice_booking_id', booking.id);
        setActiveTab('invoices');
      } else {
        sessionStorage.setItem('kats_report_booking_id', booking.id);
        setActiveTab('report-card');
      }
    } catch {
      toast('Could not open that shortcut. Try from the side menu.', 'error');
    }
  }, [setActiveTab, toast]);

  return (
    <div>
      {/* HERO */}
      <div className="hero-wrapper">
        <div className="hero-content">
          <div className="hc-super">
            🐾 Pet-sitting Dashboard
          </div>
          <h2 className="hc-title">
            Good day, Kat!
          </h2>
          <p className="hc-date">{todayFull}</p>
        </div>
        <div className="hero-stats">
          <div className="hs-label">Active Today</div>
          <div className="hs-val">{todaysSchedule.length}</div>
          <div className="hs-sub">sitting{todaysSchedule.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* MEMORIAL */}
      <div className="memorial-wrapper">
        <div className="memorial-inner">
          <div className="memorial-img">
            <img src="/kathleen-gonzales.webp" alt="Ribbon memorial" width="768" height="1024" loading="eager" />
          </div>
          <div className="memorial-text">
            <div className="mt-label">In Loving Memory</div>
            <div className="mt-title">I&apos;m so proud of you, Mommy.</div>
            <p className="mt-sub">Always loved. Always remembered.</p>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-row" style={{ marginBottom: '22px' }}>
        {[
          { icon: Users,          label: 'Clients',       val: totalClients,            sub: 'total registered',  color: '#4a90d9', bg: '#eef4fc' },
          { icon: CalendarCheck2, label: 'Upcoming',      val: upcomingCount,           sub: 'bookings queued',   color: '#e08c30', bg: '#fff8ee' },
          { icon: TrendingUp,     label: 'Unpaid Balance',val: fmtMoney(unpaidBalance), sub: 'to collect',        color: '#d94f4f', bg: '#fff0f0' },
          { icon: KeyRound,       label: 'Keys Pending',  val: keysPending.length,      sub: 'not yet received',  color: '#9b59b6', bg: '#f5eeff' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="stat-card" style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{ background: item.bg, borderRadius: '10px', padding: '10px', flexShrink: 0 }}>
                <Icon size={20} color={item.color} />
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--gray)', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.1 }}>{item.val}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '2px' }}>{item.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PENDING ERRANDS */}
      {pendingErrands.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px' }}>🛒</span> Check-off Errands / Pabili
            </h3>
            <span style={{ fontSize: '11px', background: '#ffebeb', color: '#dd5050', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>
              {pendingErrands.length} needed
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingErrands.map(errand => {
              const client = clients.find(c => c.id === errand.clientId);
              return (
                <div key={errand.id} className="card" style={{ padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#fffcfc' }}>
                  <button 
                    onClick={() => updateErrand(errand.id, { status: 'done' })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#ccc' }}
                  >
                    <CheckCircle2 size={22} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#222', fontSize: '14px' }}>{errand.title}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', display: 'flex', gap: '8px' }}>
                      {client && <span>👤 {client.name}</span>}
                      {errand.amount && <span style={{ color: 'var(--green)' }}>💰 ₱{errand.amount}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="dash-grid">

        {/* TODAY'S ITINERARY */}
        <div className="card" style={{ margin: 0, borderTop: '4px solid var(--lime)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>📋 Today&apos;s Itinerary</div>
            <span style={{ background: todaysSchedule.length > 0 ? 'var(--lime)' : '#f0f0f0', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, color: todaysSchedule.length > 0 ? '#111' : '#999' }}>
              {todaysSchedule.length === 0 ? 'Rest day 🌿' : `${todaysSchedule.length} visit${todaysSchedule.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {todaysSchedule.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🐾</div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#555' }}>No visits today!</p>
              <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--gray)' }}>Enjoy your well-deserved rest, Kat!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todaysSchedule.map((b, idx) => {
                const todayEntry  = b.daySchedule?.find(d => d.date === todayStr);
                const displayTime = todayEntry?.time || b.timeText || '';
                const session     = getSessionLabel(displayTime);
                const serviceName = todayEntry?.service?.split('|')[0] || getServiceLabel(b);
                const isLoading   = markingDone === b.id;

                return (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px',
                    background: '#f9fcf4', border: '1.5px solid #e0ecd0',
                  }}>
                    {/* Step number */}
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--lime)', color: '#111', fontWeight: 800, fontSize: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{b.clientName}</div>
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>{serviceName}</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px', alignItems: 'center' }}>
                        {displayTime ? (
                          <span style={{ background: '#e6f7ed', color: '#1a7a3a', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px' }}>
                            🕐 {displayTime}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic' }}>Time not set</span>
                        )}
                        {session && (
                          <span style={{
                            background: session.includes('+') ? '#e0f0ff' : session.includes('AM') ? '#fff8e0' : '#f0e8ff',
                            color: session.includes('+') ? '#005fa3' : session.includes('AM') ? '#7a5500' : '#5a0099',
                            borderRadius: '8px', padding: '2px 8px', fontWeight: 700, fontSize: '10px'
                          }}>{session}</span>
                        )}
                        <span style={{ fontSize: '11px', color: '#aaa' }}>ends {fmtDate(b.endDate)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, minWidth: '82px' }}>
                      <button
                        type="button"
                        onClick={() => openBookingWorkflow(b, 'invoice')}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '7px 9px', minHeight: '40px', borderRadius: '10px', cursor: 'pointer',
                          border: '1.5px solid #111', background: '#111',
                          fontWeight: 700, fontSize: '11px', color: '#fff',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <ReceiptText size={13} />
                        Invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => openBookingWorkflow(b, 'report')}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '7px 9px', minHeight: '40px', borderRadius: '10px', cursor: 'pointer',
                          border: '1.5px solid #d4d800', background: '#fdffd1',
                          fontWeight: 700, fontSize: '11px', color: '#555',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <CalendarCheck2 size={13} />
                        Report
                      </button>
                    {/* MARK AS DONE button */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleMarkBookingDone(b)}
                      style={{
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '7px 11px', minHeight: '40px', borderRadius: '10px', cursor: isLoading ? 'wait' : 'pointer',
                        border: '1.5px solid #b8e0a0', background: '#eafce8',
                        fontWeight: 700, fontSize: '11px', color: '#1a7a3a',
                        transition: 'all .15s', whiteSpace: 'nowrap',
                        opacity: isLoading ? 0.6 : 1,
                      }}
                    >
                      <Check size={13} />
                      {isLoading ? '…' : 'Done'}
                    </button>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PHYSICAL CALENDAR */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', marginBottom: '14px' }}>
            📅 Booking Calendar
          </div>
          <MiniCalendar bookings={bookings} />
        </div>

        {/* UPCOMING BOOKINGS */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-title">🗓 Upcoming Bookings</div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray)' }}>
              <CalendarCheck2 size={32} style={{ margin: '0 auto 8px', opacity: .3 }} />
              <p style={{ fontSize: '13px' }}>No upcoming bookings yet.</p>
            </div>
          ) : upcoming.map(b => {
            const [y, mo, d] = b.startDate.split('-').map(Number);
            return (
              <div key={b.id} className="list-item">
                <div className="date-badge">
                  <div className="db-day">{d}</div>
                  <div className="db-mon">{new Date(y, mo - 1, d).toLocaleString('default', { month: 'short' }).toUpperCase()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="li-main">{b.clientName}</div>
                  <div className="li-sub">{getServiceLabel(b)}</div>
                  <div className="li-sub">{fmtDate(b.startDate)} → {fmtDate(b.endDate)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* KEYS TO COLLECT */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-title">🔑 Keys to Collect</div>
          {keysPending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray)' }}>
              <KeyRound size={32} style={{ margin: '0 auto 8px', opacity: .3 }} />
              <p style={{ fontSize: '13px' }}>All keys received!</p>
            </div>
          ) : keysPending.map(c => (
            <div key={c.id} className="list-item">
              <div style={{ background: '#fff4e0', borderRadius: '10px', padding: '8px 10px', flexShrink: 0 }}>
                <KeyRound size={18} color="var(--orange)" />
              </div>
              <div>
                <div className="li-main">{c.name}</div>
                <div className="li-sub">{c.address || 'No address on file'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* UNPAID INVOICES */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>💸 Unpaid Invoices</div>
            {unpaidBalance > 0 && (
              <span style={{ background: '#fff0f0', color: 'var(--red)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 800 }}>
                {fmtMoney(unpaidBalance)} total
              </span>
            )}
          </div>
          {unpaidInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray)' }}>
              <ReceiptText size={32} style={{ margin: '0 auto 8px', opacity: .3 }} />
              <p style={{ fontSize: '13px' }}>All invoices cleared! 🎉</p>
            </div>
          ) : unpaidInvoices.map(inv => {
            const paid    = Number(inv.paid || 0);
            const total   = Number(inv.total || 0);
            const balance = total - paid;
            return (
              <div key={inv.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                <div style={{ background: '#fff0f0', borderRadius: '10px', padding: '8px 10px', flexShrink: 0, marginTop: '2px' }}>
                  <ReceiptText size={18} color="var(--red)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="li-main">{inv.toName}</div>
                  {/* Show paid amount + balance breakdown */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {paid > 0 && (
                      <span style={{ fontSize: '11px', background: '#eafce8', color: '#2a7a20', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', border: '1px solid #b8e0a0' }}>
                        Paid {fmtMoney(paid)}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', background: '#fff0f0', color: 'var(--red)', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', border: '1px solid #f0c0c0' }}>
                      Balance {fmtMoney(balance)}
                    </span>
                    <span style={{ fontSize: '11px', color: '#aaa' }}>
                      of {fmtMoney(total)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-xs btn-lime"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                  onClick={() => openPaymentModal(inv)}
                >
                  <Check size={11} /> Record Payment
                </button>
              </div>
            );
          })}
        </div>

        {/* REMINDERS */}
        <div className="card" style={{ margin: 0, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>📝 Quick Reminders</div>
            <span style={{ fontSize: '11px', color: 'var(--gray)' }}>{reminders.filter(r => !r.done).length} pending</span>
          </div>

          <div className="reminder-form">
            <input
              value={newReminder}
              onChange={e => setNewReminder(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newReminder.trim()) {
                  addReminder(newReminder.trim());
                  setNewReminder('');
                }
              }}
              placeholder="Add a reminder… (press Enter)"
              style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '16px', fontFamily: 'var(--font-body)', background: '#fafafa', color: 'var(--black)' }}
            />
            <button type="button" className="btn btn-lime btn-sm" onClick={() => { if (newReminder.trim()) { addReminder(newReminder.trim()); setNewReminder(''); } }}>
              <Plus size={16} /> Add
            </button>
          </div>

          {reminders.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: '13px', fontStyle: 'italic' }}>No reminders yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[...reminders]
                .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
                .map(r => (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '10px',
                    background: r.done ? '#f8f8f8' : '#fffef5',
                    border: `1.5px solid ${r.done ? '#eee' : 'var(--lime)'}`,
                    transition: 'all .15s',
                  }}>
                    <button type="button" onClick={() => toggleReminder(r.id, r.done)} style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: r.done ? 'var(--green)' : 'transparent',
                      border: r.done ? 'none' : '2px solid #ccc', transition: 'all .15s',
                    }}>
                      {r.done && <Check size={12} color="#fff" />}
                    </button>
                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, textDecoration: r.done ? 'line-through' : 'none', color: r.done ? 'var(--gray)' : 'var(--black)' }}>{r.text}</span>
                    <button type="button" onClick={() => removeReminder(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: '4px', borderRadius: '6px' }} aria-label="Remove reminder">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* PET BIOS SUMMARY */}
        {/* PET BIOS SUMMARY */}
        {clients.some(c => c.pets?.some(p => p.feedingTime || p.allergies || p.vetName || p.notes)) && (
          <div className="card" style={{ margin: 0, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}>🐾 Pet Bios</div>
              <span style={{ fontSize: '11px', color: 'var(--gray)' }}>
                {clients.reduce((n, c) => n + (c.pets?.filter(p => p.feedingTime || p.allergies || p.vetName || p.notes).length || 0), 0)} pets on file
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {clients.filter(c => c.pets?.some(p => p.feedingTime || p.allergies || p.vetName || p.notes)).map(client =>
                client.pets.filter(p => p.feedingTime || p.allergies || p.vetName || p.notes).map(pet => {
                  const isDog = (pet.type || '').toLowerCase() === 'dog';
                  const emoji = isDog ? '🐶' : '🐱';
                  const accentColor = isDog ? '#e08c30' : '#9b59b6';
                  const accentBg   = isDog ? '#fff8ee' : '#f5eeff';
                  return (
                    <div key={`${client.id}-${pet.id}`} style={{
                      background: '#fafcf7',
                      border: '1.5px solid #e0ecd0',
                      borderRadius: '14px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      {/* Pet header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                          {emoji}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#111' }}>{pet.name || 'Unnamed'}</div>
                          <div style={{ fontSize: '11px', color: accentColor, fontWeight: 700 }}>
                            {pet.type || 'Dog'} · <span style={{ color: '#888', fontWeight: 500 }}>{client.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info chips */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {pet.feedingTime && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#3a7c2a', background: '#e8fce4', padding: '2px 7px', borderRadius: '6px', flexShrink: 0 }}>🍽 Feed</span>
                            <span style={{ fontSize: '12px', color: '#444' }}>{pet.feedingTime}{pet.portionSize ? ` · ${pet.portionSize}` : ''}</span>
                          </div>
                        )}
                        {pet.allergies && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#b86a00', background: '#fff3e0', padding: '2px 7px', borderRadius: '6px', flexShrink: 0 }}>⚠️ Allergy</span>
                            <span style={{ fontSize: '12px', color: '#444' }}>{pet.allergies}</span>
                          </div>
                        )}
                        {pet.vetName && (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#2040a0', background: '#e8eeff', padding: '2px 7px', borderRadius: '6px', flexShrink: 0 }}>🏥 Vet</span>
                            <span style={{ fontSize: '12px', color: '#444' }}>{pet.vetName}{pet.vetPhone ? ` · ${pet.vetPhone}` : ''}</span>
                          </div>
                        )}
                        {pet.notes && (
                          <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '6px 9px', fontSize: '11px', color: '#666', fontStyle: 'italic', lineHeight: 1.5 }}>
                            {pet.notes}
                          </div>
                        )}
                        {!pet.feedingTime && !pet.allergies && !pet.vetName && !pet.notes && (
                          <div style={{ fontSize: '11px', color: '#bbb', fontStyle: 'italic' }}>No details added yet</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* PAYMENT MODAL */}
      {paymentModal && (() => {
        const inv     = paymentModal;
        const paid    = Number(inv.paid  || 0);
        const total   = Number(inv.total || 0);
        const balance = total - paid;
        const entered = parseFloat(paymentAmount) || 0;
        // How much of the entered amount goes towards the invoice balance
        const towardBalance = Math.min(entered, balance);
        const remaining     = Math.max(balance - entered, 0);
        // Any excess above the balance is automatically a tip
        const tipAmount     = Math.max(entered - balance, 0);
        return (
          <div className="overlay open" onClick={() => { setPaymentModal(null); setPaymentAmount(''); }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div className="modal-title" style={{ margin: 0 }}>Record Payment</div>
                <button type="button" onClick={() => { setPaymentModal(null); setPaymentAmount(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: '6px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Client name */}
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{inv.toName}</div>

              {/* Balance breakdown */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                {paid > 0 && (
                  <span style={{ background: '#eafce8', color: '#2a7a20', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', border: '1px solid #b8e0a0' }}>
                    Already paid {fmtMoney(paid)}
                  </span>
                )}
                <span style={{ background: '#fff0f0', color: 'var(--red)', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', border: '1px solid #f0c0c0' }}>
                  Balance {fmtMoney(balance)}
                </span>
                <span style={{ fontSize: '12px', color: '#aaa', padding: '4px 0' }}>of {fmtMoney(total)} total</span>
              </div>

              {/* Amount input */}
              <div className="fg" style={{ marginBottom: '6px' }}>
                <label>Amount Received (₱)</label>
                <input
                  type="number"
                  min="1"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder={`e.g. ${balance}`}
                  style={{ fontSize: '20px', fontWeight: 700 }}
                  autoFocus
                />
              </div>

              {/* Tip hint */}
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '14px', fontStyle: 'italic' }}>
                💡 Enter more than the balance to automatically record a tip!
              </div>

              {/* Quick fills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-xs btn-ghost" onClick={() => setPaymentAmount(String(balance))}>
                  Full {fmtMoney(balance)}
                </button>
                {[1000, 2000, 3000, 5000].filter(v => v !== balance).map(v => (
                  <button key={v} type="button" className="btn btn-xs btn-ghost" onClick={() => setPaymentAmount(String(v))}>
                    ₱{v.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* After this payment preview */}
              {entered > 0 && (
                <div style={{
                  background: tipAmount > 0 ? '#fffbf0' : '#f9fcf4',
                  border: `1.5px solid ${tipAmount > 0 ? '#f5d88a' : '#e0ecd0'}`,
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  {tipAmount > 0 ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#555' }}>Towards invoice</span>
                        <strong style={{ color: 'var(--green)' }}>{fmtMoney(towardBalance)} ✅ Fully paid!</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#555' }}>🎉 Tip</span>
                        <strong style={{ color: '#b8860b' }}>{fmtMoney(tipAmount)}</strong>
                      </div>
                    </>
                  ) : (
                    <div>
                      After this payment:{' '}
                      <strong style={{ color: remaining === 0 ? 'var(--green)' : 'var(--red)' }}>
                        {remaining === 0 ? '✅ Fully paid!' : `${fmtMoney(remaining)} still owed`}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                className="btn btn-lime"
                style={{ width: '100%', justifyContent: 'center', minHeight: '48px' }}
                onClick={handleMarkInvoicePaid}
                disabled={entered <= 0}
              >
                <Check size={16} />
                {tipAmount > 0
                  ? `Confirm ₱${towardBalance.toLocaleString()} + 🎉 ₱${tipAmount.toLocaleString()} tip`
                  : 'Confirm Payment'}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
