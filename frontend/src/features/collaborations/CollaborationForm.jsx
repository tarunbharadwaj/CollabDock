import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Activity, BriefcaseBusiness, CalendarClock, CalendarRange, Check, Clock3, ContactRound, ListChecks, Plus, StickyNote, Trash2, WalletCards } from 'lucide-react';
import { Button, DateInput, Input, MoneyInput, Select, Textarea } from '@/components/ui';
import { toRupees } from '@/lib/format';

const deliverableSchema = z.object({
  title: z.string().trim().min(2, 'Enter the deliverable title'),
  contentType: z.string().min(1, 'Choose a content type'),
  dueDate: z.string().min(1, 'Choose a due date'),
});

const collaborationFields = {
  brandName: z.string().trim().min(2, 'Enter the brand name'),
  dealValue: z.coerce.number().nonnegative('Amount cannot be negative'),
  campaignTitle: z.string().optional(),
  platform: z.string(),
  status: z.string(),
  deadline: z.string().optional(),
  paymentDueDate: z.string().optional(),
  startDate: z.string().optional(),
  brandContactName: z.string().optional(),
  brandEmail: z.union([z.email('Enter a valid email'), z.literal('')]).optional(),
  brandPhone: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
};

const createSchema = z.object({
  ...collaborationFields,
  deliverables: z.array(deliverableSchema).min(1, 'Add at least one deliverable'),
});

const editSchema = z.object({
  ...collaborationFields,
  deliverables: z.array(deliverableSchema).optional(),
});

const statuses = ['Lead', 'Confirmed', 'In Progress', 'Content Submitted', 'Completed', 'Cancelled'];
const dateValue = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';

