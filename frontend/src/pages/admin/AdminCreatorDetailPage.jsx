import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, BriefcaseBusiness, FileText, Pencil, Plus, ReceiptIndianRupee, RotateCcw, ScrollText, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiMessage } from '@/services/api';
import { inr, shortDate, toPaisa, toRupees } from '@/lib/format';
import { AdminConfirmModal, AdminError, AdminPagination, AdminStatus } from '@/features/admin/AdminComponents';
import { Button, EmptyState, Input, Modal, MoneyInput, Select, Textarea } from '@/components/ui';

const tabs = [
  ['profile', 'Profile', UserRound],
  ['collaborations', 'Collaborations', BriefcaseBusiness],
  ['payments', 'Payments', ReceiptIndianRupee],
  ['invoices', 'Invoices', FileText],
  ['activity', 'Activity', ScrollText],
];

function ProfileEditor({ creator, open, onClose }) {
  const client = useQueryClient();
  const [form, setForm] = useState({});
  useEffect(() => { if (open) setForm({ displayName: creator.displayName || '', instagramHandle: creator.instagramHandle || '', niche: creator.niche || '', phone: creator.phone || '', businessName: creator.businessName || '', businessAddress: creator.businessAddress || '', invoicePrefix: creator.invoicePrefix || 'INV', onboardingCompleted: Boolean(creator.onboardingCompleted), reason: '' }); }, [open, creator]);
  const mutation = useMutation({
    mutationFn: () => api.patch(`/admin/users/${creator.uid}`, { reason: form.reason, changes: { displayName: form.displayName, instagramHandle: form.instagramHandle, niche: form.niche, phone: form.phone, businessName: form.businessName, businessAddress: form.businessAddress, invoicePrefix: form.invoicePrefix, onboardingCompleted: form.onboardingCompleted } }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['admin'] }); toast.success('Creator profile updated'); onClose(); },
    onError: (error) => toast.error(apiMessage(error)),
  });
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  return <Modal open={open} onClose={onClose} title="Edit creator profile" description="Sensitive payment details are intentionally unavailable." size="modal-lg"><form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}><div className="admin-form-grid"><Input label="Display name" required value={form.displayName || ''} onChange={set('displayName')}/><Input label="Instagram handle" value={form.instagramHandle || ''} onChange={set('instagramHandle')}/><Input label="Content niche" value={form.niche || ''} onChange={set('niche')}/><Input label="Phone number" value={form.phone || ''} onChange={set('phone')}/><Input label="Business name" value={form.businessName || ''} onChange={set('businessName')}/><Input label="Invoice prefix" required value={form.invoicePrefix || ''} onChange={set('invoicePrefix')}/></div><Textarea label="Business address" value={form.businessAddress || ''} onChange={set('businessAddress')} rows="3"/><label className="admin-check"><input type="checkbox" checked={Boolean(form.onboardingCompleted)} onChange={set('onboardingCompleted')}/><span><strong>Onboarding complete</strong><small>Allow the creator to enter their workspace.</small></span></label><Textarea label="Reason" required value={form.reason || ''} onChange={set('reason')} minLength="10" rows="3" placeholder="Explain why this profile is being changed"/><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={mutation.isPending} disabled={(form.reason || '').trim().length < 10}>Save changes</Button></div></form></Modal>;
}

