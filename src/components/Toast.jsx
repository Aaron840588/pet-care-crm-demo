import React, { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

// ── Toast notification system (U6, U7 — replaces alert/confirm) ───────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'success', duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(p => [...p, { id, msg, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const bg = {
    success: '#1a1a1a',
    error:   '#c0392b',
    warning: '#e08c30',
    info:    '#2980b9',
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {toasts.length > 0 && (
        <div role="status" aria-live="polite" aria-atomic="true" style={{
          position: 'fixed',
          bottom: 'calc(74px + var(--safe-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          pointerEvents: 'none',
          width: 'calc(100vw - 32px)',
          maxWidth: '380px',
        }}>
          {toasts.map(t => (
            <div
              key={t.id}
              style={{
                background: bg[t.type] || '#1a1a1a',
                color: '#fff',
                padding: '12px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.28)',
                animation: 'fadeIn .2s ease',
                width: '100%',
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              {t.msg}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