function SectionTitle({ step, icon: Icon, title, description, optional = false }) {
  return (
    <div className="form-section-title collaboration-section-title">
      <span className="collaboration-section-icon"><Icon size={18}/></span>
      <div>
        <span className="collaboration-section-kicker">STEP {step}{optional && <em>OPTIONAL</em>}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export function CollaborationForm({ initial, onSubmit, loading, submitLabel = 'Save collaboration', compact = false, cancelTo }) {
  const form = useForm({
    resolver: zodResolver(initial ? editSchema : createSchema),
    defaultValues: {
      brandName: initial?.brandName || '',
      dealValue: initial ? toRupees(initial.dealValuePaisa) : '',
      campaignTitle: initial?.campaignTitle || '',
      platform: initial?.platform || 'Instagram',
      status: initial?.status || 'Lead',
      deadline: dateValue(initial?.deadline),
      paymentDueDate: dateValue(initial?.paymentDueDate),
      startDate: dateValue(initial?.startDate),
      brandContactName: initial?.brandContactName || '',
      brandEmail: initial?.brandEmail || '',
      brandPhone: initial?.brandPhone || '',
      description: initial?.description || '',
      notes: initial?.notes || '',
      deliverables: initial ? [] : [{ title: '', contentType: 'Instagram Reel', dueDate: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'deliverables' });
  const errors = form.formState.errors;
  const text = (name, label, props = {}) => (
    <Input label={label} error={errors[name]?.message} {...form.register(name)} {...props}/>
  );

  return (
    <form className={`collaboration-form collaboration-quick-form ${compact ? 'is-compact' : ''}`} onSubmit={form.handleSubmit(onSubmit)}>
      <section className="form-section collaboration-form-section collaboration-essential-section">
        <SectionTitle step="01" icon={BriefcaseBusiness} title="The essentials" description="Add the brand and agreed amount to create the deal."/>
        <span className="collaboration-required-pill"><Check size={13}/> Required</span>
        <div className="form-grid collaboration-essential-grid">
          {text('brandName', 'Brand name', { placeholder: 'Nykaa', required: true, autoFocus: !initial })}
          <Controller
            name="dealValue"
            control={form.control}
            render={({ field }) => (
              <MoneyInput
                label="Deal amount (₹)"
                placeholder="0"
                required
                error={errors.dealValue?.message}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          {text('campaignTitle', 'Campaign name', { placeholder: 'Festive Glow' })}
          <Select label="Platform" {...form.register('platform')}>
            <option>Instagram</option><option>YouTube</option><option>Other</option>
          </Select>
        </div>
      </section>

      {!compact && (
        <>
          <section className="form-section collaboration-form-section timeline-section">
            <SectionTitle step="02" icon={CalendarClock} title="Timeline and status" description="Set dates now so CollabDock can surface what needs attention." optional/>
            <div className="timeline-grid collaboration-timeline-grid">
              <div className="collaboration-timeline-card start">
                <span className="collaboration-timeline-icon"><CalendarRange size={17}/></span>
                <span className="collaboration-timeline-tag">OPTIONAL</span>
                <DateInput label="Start date" className="collaboration-timeline-field" {...form.register('startDate')}/>
                <small>When the partnership begins</small>
              </div>
              <div className="collaboration-timeline-card deadline">
                <span className="collaboration-timeline-icon"><Clock3 size={17}/></span>
                <span className="collaboration-timeline-tag">OPTIONAL</span>
                <DateInput label="Content deadline" className="collaboration-timeline-field" {...form.register('deadline')}/>
                <small>When the content is due</small>
              </div>
              <div className="collaboration-timeline-card payment">
                <span className="collaboration-timeline-icon"><WalletCards size={17}/></span>
                <span className="collaboration-timeline-tag">OPTIONAL</span>
                <DateInput label="Payment due" className="collaboration-timeline-field" {...form.register('paymentDueDate')}/>
                <small>When the brand should pay</small>
              </div>
              <div className="collaboration-timeline-card status">
                <span className="collaboration-timeline-icon"><Activity size={17}/></span>
                <span className="collaboration-timeline-tag workflow">WORKFLOW</span>
                <Select label="Status" className="timeline-select collaboration-timeline-field" {...form.register('status')}>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </Select>
                <small>Current stage of this deal</small>
              </div>
            </div>
          </section>

          <section className="form-section collaboration-form-section">
            <SectionTitle step="03" icon={ContactRound} title="Brand contact" description="Use these details for invoices and payment reminders." optional/>
            <div className="form-grid three">
              {text('brandContactName', 'Contact name', { placeholder: 'Priya' })}
              {text('brandEmail', 'Email', { type: 'email', placeholder: 'priya@brand.com' })}
              {text('brandPhone', 'WhatsApp number', { placeholder: '+91 98765 43210' })}
            </div>
          </section>

          {!initial && (
            <section className="form-section collaboration-form-section collaboration-deliverables-section">
              <SectionTitle step="04" icon={ListChecks} title="Deliverables" description="Add at least one agreed content item and its due date."/>
              <span className="collaboration-required-pill"><Check size={13}/> Required</span>
              <div className="deliverable-fields">
                {fields.length === 0 && (
                  <div className="deliverables-empty">
                    <span><ListChecks size={19}/></span>
                    <div><strong>Add at least one deliverable</strong><small>A collaboration cannot be saved without an agreed content item.</small></div>
                  </div>
                )}
                {fields.map((field, index) => (
                  <div className="deliverable-row collaboration-deliverable-row" key={field.id}>
                    <span className="deliverable-index">{String(index + 1).padStart(2, '0')}</span>
                    <Input label="Deliverable title" placeholder="Launch Reel" required error={errors.deliverables?.[index]?.title?.message} {...form.register(`deliverables.${index}.title`)}/>
                    <Select label="Content type" required error={errors.deliverables?.[index]?.contentType?.message} {...form.register(`deliverables.${index}.contentType`)}>
                      <option>Instagram Reel</option><option>Instagram Story</option><option>Carousel Post</option>
                      <option>Static Post</option><option>YouTube Video</option><option>Other</option>
                    </Select>
                    <DateInput label="Due date" required error={errors.deliverables?.[index]?.dueDate?.message} {...form.register(`deliverables.${index}.dueDate`)}/>
                    <Button className="deliverable-remove-button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} aria-label={fields.length === 1 ? 'At least one deliverable is required' : 'Remove deliverable'} title={fields.length === 1 ? 'At least one deliverable is required' : 'Remove deliverable'}><Trash2 size={17}/></Button>
                  </div>
                ))}
                {typeof errors.deliverables?.message === 'string' && <small className="field-error deliverables-error">{errors.deliverables.message}</small>}
                <Button className="add-deliverable-button" variant="secondary" onClick={() => append({ title: '', contentType: 'Instagram Reel', dueDate: '' })}><Plus size={16}/> Add deliverable</Button>
              </div>
            </section>
          )}

          <section className="form-section collaboration-form-section">
            <SectionTitle step={initial ? '04' : '05'} icon={StickyNote} title="Notes and context" description="Keep the details that usually get buried in chats." optional/>
            <div className="form-stack collaboration-notes-grid">
              <Textarea label="Collaboration description" rows="3" {...form.register('description')} placeholder="What is this campaign about?"/>
              <Textarea label="Private notes" rows="3" {...form.register('notes')} placeholder="Usage rights, talking points, and follow-up details..."/>
            </div>
          </section>
        </>
      )}

      <div className="form-actions collaboration-form-actions">
        <div><span><Check size={15}/></span><p><strong>{initial ? 'Save your updates' : 'Ready to add this deal?'}</strong><small>{initial ? 'Your collaboration will update immediately.' : 'You can edit every detail later.'}</small></p></div>
        <span className="collaboration-action-buttons">
          {cancelTo && <Link className="button button-secondary button-md" to={cancelTo}>Cancel</Link>}
          <Button type="submit" loading={loading}>{submitLabel}</Button>
        </span>
      </div>
    </form>
  );
}
