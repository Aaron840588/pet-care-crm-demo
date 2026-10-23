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
    dialog?.querySelector('button')?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        const controls = dialog?.querySelectorAll('button:not(:disabled)');
        if (controls?.length) {
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onCancel]);

  const isDanger = tone === 'danger';

  return (
    <div className="overlay open" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="modal confirm-modal"
        style={{ maxWidth: '420px', borderRadius: '20px' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div id={titleId} className="modal-title" style={{ marginBottom: '10px' }}>
          {title}
        </div>
        <p id={descriptionId}
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
