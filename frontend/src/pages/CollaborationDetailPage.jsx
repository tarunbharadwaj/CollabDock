import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarClock, CalendarDays, Check, ContactRound, FileText, History,
  IndianRupee, Info, ListChecks, Mail, MessageCircleMore, Pencil, Phone, Plus,
  Trash2, WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, apiMessage } from '@/services/api';
import { inr, shortDate } from '@/lib/format';
import { Button, EmptyState, Input, Modal, Select, Skeleton, Textarea } from '@/components/ui';
import { PaymentBadge, StatusBadge } from '@/components/Badges';
import { RecordPaymentModal } from '@/features/payments/RecordPaymentModal';
import { PaymentReminderModal } from '@/features/payments/PaymentReminderModal';
import { CollaborationForm } from '@/features/collaborations/CollaborationForm';
import { collaborationPayload } from './NewCollaborationPage';

const deliverableStatuses = ['Not Started', 'In Progress', 'Submitted', 'Approved', 'Published'];

export function CollaborationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [deliverableOpen, setDeliverableOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ['collaboration', id],
    queryFn: async () => (await api.get(`/collaborations/${id}`)).data.data,
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['collaboration', id] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['collaborations'] });
  };
  const add = useMutation({
    mutationFn: (values) => api.post(`/collaborations/${id}/deliverables`, values),
    onSuccess: () => {
      toast.success('Deliverable added');
      setDeliverableOpen(false);
      refresh();
    },
    onError: (error) => toast.error(apiMessage(error)),
  });
  const updateDeliverable = useMutation({
    mutationFn: ({ deliverableId, status }) => api.patch(`/deliverables/${deliverableId}`, { status }),
    onSuccess: refresh,
    onError: (error) => toast.error(apiMessage(error)),
  });
  const update = useMutation({
    mutationFn: (values) => api.patch(`/collaborations/${id}`, collaborationPayload(values)),
    onSuccess: () => {
      toast.success('Collaboration updated');
      setEditOpen(false);
      refresh();
    },
    onError: (error) => toast.error(apiMessage(error)),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/collaborations/${id}`),
    onSuccess: () => {
      toast.success('Collaboration deleted');
      navigate('/app/collaborations');
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  if (isLoading) return <div className="page"><Skeleton className="detail-hero-skeleton"/><Skeleton className="panel-skeleton"/></div>;
  if (!item) return null;

  return (
    <div className="page detail-page">
      <Link className="back-link" to="/app/collaborations"><ArrowLeft size={16}/> Collaborations</Link>
      <section className="detail-overview-card">
        <header className="detail-hero">
          <div className="detail-brand-mark" aria-hidden="true">{item.brandName[0]}</div>
          <div className="detail-brand-copy">
            <span className="eyebrow">{item.platform} collaboration</span>
            <h1>{item.brandName}</h1>
            <p>{item.campaignTitle || 'Untitled campaign'}</p>
            <div className="badge-row"><StatusBadge value={item.status}/><PaymentBadge value={item.paymentStatus}/></div>
          </div>
          <div className="detail-actions">
            <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={16}/> Edit deal</Button>
            <Button className="detail-delete-button" variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} aria-label="Delete collaboration" title="Delete collaboration"><Trash2 size={18}/></Button>
          </div>
        </header>
        <div className="deal-summary">
          <article><i className="detail-metric-icon violet"><WalletCards size={17}/></i><span><small>Deal value</small><strong>{inr(item.dealValuePaisa)}</strong></span></article>
          <article><i className="detail-metric-icon green"><IndianRupee size={17}/></i><span><small>Received</small><strong className="success">{inr(item.receivedPaisa)}</strong></span></article>
          <article><i className="detail-metric-icon amber"><IndianRupee size={17}/></i><span><small>Outstanding</small><strong className={item.outstandingPaisa ? 'warning' : ''}>{inr(item.outstandingPaisa)}</strong></span></article>
          <article><i className="detail-metric-icon blue"><CalendarClock size={17}/></i><span><small>Payment due</small><strong>{shortDate(item.paymentDueDate)}</strong></span></article>
        </div>
      </section>

      <div className="detail-grid">
        <main>
          <section className="panel detail-section">
            <header className="detail-section-header">
              <div className="detail-section-heading"><i className="violet"><ListChecks size={18}/></i><span><h2>Deliverables</h2><p>{item.deliverables.length} item{item.deliverables.length !== 1 && 's'} promised for this deal</p></span></div>
              <Button variant="secondary" size="sm" onClick={() => setDeliverableOpen(true)}><Plus size={15}/> Add</Button>
            </header>
            {item.deliverables.length ? (
              <div className="checklist">
                {item.deliverables.map((deliverable) => (
                  <div key={deliverable._id}>
                    <button
                      className={`check-button ${['Approved', 'Published'].includes(deliverable.status) ? 'done' : ''}`}
                      onClick={() => updateDeliverable.mutate({ deliverableId: deliverable._id, status: deliverable.status === 'Published' ? 'Not Started' : 'Published' })}
                      aria-label={`Mark ${deliverable.title} as ${deliverable.status === 'Published' ? 'not started' : 'published'}`}
                    >
                      <Check size={15}/>
                    </button>
                    <span><strong>{deliverable.title}</strong><small>{deliverable.contentType}<b>{' · '}</b>{shortDate(deliverable.dueDate)}</small></span>
                    <Select
                      value={deliverable.status}
                      onChange={(event) => updateDeliverable.mutate({ deliverableId: deliverable._id, status: event.target.value })}
                      aria-label={`Status for ${deliverable.title}`}
                      className="checklist-select"
                    >
                      {deliverableStatuses.map((status) => <option key={status}>{status}</option>)}
                    </Select>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={CalendarDays} title="No deliverables yet" description="Add the content promised for this collaboration."/>}
          </section>

          <section className="panel detail-section">
            <header className="detail-section-header">
              <div className="detail-section-heading"><i className="green"><History size={18}/></i><span><h2>Payment history</h2><p>Every payment recorded for this deal</p></span></div>
              {item.outstandingPaisa > 0 && <Button variant="secondary" size="sm" onClick={() => setPaymentOpen(true)}><Plus size={15}/> Record</Button>}
            </header>
            {item.payments.length ? (
              <div className="payment-history">
                {item.payments.map((payment) => (
                  <div key={payment._id}>
                    <span className="payment-icon"><IndianRupee size={18}/></span>
                    <span><strong>{inr(payment.amountPaisa)}</strong><small>{payment.paymentMethod}{payment.referenceId ? ` · ${payment.referenceId}` : ''}</small></span>
                    <span><strong>{shortDate(payment.paymentDate)}</strong><small>Received</small></span>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={IndianRupee} title="No payments recorded" description="Record a full or partial payment when it arrives."/>}
          </section>
        </main>

        <aside>
          <section className="panel detail-aside">
            <header className="detail-aside-heading"><i className="blue"><Info size={17}/></i><div><h2>Deal details</h2><p>Campaign timeline</p></div></header>
            <dl>
              <div><dt>Start date</dt><dd>{shortDate(item.startDate)}</dd></div>
              <div><dt>Content deadline</dt><dd>{shortDate(item.deadline)}</dd></div>
              <div><dt>Platform</dt><dd>{item.platform}</dd></div>
            </dl>
          </section>
          <section className="panel detail-aside">
            <header className="detail-aside-heading"><i className="violet"><ContactRound size={17}/></i><div><h2>Brand contact</h2><p>Who to reach</p></div></header>
            {item.brandContactName && <p><span className="contact-icon">{item.brandContactName[0]}</span><strong>{item.brandContactName}</strong></p>}
            {item.brandEmail && <a href={`mailto:${item.brandEmail}`}><Mail size={15}/>{item.brandEmail}</a>}
            {item.brandPhone && <a href={`tel:${item.brandPhone}`}><Phone size={15}/>{item.brandPhone}</a>}
            {!item.brandContactName && !item.brandEmail && !item.brandPhone && <div className="detail-contact-empty"><ContactRound size={17}/><small>No contact details saved</small></div>}
          </section>
          <section className="panel detail-action-card">
            <header><div><h2>Deal actions</h2><p>Move this collaboration forward</p></div></header>
            <div className="aside-actions">
              {item.outstandingPaisa > 0 && <Button onClick={() => setPaymentOpen(true)}><IndianRupee size={16}/> Record payment</Button>}
              <Button variant="secondary" onClick={() => navigate(`/app/invoices/new?collaboration=${item._id}`)}><FileText size={16}/> Create invoice</Button>
              {item.outstandingPaisa > 0 && <Button variant="ghost" onClick={() => setReminderOpen(true)}><MessageCircleMore size={16}/> Payment reminder</Button>}
            </div>
          </section>
        </aside>
      </div>

      <RecordPaymentModal collaboration={item} open={paymentOpen} onClose={() => setPaymentOpen(false)}/>
      <PaymentReminderModal collaboration={item} open={reminderOpen} onClose={() => setReminderOpen(false)}/>
      <Modal open={deliverableOpen} onClose={() => setDeliverableOpen(false)} title="Add deliverable">
        <form className="modal-form" onSubmit={(event) => {
          event.preventDefault();
          add.mutate(Object.fromEntries(new FormData(event.currentTarget)));
        }}>
          <Input label="Title" name="title" required placeholder="e.g. Product launch reel"/>
          <Select label="Content type" name="contentType">
            <option>Instagram Reel</option><option>Instagram Story</option><option>Carousel Post</option>
            <option>Static Post</option><option>YouTube Video</option><option>Other</option>
          </Select>
          <Input label="Due date" name="dueDate" type="date"/>
          <Textarea label="Notes" name="notes" rows="2"/>
          <div className="modal-actions">
            <Button variant="ghost" onClick={() => setDeliverableOpen(false)}>Cancel</Button>
            <Button type="submit" loading={add.isPending}>Add deliverable</Button>
          </div>
        </form>
      </Modal>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit collaboration" size="modal-wide">
        <CollaborationForm initial={item} onSubmit={(values) => update.mutate(values)} loading={update.isPending}/>
      </Modal>
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this collaboration?" description="Deliverables and payment records will be removed. Existing invoices will be kept for your records." size="delete-confirm-modal">
        <div className="confirm-body">
          <p>This cannot be undone. Are you sure you want to delete <strong>{item.brandName}</strong>?</p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Keep collaboration</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
