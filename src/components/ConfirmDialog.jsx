import React, { useEffect } from 'react';

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
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
    };
  }, [onCancel]);

  const isDanger = tone === 'danger';

  return (
    <div className="overlay open" onClick={onCancel}>
      <div
        className="modal confirm-modal"
        style={{ maxWidth: '420px', borderRadius: '20px' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-title" style={{ marginBottom: '10px' }}>
          {title}
        </div>
        <p
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
