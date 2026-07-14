import React from 'react';
import { fmtGcash } from '../../utils/dates';

// ⭐ Struck: renders a strikethrough that html-to-image can capture
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

export default function InvoicePreviewCard({ invoiceRef, data, lineItems, lineCalcs, fullTotal, grandTotal, balance }) {
  return (
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
                  <tr className="inv-tbl-row" style={isErrand ? { background: '#F5F882' } : {}}>
                    <td className="inv-col-service">
                      <div className="inv-svc-name">{li.customName || '—'}</div>
                      {li.subtitle && <div className="inv-svc-sub">{li.subtitle}</div>}
                      {li.note && <div className="inv-day-note">{li.note}</div>}
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
            <span>₱{balance.toFixed(0)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
