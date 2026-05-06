import React from 'react';
import { X, CalendarPlus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { fmtDate, fmtDayLabel } from '../../utils/dates';
import { calcDayDiscount } from '../../utils/calculations';



const getDiscountTotal = (schedule = []) => schedule.reduce((sum, day) => sum + calcDayDiscount(day), 0);



export default function ViewBookingModal({ viewBooking, setViewBooking, clients }) {
  if (!viewBooking) return null;

  const vb = viewBooking;
  const client = clients.find(c => c.id === vb.clientId);
  const dayDiscountTotal = getDiscountTotal(vb.daySchedule || []);
  const hasLegacyDiscount = vb.discount?.mode && vb.discount.mode !== 'none' && Number(vb.discount.value) > 0;
  const hasDiscount = dayDiscountTotal > 0 || hasLegacyDiscount;
  const statusLabel = vb.status === 'tentative'
    ? 'Needs confirmation'
    : vb.status === 'active'
      ? 'Active'
      : vb.status === 'done'
        ? 'Done'
        : 'Upcoming';
  const statusStyle = vb.status === 'tentative'
    ? { background: '#fff8d7', color: '#7c6515', border: '1px dashed #d9c166' }
    : { background: 'var(--lime)', color: 'var(--black)', border: '1px solid var(--lime)' };

  return (
    <div className="overlay open" onClick={() => setViewBooking(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700 }}>🐾 Visit Details</div>
          <button
            onClick={() => setViewBooking(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: '6px' }}
          >
            <X size={22} />
          </button>
        </div>

        <div style={{ background: 'var(--black)', borderRadius: '14px', padding: '20px', marginBottom: '16px', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'var(--lime)' }}>
            {vb.clientName}
          </div>
          <div style={{ fontSize: '13px', color: '#ccc', marginTop: '6px', fontWeight: 500, letterSpacing: '.03em' }}>
            {client?.address || 'No address saved'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <span className="badge" style={statusStyle}>{statusLabel}</span>
          </div>
        </div>

        <div className="modal-content-scroller">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: '#fafafa', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Dates</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{fmtDate(vb.startDate)}<br />to {fmtDate(vb.endDate)}</div>
            </div>
            <div style={{ background: '#fafafa', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Time</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{vb.timeText || '—'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: '#fafafa', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Base Service</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{vb.service?.split('|')[0] || '—'}</div>
            </div>
            <div style={{ background: '#fafafa', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Total Due</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green)' }}>
                ₱{Number(vb.finalTotal || 0).toLocaleString()}
                {hasDiscount && <span style={{ fontSize: '11px', color: 'var(--red)', display: 'block', fontWeight: 600 }}>Includes Discount</span>}
              </div>
            </div>
          </div>

          {vb.daySchedule?.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>Daily Breakdown</div>
              <div style={{ border: '1px solid #ebebdc', borderRadius: '10px', overflow: 'hidden' }}>
                {vb.daySchedule.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i === vb.daySchedule.length - 1 ? 'none' : '1px solid #f4f4f0', background: i % 2 === 0 ? '#fff' : '#fafaf5' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{fmtDayLabel(d.date)}</div>
                      {d.service && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{d.service.split('|')[0]}</div>}
                      {calcDayDiscount(d) > 0 && <div style={{ fontSize: '10px', color: 'var(--red)', fontWeight: 600, marginTop: '2px' }}>-₱{calcDayDiscount(d)} discount</div>}
                    </div>
                    {d.time && <div className="time-chip" style={{ margin: 0 }}>{d.time}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {vb.notes && (
            <div style={{ background: '#f0f4ff', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: '6px' }}>📝 Booking Notes</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6 }}>{vb.notes}</div>
            </div>
          )}
        </div>
        <div className="modal-action-footer">
          <button className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setViewBooking(null)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
