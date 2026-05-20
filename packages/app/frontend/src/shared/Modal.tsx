import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fc-modal-backdrop" onClick={onClose}>
      <div className="fc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fc-modal__header">
          <span className="fc-modal__title">{title}</span>
          <button className="fc-modal__close" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="fc-modal__body">{children}</div>
      </div>
    </div>
  );
}
