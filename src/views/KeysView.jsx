import React, { useState, useCallback, useMemo } from 'react';
import { useData } from '../store/DataContext';
import { useToast } from '../components/Toast';
import { KeyRound, ShieldCheck, ChevronDown } from 'lucide-react';
import { todayLocalStr } from '../utils/dates';
import { KEY_STATUS_ORDER, getKeyStatusCounts, getOrderedKeyClients } from '../utils/keyTrackerLogic';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CYCLE = ['pending', 'received', 'returned', 'none'];

const STATUS_META = {
  pending:  { label: 'Pending',  emoji: '⏳', desc: 'Waiting to pick up',  accentColor: '#e08c30', bgColor: '#fff9f0', borderColor: '#e08c30' },
  received: { label: 'Received', emoji: '✅', desc: 'Key is with you',     accentColor: '#3fa85f', bgColor: '#f2fcf5', borderColor: '#3fa85f' },
  returned: { label: 'Returned', emoji: '🔁', desc: 'Returned to owner',   accentColor: '#6b6b6b', bgColor: '#f5f5f5', borderColor: '#aaa'    },
  none:     { label: 'No Key',   emoji: '—',  desc: 'Not tracking',        accentColor: '#bbb',    bgColor: '#fafafa', borderColor: '#ddd'    },
};

const fmtTs = (ts) => {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return null; }
};

// ── Status badge button ───────────────────────────────────────────────────────
function StatusBadge({ status, onClick }) {
  const m = STATUS_META[status] || STATUS_META.none;
  return (
    <button
      onClick={onClick}
      title="Tap to change status"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '7px 14px', borderRadius: '20px', border: 'none',
        background: m.bgColor, cursor: 'pointer', touchAction: 'manipulation',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px',
        color: m.accentColor, boxShadow: `0 0 0 2px ${m.borderColor}`,
        transition: 'transform .1s', WebkitTapHighlightColor: 'transparent',
        minHeight: '40px',
      }}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <span>{m.emoji}</span>
      <span>{m.label}</span>
      <ChevronDown size={12} style={{ opacity: 0.7 }} />
    </button>
  );
}