function PaymentModal({ open, onClose, creator, payment, collaborations }) {
  const client = useQueryClient();
  const editing = Boolean(payment);
  const [form, setForm] = useState({});
  useEffect(() => {
    if (!open) return;
    setForm({ collaborationId: payment?.collaboration?._id || payment?.collaboration || collaborations[0]?._id || '', amount: payment ? String(toRupees(payment.amountPaisa)) : '', paymentDate: payment?.paymentDate?.slice(0, 10) || new Date().toISOString().slice(0, 10), paymentMethod: payment?.paymentMethod || 'Bank Transfer', notes: payment?.notes || '', reason: '' });
  }, [open, payment, collaborations]);
  const mutation = useMutation({
    mutationFn: () => {
      const values = { amountPaisa: toPaisa(form.amount), paymentDate: form.paymentDate, paymentMethod: form.paymentMethod, notes: form.notes };
      return editing ? api.patch(`/admin/payments/${payment._id}`, { reason: form.reason, changes: values }) : api.post(`/admin/users/${creator.uid}/payments`, { reason: form.reason, collaborationId: form.collaborationId, payment: values });
    },
    onSuccess: () => { client.invalidateQueries({ queryKey: ['admin'] }); toast.success(editing ? 'Payment corrected' : 'Payment recorded'); onClose(); },
    onError: (error) => toast.error(apiMessage(error)),
  });
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return <Modal open={open} onClose={onClose} title={editing ? 'Correct payment' : 'Record payment'} description="The collaboration balance will be recalculated automatically."><form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>{!editing && <Select label="Collaboration" required value={form.collaborationId || ''} onChange={set('collaborationId')} placeholder="Select collaboration">{collaborations.map((item) => <option key={item._id} value={item._id}>{item.brandName}</option>)}</Select>}<div className="admin-form-grid"><MoneyInput label="Amount received (₹)" required value={form.amount || ''} onValueChange={(value) => setForm((current) => ({ ...current, amount: value }))}/><Input label="Payment date" type="date" required value={form.paymentDate || ''} onChange={set('paymentDate')}/><Select label="Payment method" value={form.paymentMethod || 'Bank Transfer'} onChange={set('paymentMethod')}><option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>Other</option></Select></div><Textarea label="Notes" value={form.notes || ''} onChange={set('notes')} rows="2"/><Textarea label="Reason" required value={form.reason || ''} onChange={set('reason')} rows="3" minLength="10" placeholder="Explain why this payment is being recorded or corrected"/><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={mutation.isPending} disabled={!form.collaborationId && !editing || toPaisa(form.amount) <= 0 || (form.reason || '').trim().length < 10}>{editing ? 'Save correction' : 'Record payment'}</Button></div></form></Modal>;
}

