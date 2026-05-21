interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 400 }}
      >
        <div className="modal-head">
          <div
            className="node-icon"
            style={{
              background: 'var(--red-bg, #fef2f2)',
              color: 'var(--red, #dc2626)',
              width: 32,
              height: 32,
              fontSize: 16,
            }}
          >
            <i className="ti ti-alert-triangle" />
          </div>
          <div className="modal-title" id="confirm-dialog-title" style={{ flex: 1 }}>
            {title}
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="modal-body" id="confirm-dialog-desc">
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
            {message}
          </p>
        </div>
        <div className="modal-foot">
          <div />
          <div className="modal-foot-r">
            <button type="button" className="btn btn-sm" onClick={onClose}>
              {cancelLabel}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: 'var(--red, #dc2626)',
                borderColor: 'var(--red, #dc2626)',
                color: '#fff',
              }}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              <i className="ti ti-trash" /> {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