// ── Status picker dropdown ────────────────────────────────────────────────────
function StatusDropdown({ current, onSet, onClose }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 700,
      background: '#fff', borderRadius: '14px', padding: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minWidth: '205px',
      border: '1px solid #eee',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#aaa', padding: '4px 10px 8px' }}>
        Set key status
      </div>
      {STATUS_CYCLE.map(s => {
        const m   = STATUS_META[s];
        const sel = s === current;
        return (
          <button
            key={s}
            onClick={() => { onSet(s); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 12px', borderRadius: '10px',
              border: 'none', background: sel ? 'var(--lime-pale)' : 'transparent',
              cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              minHeight: '48px',
            }}
          >
            <span style={{ fontSize: '18px', width: '26px', textAlign: 'center' }}>{m.emoji}</span>
            <div>
              <div style={{ fontWeight: sel ? 800 : 600, fontSize: '13px', color: sel ? 'var(--black)' : '#333' }}>
                {m.label}
                {sel && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#aaa', fontWeight: 400 }}>current</span>}
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>{m.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Individual key card ───────────────────────────────────────────────────────
function KeyCard({ c, onSetStatus, openDropdown, setOpenDropdown }) {
  const meta    = STATUS_META[c.keyStatus] || STATUS_META.none;
  const history = c.keyStatusHistory || [];
  const isOpen  = openDropdown === c.id;

  return (
    <div className="card" style={{
      margin: 0, position: 'relative', overflow: 'visible',
      borderTop: `4px solid ${meta.borderColor}`,
      padding: '20px',
      zIndex: isOpen ? 680 : 1,
    }}>
      {/* Watermark icon */}
      <div style={{
        position: 'absolute', top: '-8px', right: '8px',
        color: meta.accentColor, opacity: 0.06, transform: 'rotate(18deg)',
        pointerEvents: 'none', zIndex: 0,
      }}>
        <KeyRound size={110} />
      </div>

      {/* Header: name + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--black)', marginBottom: '2px' }}>{c.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{c.address || <i>No address on file</i>}</div>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <StatusBadge status={c.keyStatus} onClick={() => setOpenDropdown(isOpen ? null : c.id)} />
          {isOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 640 }} onClick={() => setOpenDropdown(null)} />
              <StatusDropdown current={c.keyStatus} onSet={(s) => onSetStatus(c, s)} onClose={() => setOpenDropdown(null)} />
            </>
          )}
        </div>
      </div>

      {/* Physical details box */}
      <div style={{
        background: meta.bgColor, borderRadius: '12px', padding: '12px 14px',
        marginBottom: '14px', border: `1px solid ${meta.borderColor}30`,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: meta.accentColor, marginBottom: '8px' }}>
          Physical Details
        </div>
        {c.keyDate && (
          <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
            <strong style={{ color: '#333' }}>Date Received:</strong> {c.keyDate}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#555' }}>
          <strong style={{ color: '#333' }}>Description:</strong> {c.keyNotes || <i style={{ color: '#aaa' }}>No description</i>}
        </div>
      </div>

      {/* Quick-action buttons */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        {STATUS_CYCLE.filter(s => s !== c.keyStatus && s !== 'none').map(s => {
          const m = STATUS_META[s];
          return (
            <button
              key={s}
              className="btn btn-ghost btn-sm"
              onClick={() => onSetStatus(c, s)}
              style={{ flex: '1 1 100px', justifyContent: 'center', fontSize: '13px', minHeight: '48px' }}
            >
              {m.emoji} Mark {m.label}
            </button>
          );
        })}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onSetStatus(c, 'none')}
          style={{ fontSize: '13px', color: 'var(--gray)', minHeight: '48px', flex: '1 1 100px' }}
          title="Remove from tracker"
        >
          × Remove
        </button>
      </div>

      {/* Status history */}
      {history.length > 0 && (
        <div style={{ marginTop: '14px', borderTop: '1px solid var(--gray-light)', paddingTop: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: '#aaa', marginBottom: '8px' }}>
            Status History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[...history].reverse().slice(0, 4).map((h, i) => {
              const m = STATUS_META[h.status] || STATUS_META.none;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '6px',
                    background: m.bgColor, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '12px', flexShrink: 0,
                    boxShadow: `inset 0 0 0 1px ${m.borderColor}60`,
                  }}>
                    {m.emoji}
                  </span>
                  <span style={{ fontWeight: 700, color: m.accentColor, minWidth: '58px' }}>{m.label}</span>
                  <span style={{ color: '#aaa' }}>{fmtTs(h.changedAt) || '—'}</span>
                </div>
              );
            })}
            {history.length > 4 && (
              <div style={{ fontSize: '10px', color: '#bbb', fontStyle: 'italic', marginTop: '2px' }}>
                + {history.length - 4} older entries
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function KeysView() {
  const { clients, updateClient } = useData();
  const toast = useToast();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  const clientsWithKeys = clients.filter(c => (c.keyStatus || 'none') !== 'none');
  const clientsNoKey    = clients.filter(c => !c.keyStatus || c.keyStatus === 'none');
  const keyStatusCounts = useMemo(() => getKeyStatusCounts(clients), [clients]);
  const orderedKeyClients = useMemo(() => getOrderedKeyClients(clients, activeFilter), [clients, activeFilter]);

  const setKeyStatus = useCallback(async (client, newStatus) => {
    try {
      const now = new Date().toISOString();
      const prev = client.keyStatusHistory || [];
      const nextKeyDate = newStatus === 'received'
        ? todayLocalStr()
        : newStatus === 'pending' || newStatus === 'none'
        ? null
        : (client.keyDate || null);
      await updateClient(client.id, {
        keyStatus:        newStatus,
        keyStatusHistory: [...prev, { status: newStatus, changedAt: now }],
        keyDate:          nextKeyDate,
      });
      toast(`🔑 ${client.name} → ${STATUS_META[newStatus]?.label || newStatus}`);
    } catch {
      toast('Failed to update key status.', 'error');
    }
  }, [updateClient, toast]);

  return (
    <div className="keys-view">
      {/* Page header */}
      <div className="ph">
        <div>
          <h2>🔑 Key Tracker</h2>
          <p>Tap a status badge to update it instantly</p>
        </div>
        <div className="ph-actions">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {KEY_STATUS_ORDER.map(s => {
              const m   = STATUS_META[s];
              const cnt = keyStatusCounts[s] || 0;
              const selected = activeFilter === s;
              return (
                <button key={s} type="button" aria-label={`Filter ${m.label} keys`} aria-pressed={selected} onClick={() => setActiveFilter(selected ? null : s)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: selected ? m.accentColor : m.bgColor, borderRadius: '20px',
                  padding: '5px 13px', fontSize: '12px', fontWeight: 700,
                  boxShadow: `inset 0 0 0 1.5px ${m.borderColor}`, color: selected ? '#fff' : m.accentColor,
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  minHeight: '40px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  {m.emoji} {cnt} {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active key cards */}
      {clientsWithKeys.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{
            margin: '0 auto 16px',
            background: 'var(--lime-pale)', width: '78px', height: '78px',
            borderRadius: '39px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#889922',
          }}>
            <ShieldCheck size={38} />
          </div>
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>All Keys Returned</h3>
          <p style={{ color: 'var(--gray)', fontSize: '13px', lineHeight: 1.6 }}>
            No active keys. When you pick one up, update the client profile<br />in the Clients tab or mark it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {orderedKeyClients.map(c => (
            <KeyCard
              key={c.id}
              c={c}
              onSetStatus={setKeyStatus}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
            />
          ))}
          {orderedKeyClients.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--gray)' }}>
              No {STATUS_META[activeFilter]?.label.toLowerCase()} keys right now.
            </div>
          )}
        </div>
      )}

      {/* Clients without active keys */}
      {clientsNoKey.length > 0 && (
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
            marginBottom: '12px', color: 'var(--gray)',
          }}>
            Clients without active keys
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {clientsNoKey.map(c => (
              <div key={c.id} style={{
                background: '#fff', borderRadius: '14px', padding: '14px 16px',
                boxShadow: 'var(--shadow)', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.address || 'No address'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap-reverse', justifyContent: 'flex-end', flex: '1 1 160px' }}>
                  <button
                    className="btn btn-xs"
                    style={{ background: '#fff9f0', color: '#e08c30', border: '1.5px solid #e08c3060', borderRadius: '20px', whiteSpace: 'nowrap', minHeight: '36px' }}
                    onClick={() => setKeyStatus(c, 'pending')}
                  >
                    ⏳ Pending
                  </button>
                  <button
                    className="btn btn-xs"
                    style={{ background: '#f2fcf5', color: '#3fa85f', border: '1.5px solid #3fa85f60', borderRadius: '20px', whiteSpace: 'nowrap', minHeight: '36px' }}
                    onClick={() => setKeyStatus(c, 'received')}
                  >
                    ✅ Received
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
