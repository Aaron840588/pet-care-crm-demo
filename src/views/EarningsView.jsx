import React, { useState, useMemo } from 'react';
import { useData } from '../store/DataContext';
import {
  TrendingUp, ChevronUp, ChevronDown,
  CircleDollarSign, CheckCircle
} from 'lucide-react';
import { getDateParts } from '../utils/dates';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const toAmount = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const normalizeName = (value) => String(value ?? '').trim().toLocaleLowerCase('en-PH');
const fmtMoney = (value) => `₱${toAmount(value).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

export default function EarningsView() {
  const { invoices, clients } = useData();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Build last 6 months of data
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTHS[d.getMonth()] };
  });

  // BL7: null-safe date check for dateSaved
  const getMonthInvoices = (year, month) =>
    invoices.filter(inv => {
      const parts = getDateParts(inv.dateSaved);
      return !!parts && parts.y === year && (parts.m - 1) === month;
    });

  const monthlyData = last6.map(({ year, month, label }) => {
    const invs = getMonthInvoices(year, month);
    const total = invs.reduce((s, i) => s + toAmount(i.total), 0);
    const paidOnly = invs.reduce((s, i) => s + toAmount(i.paid), 0);
    const tip = invs.reduce((s, i) => s + toAmount(i.tip), 0);
    const collected = paidOnly + tip;
    return { label, year, month, total, collected, count: invs.length };
  });

  const maxTotal = Math.max(...monthlyData.map(m => m.total), 1);

  // Selected month detail
  const selInvoices = getMonthInvoices(selectedYear, selectedMonth);
  const selTotal = selInvoices.reduce((s, i) => s + toAmount(i.total), 0);
  const selPaidOnly = selInvoices.reduce((s, i) => s + toAmount(i.paid), 0);
  const selTip = selInvoices.reduce((s, i) => s + toAmount(i.tip), 0);
  const selCollected = selPaidOnly + selTip;
  const selOutstanding = Math.max(0, selTotal - selPaidOnly);

  // All-time stats
  const allTotal = invoices.reduce((s, i) => s + toAmount(i.total), 0);
  const allPaidOnly = invoices.reduce((s, i) => s + toAmount(i.paid), 0);
  const allTip = invoices.reduce((s, i) => s + toAmount(i.tip), 0);
  const allCollected = allPaidOnly + allTip;
  const allOutstanding = Math.max(0, allTotal - allPaidOnly);

  // U10: match by clientId (stored on invoice) if available, else fallback to name match
  const clientTotals = useMemo(() => {
    const fallbackClientIdByName = new Map();
    clients.forEach((client) => {
      const name = normalizeName(client.name);
      if (name && !fallbackClientIdByName.has(name)) fallbackClientIdByName.set(name, client.id);
    });

    return clients.map(c => {
      const cInvs = invoices.filter(i =>
        i.clientId
          ? i.clientId === c.id
          : fallbackClientIdByName.get(normalizeName(i.toName)) === c.id
      );
      return {
        id:    c.id,
        name:  c.name,
        total: cInvs.reduce((s, i) => s + toAmount(i.total), 0),
        paid:  cInvs.reduce((s, i) => s + toAmount(i.paid), 0),
        tip:   cInvs.reduce((s, i) => s + toAmount(i.tip), 0),
        count: cInvs.length,
      };
    }).filter(c => c.count > 0).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [clients, invoices]);
  const topClientTotal = Math.max(clientTotals[0]?.total || 0, 1);

  // Month-over-month change
  const curr = monthlyData[5];
  const prev = monthlyData[4];
  const change = prev.total > 0 ? ((curr.total - prev.total) / prev.total * 100).toFixed(0) : null;

  return (
    <>
      <div className="ph">
        <div>
          <h2>Earnings Summary</h2>
          <p>Monthly income overview and client breakdown</p>
        </div>
      </div>

      {/* ── ALL-TIME STATS ── */}
      <div className="stats-row" style={{ marginBottom: '22px' }}>
        {[
          { label: 'Total Invoiced', val: fmtMoney(allTotal), sub: 'all time', color: '#4a90d9', bg: '#eef4fc' },
          { label: 'Total Collected', val: fmtMoney(allCollected), sub: 'payments + tips', color: '#3fa85f', bg: '#e6f7ed' },
          { label: 'Total Tips 💝', val: fmtMoney(allTip), sub: 'extra earned', color: '#d4a373', bg: '#faeedd' },
          { label: 'Outstanding', val: fmtMoney(allOutstanding), sub: 'still to collect', color: '#d94f4f', bg: '#fff0f0' },
          { label: 'This Month', val: fmtMoney(selTotal), sub: MONTHS[selectedMonth] + ' ' + selectedYear, color: '#9b59b6', bg: '#f5eeff' },
        ].map(({ label, val, sub, color, bg }) => (
          <div key={label} style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ background: bg, borderRadius: '10px', padding: '10px', flexShrink: 0 }}>
              <CircleDollarSign size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--gray)', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1.1 }}>{val}</div>
              <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '2px' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="earnings-grid">

        {/* ── 6-MONTH BAR CHART ── */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px' }}>📈 Monthly Revenue</div>
            {change !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px',
                borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                background: Number(change) >= 0 ? '#e6f7ed' : '#fff0f0',
                color: Number(change) >= 0 ? 'var(--green)' : 'var(--red)'
              }}>
                {Number(change) >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {Math.abs(change)}% vs last month
              </div>
            )}
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '180px', marginBottom: '12px' }}>
            {monthlyData.map((m, i) => {
              const totalH = Math.round((m.total / maxTotal) * 160);
              const collH = Math.round((m.collected / maxTotal) * 160);
              const isSelected = m.month === selectedMonth && m.year === selectedYear;
              return (
                <div
                  key={i}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  onClick={() => { setSelectedMonth(m.month); setSelectedYear(m.year); }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: isSelected ? 'var(--black)' : 'var(--gray)' }}>
                    {m.total > 0 ? fmtMoney(m.total) : '—'}
                  </div>
                  <div style={{ width: '100%', display: 'flex', gap: '3px', alignItems: 'flex-end', justifyContent: 'center', height: '160px' }}>
                    {/* Total bar */}
                    <div style={{
                      flex: 1, maxWidth: '24px', height: `${totalH}px`, borderRadius: '4px 4px 0 0',
                      background: isSelected ? 'var(--lime-dark)' : 'var(--lime-pale)',
                      transition: 'all .2s', minHeight: m.total > 0 ? '4px' : '0'
                    }} />
                    {/* Collected bar */}
                    {m.collected > 0 && (
                      <div style={{
                        flex: 1, maxWidth: '24px', height: `${collH}px`, borderRadius: '4px 4px 0 0',
                        background: isSelected ? 'var(--green)' : '#b5e6c5',
                        transition: 'all .2s', minHeight: '4px'
                      }} />
                    )}
                  </div>
                  <div style={{
                    fontSize: '11px', fontWeight: isSelected ? 800 : 500,
                    color: isSelected ? 'var(--black)' : 'var(--gray)',
                    background: isSelected ? 'var(--lime)' : 'transparent',
                    padding: '2px 6px', borderRadius: '6px'
                  }}>{m.label}</div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--gray)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '12px', height: '12px', background: 'var(--lime-dark)', borderRadius: '3px', display: 'inline-block' }} />
              Invoiced
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '12px', height: '12px', background: 'var(--green)', borderRadius: '3px', display: 'inline-block' }} />
              Collected
            </span>
          </div>
        </div>

        {/* ── SELECTED MONTH DETAIL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ margin: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>
              {MONTHS[selectedMonth]} {selectedYear}
            </div>
            {selInvoices.length === 0 ? (
              <p style={{ color: 'var(--gray)', fontSize: '13px', fontStyle: 'italic' }}>No invoices this month.</p>
            ) : (
              <>
                {[
                  { label: 'Invoiced', val: selTotal, color: 'var(--black)' },
                  { label: 'Collected', val: selCollected, color: 'var(--green)' },
                  { label: 'Tips 💝', val: selTip, color: '#b8860b' },
                  { label: 'Outstanding', val: selOutstanding, color: selOutstanding > 0 ? 'var(--red)' : 'var(--green)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f4f4f0' }}>
                    <span style={{ fontSize: '13px', color: 'var(--gray)', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: row.color }}>{fmtMoney(row.val)}</span>
                  </div>
                ))}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '8px' }}>Invoices this month</div>
                  {selInvoices.map(inv => {
                    const bal = Math.max(0, toAmount(inv.total) - toAmount(inv.paid));
                    return (
                      <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: '12px', borderBottom: '1px solid #f8f8f8' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{inv.toName}</div>
                          <div style={{ color: 'var(--gray)', fontSize: '11px' }}>{inv.baseServiceName || '—'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700 }}>{fmtMoney(inv.total)}</div>
                          {Number(inv.tip) > 0 && <div style={{ color: '#b8860b', fontSize: '10.5px', fontWeight: 600 }}>+ {fmtMoney(inv.tip)} tip</div>}
                          {bal > 0 && <div style={{ color: 'var(--red)', fontSize: '10px' }}>-{fmtMoney(bal)} unpaid</div>}
                          {bal <= 0 && <div style={{ color: 'var(--green)', fontSize: '10px' }}>✓ Paid</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── TOP CLIENTS ── */}
      {clientTotals.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>
            🏆 Top Clients by Revenue
          </div>
          {clientTotals.map((c, i) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: i < clientTotals.length - 1 ? '1px solid #f4f4f0' : 'none' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray)' }}>
                  {c.count} invoice{c.count !== 1 ? 's' : ''}
                  {Number(c.tip) > 0 && <span style={{ color: '#b8860b', fontWeight: 600 }}> • 💝 {fmtMoney(c.tip)} tip</span>}
                </div>
              </div>
              {/* Revenue bar */}
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '8px', background: '#f0f0ea', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(c.total / topClientTotal) * 100}%`, background: 'var(--lime-dark)', borderRadius: '4px', transition: 'width .5s' }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '13px', minWidth: '80px', textAlign: 'right', color: 'var(--black)' }}>
                  {fmtMoney(c.total)}
                </div>
              </div>
              <div>
                {c.paid >= c.total
                  ? <CheckCircle size={16} color="var(--green)" />
                  : <span style={{ fontSize: '11px', color: 'var(--orange)', fontWeight: 700 }}>-{fmtMoney(c.total - c.paid)}</span>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

