import { useState } from 'react';
import { Modal } from '../../shared/Modal.js';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function NewProjectModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName('');
    onClose();
  }

  return (
    <Modal open={open} title="New flow" onClose={onClose}>
      <form onSubmit={handleSubmit} className="fc-new-project-form">
        <div className="fc-field">
          <label>Flow name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. SFTP to Email"
            autoFocus
          />
        </div>
        <button type="submit" className="fc-btn fc-btn--primary" disabled={!name.trim()}>
          Create flow
        </button>
      </form>
    </Modal>
  );
}
