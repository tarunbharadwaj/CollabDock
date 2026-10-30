import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Plus, Trash2, UserRound } from 'lucide-react';
import { addDays } from 'date-fns';
import { toast } from 'sonner';
import { api, apiMessage } from '@/services/api';
import { useProfile } from '@/hooks/useProfile';
import { inr, toPaisa } from '@/lib/format';
import { Button, Input, MoneyInput, RequiredMark, Select, Textarea } from '@/components/ui';
import { useProductExperience } from '@/context/ProductExperienceContext';

export function NewInvoicePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signalMilestone } = useProductExperience();
  const { data: profile } = useProfile();
  const { data: collaborations = [], isLoading: collaborationsLoading } = useQuery({
    queryKey: ['collaborations', 'invoice-picker', 'active'],
    queryFn: async () => (await api.get('/collaborations', { params: { paymentStatus: 'outstanding', limit: 50 } })).data.data,
  });
  const activeCollaborations = useMemo(
    () => collaborations.filter((item) => !['Completed', 'Cancelled'].includes(item.status) && item.paymentStatus !== 'Paid'),
    [collaborations],
  );
  const form = useForm({
    defaultValues: {
      collaborationId: params.get('collaboration') || '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: addDays(new Date(), 15).toISOString().slice(0, 10),
      fromName: '',
      fromEmail: '',
      fromAddress: '',
      fromPhone: '',
      billToName: '',
      billToEmail: '',
      billToAddress: '',
      paymentInstructions: '',
      notes: '',
      lineItems: [{ description: 'Content creation services', quantity: 1, rate: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lineItems' });
  const watched = form.watch();

  useEffect(() => {
    if (profile) {
      form.setValue('fromName', profile.businessName || profile.displayName);
      form.setValue('fromEmail', profile.email);
      form.setValue('fromAddress', profile.businessAddress || '');
      form.setValue('fromPhone', profile.phone || '');
      form.setValue('paymentInstructions', [profile.upiId && `UPI: ${profile.upiId}`, profile.bankDetails].filter(Boolean).join('\n'));
    }
  }, [profile, form]);

  useEffect(() => {
    if (collaborationsLoading) return;
    const item = activeCollaborations.find((collaboration) => collaboration._id === watched.collaborationId);
    if (watched.collaborationId && !item) {
      form.setValue('collaborationId', '', { shouldDirty: false });
      return;
    }
    if (item) {
      form.setValue('billToName', item.brandName);
      form.setValue('billToEmail', item.brandEmail || '');
      form.setValue('billToAddress', item.brandAddress || '');
      form.setValue('lineItems.0.description', item.campaignTitle ? `Content creation - ${item.campaignTitle}` : `Content creation services - ${item.brandName}`);
      form.setValue('lineItems.0.rate', item.dealValuePaisa / 100);
    }
  }, [watched.collaborationId, activeCollaborations, collaborationsLoading, form]);

  const total = watched.lineItems?.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.rate || 0),
    0,
  ) || 0;
  const mutation = useMutation({
    mutationFn: (values) => api.post('/invoices', {
      collaborationId: values.collaborationId || null,
      invoiceDate: values.invoiceDate,
      dueDate: values.dueDate,
      from: { name: values.fromName, email: values.fromEmail, address: values.fromAddress, phone: values.fromPhone },
      billTo: { name: values.billToName, email: values.billToEmail, address: values.billToAddress },
      lineItems: values.lineItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        ratePaisa: toPaisa(item.rate),
      })),
      paymentInstructions: values.paymentInstructions,
      notes: values.notes,
    }),
    onSuccess: () => {
      toast.success('Invoice created');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      signalMilestone('Invoice Created');
      navigate('/app/invoices');
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  return (
    <div className="page form-page invoice-create">
      <Link className="back-link" to="/app/invoices"><ArrowLeft size={16}/> Invoices</Link>
      <div className="form-page-heading">
        <span className="eyebrow">NEW INVOICE</span>
        <h1>Create invoice</h1>
        <p>A basic, tax-agnostic invoice for your creator services.</p>
      </div>
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="invoice-form-main">
          <section className="form-section">
            <div className="form-section-title"><span>01</span><div><h3>Invoice details</h3><p>Linking a collaboration fills brand and deal details automatically.</p></div></div>
            <div className="form-grid three">
              <div className="invoice-collaboration-picker">
                <Select
                  label="Collaboration"
                  placeholder={collaborationsLoading ? 'Loading collaborations...' : activeCollaborations.length ? 'No collaboration' : 'No active collaborations'}
                  disabled={collaborationsLoading || activeCollaborations.length === 0}
                  {...form.register('collaborationId')}
                >
                  {activeCollaborations.map((item) => <option key={item._id} value={item._id}>{item.brandName}</option>)}
                </Select>
                {!collaborationsLoading && activeCollaborations.length === 0 && (
                  <div className="invoice-collaboration-empty">
                    <span>You can continue with a standalone invoice.</span>
                    <Link to="/app/collaborations/new">Add collaboration</Link>
                  </div>
                )}
              </div>
              <Input label="Invoice date" type="date" required {...form.register('invoiceDate')}/>
              <Input label="Due date" type="date" required {...form.register('dueDate')}/>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-title"><span>02</span><div><h3>From & bill to</h3><p>Your saved settings are used as a snapshot for this invoice.</p></div></div>
            <div className="invoice-parties">
              <div className="invoice-party-card">
                <h4><span className="invoice-party-icon"><UserRound size={16}/></span><span className="invoice-party-heading"><strong>From</strong><small>Your business details</small></span></h4>
                <Input label="Business / creator name" required {...form.register('fromName')}/>
                <Input label="Email" type="email" {...form.register('fromEmail')}/>
                <Textarea label="Address" rows="2" {...form.register('fromAddress')}/>
                <Input label="Phone" {...form.register('fromPhone')}/>
              </div>
              <div className="invoice-party-card">
                <h4><span className="invoice-party-icon"><Building2 size={16}/></span><span className="invoice-party-heading"><strong>Bill to</strong><small>Brand contact details</small></span></h4>
                <Input label="Brand name" required {...form.register('billToName')}/>
                <Input label="Brand email" type="email" {...form.register('billToEmail')}/>
                <Textarea label="Brand address" rows="2" {...form.register('billToAddress')}/>
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-title"><span>03</span><div><h3>Line items</h3><p>Break down what the brand is paying for.</p></div></div>
            <div className="line-items">
              <div className="line-head"><span>Description <RequiredMark/></span><span>Qty <RequiredMark/></span><span>Rate (₹) <RequiredMark/></span><span>Amount</span><span/></div>
              {fields.map((field, index) => (
                <div className="line-row" key={field.id}>
                  <input required placeholder="Service description" {...form.register(`lineItems.${index}.description`)}/>
                  <input required type="number" min="0.01" step="0.01" {...form.register(`lineItems.${index}.quantity`)}/>
                  <Controller
                    name={`lineItems.${index}.rate`}
                    control={form.control}
                    render={({ field: rateField }) => (
                      <MoneyInput
                        value={rateField.value}
                        onValueChange={rateField.onChange}
                        onBlur={rateField.onBlur}
                        ref={rateField.ref}
                        aria-label={`Rate for line item ${index + 1}`}
                        placeholder="0"
                        required
                      />
                    )}
                  />
                  <strong>{inr(toPaisa(Number(watched.lineItems?.[index]?.quantity || 0) * Number(watched.lineItems?.[index]?.rate || 0)), 2)}</strong>
                  <button type="button" onClick={() => fields.length > 1 && remove(index)} disabled={fields.length === 1}><Trash2 size={16}/></button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={() => append({ description: '', quantity: 1, rate: '' })}><Plus size={15}/> Add line item</Button>
              <div className="invoice-total"><span>Total</span><strong>{inr(toPaisa(total), 2)}</strong></div>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-title"><span>04</span><div><h3>Payment & notes</h3></div></div>
            <div className="form-grid">
              <Textarea label="Payment instructions" rows="4" {...form.register('paymentInstructions')}/>
              <Textarea label="Notes" rows="4" {...form.register('notes')} placeholder="Thank you for the collaboration!"/>
            </div>
          </section>
        </div>

        <aside className="invoice-preview-card">
          <span className="eyebrow">LIVE SUMMARY</span>
          <h2>Invoice preview</h2>
          <div><small>FROM</small><strong>{watched.fromName || 'Your creator business'}</strong><span>{watched.fromEmail}</span></div>
          <div><small>BILL TO</small><strong>{watched.billToName || 'Brand name'}</strong><span>{watched.billToEmail}</span></div>
          <hr/>
          <div className="preview-items">
            {watched.lineItems?.map((item, index) => <p key={index}><span>{item.description || 'Line item'}</span><strong>{inr(toPaisa(Number(item.quantity || 0) * Number(item.rate || 0)), 2)}</strong></p>)}
          </div>
          <footer><span>Total</span><strong>{inr(toPaisa(total), 2)}</strong></footer>
          <p className="basic-invoice-note">Basic invoice · GST is not calculated</p>
          <Button type="submit" loading={mutation.isPending} disabled={total <= 0}>Create invoice</Button>
        </aside>
      </form>
    </div>
  );
}