function InvoiceReplacementModal({ invoice, onClose }) {
  const client = useQueryClient();
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (!invoice) return;
    setForm({ invoiceDate: invoice.invoiceDate.slice(0, 10), dueDate: invoice.dueDate.slice(0, 10), from: { ...invoice.from }, billTo: { ...invoice.billTo }, notes: invoice.notes || '', lineItems: invoice.lineItems.map((item) => ({ description: item.description, quantity: item.quantity, rate: String(toRupees(item.ratePaisa)) })), reason: '' });
  }, [invoice]);
  const mutation = useMutation({
    mutationFn: () => api.post(`/admin/invoices/${invoice._id}/void-and-recreate`, { reason: form.reason, invoice: { invoiceDate: form.invoiceDate, dueDate: form.dueDate, from: form.from, billTo: form.billTo, notes: form.notes, lineItems: form.lineItems.map((item) => ({ description: item.description, quantity: Number(item.quantity), ratePaisa: toPaisa(item.rate) })) } }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['admin'] }); toast.success('Invoice voided and replacement created'); onClose(); },
    onError: (error) => toast.error(apiMessage(error)),
  });
  if (!form) return null;
  const field = (group, key) => (event) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: event.target.value } }));
  const updateLine = (index, key, value) => setForm((current) => ({ ...current, lineItems: current.lineItems.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  return <Modal open={Boolean(invoice)} onClose={onClose} title="Void and recreate invoice" description={`${invoice.invoiceNumber} will remain in history with a VOID mark.`} size="modal-lg"><form className="admin-edit-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}><div className="admin-form-grid"><Input label="Invoice date" type="date" required value={form.invoiceDate} onChange={(event) => setForm((current) => ({ ...current, invoiceDate: event.target.value }))}/><Input label="Due date" type="date" required value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}/><Input label="From name" required value={form.from.name} onChange={field('from', 'name')}/><Input label="From email" type="email" value={form.from.email || ''} onChange={field('from', 'email')}/><Input label="Bill to" required value={form.billTo.name} onChange={field('billTo', 'name')}/><Input label="Bill to email" type="email" value={form.billTo.email || ''} onChange={field('billTo', 'email')}/></div><div className="admin-line-items"><strong>Line items</strong>{form.lineItems.map((item, index) => <div key={index}><Input aria-label={`Description ${index + 1}`} value={item.description} onChange={(event) => updateLine(index, 'description', event.target.value)}/><Input aria-label={`Quantity ${index + 1}`} type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)}/><MoneyInput aria-label={`Rate ${index + 1}`} value={item.rate} onValueChange={(value) => updateLine(index, 'rate', value)}/></div>)}</div><Textarea label="Notes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows="2"/><Textarea label="Reason" required value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} rows="3" minLength="10"/><div className="modal-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={mutation.isPending} disabled={form.reason.trim().length < 10}>Void and create replacement</Button></div></form></Modal>;
}

export function AdminCreatorDetailPage() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [tab, setTab] = useState('profile');
  const [page, setPage] = useState(1);
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountAction, setAccountAction] = useState(null);
  const [paymentEditor, setPaymentEditor] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [replaceInvoice, setReplaceInvoice] = useState(null);
  const creator = useQuery({ queryKey: ['admin', 'user', uid], queryFn: async () => (await api.get(`/admin/users/${uid}`)).data.data });
  const resourcePath = tab === 'collaborations' ? 'collaborations' : tab === 'payments' ? 'payments' : tab === 'invoices' ? 'invoices' : null;
  const resources = useQuery({ queryKey: ['admin', 'user', uid, resourcePath, page], queryFn: async () => (await api.get(`/admin/users/${uid}/${resourcePath}`, { params: { page, limit: 25 } })).data, enabled: Boolean(resourcePath) });
  const activity = useQuery({ queryKey: ['admin', 'user', uid, 'activity', page], queryFn: async () => (await api.get('/admin/audit-logs', { params: { targetOwnerUid: uid, page, limit: 25 } })).data, enabled: tab === 'activity' });
  const collaborations = useQuery({ queryKey: ['admin', 'user', uid, 'collaborations', 'payment-options'], queryFn: async () => (await api.get(`/admin/users/${uid}/collaborations`, { params: { page: 1, limit: 50 } })).data.data, enabled: tab === 'payments' });
  const accountMutation = useMutation({
    mutationFn: ({ action, values }) => action === 'delete' ? api.delete(`/admin/users/${uid}`, { data: { reason: values.reason, confirmationEmail: values.confirmation } }) : api.post(`/admin/users/${uid}/${action}`, { reason: values.reason }),
    onSuccess: (_data, variables) => { client.invalidateQueries({ queryKey: ['admin'] }); toast.success(variables.action === 'suspend' ? 'Creator suspended' : variables.action === 'reactivate' ? 'Creator reactivated' : 'Creator permanently deleted'); setAccountAction(null); if (variables.action === 'delete') navigate('/admin/creators'); },
    onError: (error) => toast.error(apiMessage(error)),
  });
  const paymentDeleteMutation = useMutation({ mutationFn: ({ id, reason }) => api.delete(`/admin/payments/${id}`, { data: { reason } }), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin'] }); toast.success('Payment deleted and totals reconciled'); setDeletePayment(null); }, onError: (error) => toast.error(apiMessage(error)) });
  if (creator.isLoading) return <div className="admin-state"><p>Loading creator...</p></div>;
  if (creator.isError) return <AdminError retry={() => creator.refetch()}/>;
  const user = creator.data;
  const status = user.accountStatus || 'Active';
  return <div className="admin-page admin-creator-detail">
    <Link to="/admin/creators" className="admin-back"><ArrowLeft size={16}/> Creators</Link>
    <section className="admin-creator-hero"><div className="admin-creator-avatar">{user.displayName?.[0]?.toUpperCase() || 'C'}</div><div><span>Creator account</span><h1>{user.displayName || 'Unnamed creator'}</h1><p>{user.email}{user.instagramHandle ? ` · @${user.instagramHandle.replace('@', '')}` : ''}</p><AdminStatus value={status}/></div><div className="admin-creator-actions"><Button variant="outline" onClick={() => setProfileOpen(true)}><Pencil size={16}/> Edit profile</Button>{status === 'Suspended' ? <Button variant="outline" onClick={() => setAccountAction('reactivate')}><RotateCcw size={16}/> Reactivate</Button> : <Button variant="outline" onClick={() => setAccountAction('suspend')}><Ban size={16}/> Suspend</Button>}<Button variant="ghost" className="admin-delete-trigger" onClick={() => setAccountAction('delete')}><Trash2 size={16}/> Delete</Button></div></section>
    <section className="admin-profile-summary"><article><span>Collaborations</span><strong>{user.summary.collaborations}</strong></article><article><span>Payments</span><strong>{user.summary.payments}</strong></article><article><span>Received</span><strong>{inr(user.summary.paymentsReceivedPaisa)}</strong></article><article><span>Invoices</span><strong>{user.summary.invoices}</strong></article></section>
    <nav className="admin-tabs">{tabs.map(([value, label, Icon]) => <button className={tab === value ? 'active' : ''} key={value} onClick={() => { setTab(value); setPage(1); }}><Icon size={16}/>{label}</button>)}</nav>
    {tab === 'profile' && <section className="admin-panel admin-profile-panel"><header><div><h2>Creator profile</h2><p>Operational account and business information.</p></div></header><dl><div><dt>Display name</dt><dd>{user.displayName || 'Not provided'}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Instagram</dt><dd>{user.instagramHandle ? `@${user.instagramHandle.replace('@', '')}` : 'Not provided'}</dd></div><div><dt>Content niche</dt><dd>{user.niche || 'Not provided'}</dd></div><div><dt>Phone</dt><dd>{user.phone || 'Not provided'}</dd></div><div><dt>Business name</dt><dd>{user.businessName || 'Not provided'}</dd></div><div><dt>Business address</dt><dd>{user.businessAddress || 'Not provided'}</dd></div><div><dt>Invoice prefix</dt><dd>{user.invoicePrefix || 'INV'}</dd></div><div><dt>Onboarding</dt><dd>{user.onboardingCompleted ? 'Complete' : 'Incomplete'}</dd></div><div><dt>Joined</dt><dd>{shortDate(user.createdAt)}</dd></div></dl></section>}
    {resourcePath && <section className="admin-panel admin-resource-panel"><header><div><h2>{tab[0].toUpperCase() + tab.slice(1)}</h2><p>Records owned by this creator.</p></div>{tab === 'payments' && <Button onClick={() => setPaymentEditor({ mode: 'create' })}><Plus size={16}/> Record payment</Button>}</header>{resources.isLoading && <div className="admin-state"><p>Loading records...</p></div>}{resources.isError && <AdminError retry={() => resources.refetch()}/>} {resources.data && !resources.data.data.length && <EmptyState icon={tab === 'collaborations' ? BriefcaseBusiness : tab === 'payments' ? ReceiptIndianRupee : FileText} title={`No ${tab}`} description="There are no records in this section."/>}{resources.data && tab === 'collaborations' && <div className="admin-record-list">{resources.data.data.map((item) => <Link to={`/admin/creators/${uid}/collaborations/${item._id}`} key={item._id}><span><strong>{item.brandName}</strong><small>{item.campaignTitle || item.platform}</small></span><span>{inr(item.dealValuePaisa)}</span><AdminStatus value={item.status}/></Link>)}</div>}{resources.data && tab === 'payments' && <div className="admin-record-list">{resources.data.data.map((item) => <article key={item._id}><span><strong>{inr(item.amountPaisa)}</strong><small>{shortDate(item.paymentDate)} · {item.paymentMethod}</small></span><span>{item.notes || 'No notes'}</span><div><Button size="sm" variant="outline" onClick={() => setPaymentEditor(item)}><Pencil size={14}/> Correct</Button><Button size="sm" variant="ghost" onClick={() => setDeletePayment(item)} aria-label="Delete payment"><Trash2 size={15}/></Button></div></article>)}</div>}{resources.data && tab === 'invoices' && <div className="admin-record-list">{resources.data.data.map((item) => <article key={item._id}><span><strong>{item.invoiceNumber}</strong><small>{item.billTo.name} · {shortDate(item.invoiceDate)}</small></span><span>{inr(item.totalPaisa)}</span><div><AdminStatus value={item.status || 'Issued'}/>{item.status !== 'Void' && <Button size="sm" variant="outline" onClick={() => setReplaceInvoice(item)}>Void and recreate</Button>}</div></article>)}</div>}{resources.data && <AdminPagination meta={resources.data.meta} onPage={setPage}/>}</section>}
    {tab === 'activity' && <section className="admin-panel admin-resource-panel"><header><div><h2>Admin activity</h2><p>Changes made to this creator and their records.</p></div></header>{activity.data?.data.length ? <div className="admin-audit-list">{activity.data.data.map((item) => <article key={item._id}><i><ScrollText size={16}/></i><div><strong>{item.action.replaceAll('.', ' · ').replaceAll('_', ' ')}</strong><p>{item.reason}</p><small>{item.actorEmail || item.actorUid}</small></div><time>{shortDate(item.createdAt)}</time></article>)}</div> : <EmptyState icon={ScrollText} title="No admin activity" description="Changes for this creator will appear here."/>}{activity.data && <AdminPagination meta={activity.data.meta} onPage={setPage}/>}</section>}
    <ProfileEditor creator={user} open={profileOpen} onClose={() => setProfileOpen(false)}/>
    <PaymentModal open={Boolean(paymentEditor)} onClose={() => setPaymentEditor(null)} creator={user} payment={paymentEditor?.mode === 'create' ? null : paymentEditor} collaborations={collaborations.data || []}/>
    <InvoiceReplacementModal invoice={replaceInvoice} onClose={() => setReplaceInvoice(null)}/>
    <AdminConfirmModal open={Boolean(accountAction)} onClose={() => setAccountAction(null)} title={accountAction === 'delete' ? 'Permanently delete creator?' : accountAction === 'suspend' ? 'Suspend this creator?' : 'Reactivate this creator?'} description={accountAction === 'delete' ? 'Firebase access and every creator-owned record will be permanently removed.' : accountAction === 'suspend' ? 'The creator will be signed out and blocked from CollabDock.' : 'The creator will be able to sign in again.'} actionLabel={accountAction === 'delete' ? 'Delete creator' : accountAction === 'suspend' ? 'Suspend creator' : 'Reactivate creator'} tone={accountAction === 'reactivate' ? 'primary' : 'danger'} expectedConfirmation={accountAction === 'delete' ? user.email : undefined} confirmationLabel="Type the creator email to confirm" loading={accountMutation.isPending} onConfirm={(values) => accountMutation.mutate({ action: accountAction, values })}/>
    <AdminConfirmModal open={Boolean(deletePayment)} onClose={() => setDeletePayment(null)} title="Delete this payment?" description="The collaboration balance and payment status will be recalculated." actionLabel="Delete payment" loading={paymentDeleteMutation.isPending} onConfirm={({ reason }) => paymentDeleteMutation.mutate({ id: deletePayment._id, reason })}/>
  </div>;
}
