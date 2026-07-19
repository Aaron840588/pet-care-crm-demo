import React, { useEffect, useId, useRef } from 'react';

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll('button:not([disabled])') ?? [];
    focusable[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      if (event.key === 'Tab' && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onCancel]);

  const isDanger = tone === 'danger';

  return (
    <div className="overlay open" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="modal confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        style={{ maxWidth: '420px', borderRadius: '20px' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div id={titleId} className="modal-title" style={{ marginBottom: '10px' }}>
          {title}
        </div>
        <p
          id={descriptionId}
          style={{
            color: 'var(--gray)',
            fontSize: '13px',
            lineHeight: 1.6,
            marginBottom: '18px',
          }}
        >
          {description}
        </p>
        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-lime'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
