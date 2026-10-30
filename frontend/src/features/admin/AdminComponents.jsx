import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Modal, Textarea } from '@/components/ui';

export function AdminStatus({ value = 'Active' }) {
  return <span className={`admin-status admin-status-${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>;
}

export function AdminMetric({ icon: Icon, label, value, tone = 'violet', hint }) {
  return <article className={`admin-metric ${tone}`}><i><Icon size={19}/></i><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</article>;
}

export function AdminPagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return <div className="admin-pagination"><span>Page {meta.page} of {meta.pages}</span><div><Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}><ChevronLeft size={15}/> Previous</Button><Button variant="outline" size="sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next <ChevronRight size={15}/></Button></div></div>;
}

export function AdminConfirmModal({ open, onClose, title, description, actionLabel, tone = 'danger', onConfirm, loading, confirmationLabel, expectedConfirmation, children }) {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  useEffect(() => { if (open) { setReason(''); setConfirmation(''); } }, [open]);
  const ready = reason.trim().length >= 10 && (!expectedConfirmation || confirmation.trim().toLowerCase() === expectedConfirmation.toLowerCase());
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="admin-confirm-body">
        {tone === 'danger' && <div className="admin-warning"><AlertTriangle size={18}/><span>This action affects creator data and will be recorded.</span></div>}
        {children}
        <Textarea label="Reason" required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this change is required" rows="3"/>
        {expectedConfirmation && <label className="field"><span>{confirmationLabel}</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={expectedConfirmation}/></label>}
        <div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} disabled={!ready} onClick={() => onConfirm({ reason: reason.trim(), confirmation })}>{actionLabel}</Button></div>
      </div>
    </Modal>
  );
}

export function AdminError({ message = 'This admin view could not be loaded.', retry }) {
  return <div className="admin-state"><AlertTriangle size={24}/><h2>Unable to load data</h2><p>{message}</p>{retry && <Button onClick={retry}>Try again</Button>}</div>;
}
