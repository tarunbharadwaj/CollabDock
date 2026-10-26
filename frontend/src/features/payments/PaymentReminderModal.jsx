import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Modal } from '@/components/ui';
import { reminderMessage, whatsappUrl } from '@/lib/format';

export function PaymentReminderModal({ collaboration, open = Boolean(collaboration), onClose }) {
  if (!collaboration) return null;

  const message = reminderMessage(collaboration);
  const whatsapp = whatsappUrl(collaboration.brandPhone, message);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Reminder copied');
    } catch {
      toast.error('Could not copy the reminder');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Payment reminder" description="Review the message before opening WhatsApp. CollabDock never sends it automatically.">
      <div className="reminder-preview">
        <pre>{message}</pre>
        <div className="modal-actions">
          <Button variant="secondary" onClick={copyMessage}><Copy size={16}/> Copy message</Button>
          {whatsapp && <a className="button button-primary button-md" href={whatsapp} target="_blank" rel="noreferrer">Open WhatsApp <ExternalLink size={15}/></a>}
        </div>
        {!whatsapp && <p className="inline-note">No valid WhatsApp number is saved. Copy the message and send it through your preferred channel.</p>}
      </div>
    </Modal>
  );
}
