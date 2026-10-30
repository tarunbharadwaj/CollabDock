import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AtSign, Building2, Check, LogOut, Mail, MessageSquareHeart, Moon, Palette, ReceiptText, RotateCcw, Save, Sun, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/hooks/useProfile';
import { api, apiMessage } from '@/services/api';
import { Button, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui';
import { useProductExperience } from '@/context/ProductExperienceContext';

const NICHE_OPTIONS = ['Fashion', 'Beauty', 'Lifestyle', 'Food', 'Travel', 'Technology', 'Fitness', 'Finance', 'Skits'];

function SettingsCard({ icon: Icon, tone, title, description, children, className = '' }) {
  return (
    <section className={`settings-card ${className}`}>
      <header className="settings-card-header">
        <span className={`settings-card-icon ${tone}`}><Icon size={19}/></span>
        <div><h2>{title}</h2><p>{description}</p></div>
      </header>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const { data, isLoading } = useProfile();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { openFeedback, startTour } = useProductExperience();
  const [nicheChoice, setNicheChoice] = useState('');
  const [customNiche, setCustomNiche] = useState('');

  useEffect(() => {
    if (!data?.niche) return;
    if (NICHE_OPTIONS.includes(data.niche)) {
      setNicheChoice(data.niche);
      setCustomNiche('');
      return;
    }
    setNicheChoice('Other');
    setCustomNiche(data.niche);
  }, [data?.niche]);

  const mutation = useMutation({
    mutationFn: (payload) => api.patch('/me', payload),
    onSuccess: ({ data: response }) => {
      queryClient.setQueryData(['me'], response.data);
      toast.success('Settings saved');
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  function submit(event) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    payload.niche = nicheChoice === 'Other' ? customNiche.trim() : nicheChoice;
    mutation.mutate(payload);
  }

  function scrollToInvoiceDefaults() {
    const section = document.getElementById('invoice-defaults');
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      section.querySelector('[name="businessName"]')?.focus({ preventScroll: true });
    }, 450);
  }

  if (isLoading) return <div className="page"><PageHeader title="Settings"/><Skeleton className="panel-skeleton"/></div>;

  const initials = data.displayName?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'C';

  return (
    <div className="page settings-page">
      <PageHeader eyebrow="YOUR WORKSPACE" title="Settings" description="Manage your creator identity, invoice details, and app preferences."/>

      <section className="settings-identity" data-tour="workspace-settings">
        <span className="settings-avatar">{initials}</span>
        <div className="settings-identity-copy">
          <span>Creator profile</span>
          <h2>{data.displayName || 'Your creator workspace'}</h2>
          <p>{data.instagramHandle ? `@${data.instagramHandle.replace('@', '')}` : data.email}</p>
        </div>
        <div className="settings-identity-meta">
          <span><AtSign size={14}/> {data.email}</span>
          <button type="button" onClick={scrollToInvoiceDefaults} aria-label="Go to invoice defaults">
            <Building2 size={14}/> {data.businessName || 'Add business name'}
          </button>
        </div>
      </section>

      <form className="settings-layout" onSubmit={submit}>
        <div className="settings-main-column">
          <SettingsCard icon={UserRound} tone="violet" title="Creator profile" description="The personal details shown across your workspace.">
            <div className="settings-fields settings-profile-fields">
              <Input label="Display name" name="displayName" defaultValue={data.displayName} required/>
              <Input label="Instagram handle" name="instagramHandle" defaultValue={data.instagramHandle} placeholder="@yourhandle" required/>
              <div className="settings-field-wide"><Input label="Email address" value={data.email} readOnly disabled required hint="Managed by your sign-in provider"/></div>
              <Select label="Content niche" value={nicheChoice} onChange={(event) => setNicheChoice(event.target.value)} placeholder="Choose your niche" required>
                {NICHE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                <option>Other</option>
              </Select>
              <Input label="Phone number" name="phone" defaultValue={data.phone} placeholder="+91 98765 43210" required/>
              {nicheChoice === 'Other' && (
                <div className="settings-field-wide settings-custom-niche">
                  <Input label="Your niche" value={customNiche} onChange={(event) => setCustomNiche(event.target.value)} placeholder="For example, parenting or gaming" maxLength="80" required autoFocus/>
                </div>
              )}
            </div>
          </SettingsCard>

          <div id="invoice-defaults" className="settings-scroll-target">
            <SettingsCard icon={ReceiptText} tone="blue" title="Invoice defaults" description="Saved details used when you create a new invoice.">
              <div className="settings-fields">
                <div className="settings-field-wide"><Input label="Business or creator name" name="businessName" defaultValue={data.businessName} placeholder="Your creator studio" required/></div>
                <div className="settings-field-wide"><Textarea label="Business address" name="businessAddress" rows="3" defaultValue={data.businessAddress} placeholder="Address shown on invoices"/></div>
                <Input label="UPI ID" name="upiId" defaultValue={data.upiId} placeholder="name@upi"/>
                <Input label="Invoice prefix" name="invoicePrefix" defaultValue={data.invoicePrefix} maxLength="8" hint="Example: INV"/>
                <div className="settings-field-wide"><Textarea label="Bank details" name="bankDetails" rows="3" defaultValue={data.bankDetails} placeholder="Account name, number and IFSC"/></div>
                <Select label="Currency" name="currency" defaultValue="INR"><option value="INR">INR - Indian Rupee</option></Select>
              </div>
            </SettingsCard>
          </div>
        </div>

        <aside className="settings-side-column">
          <SettingsCard icon={Palette} tone="pink" title="Appearance" description="Choose your preferred workspace theme." className="settings-appearance-card">
            <div className="theme-picker">
              <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} aria-pressed={theme === 'light'}>
                <span className="theme-preview theme-preview-light"><i/><i/><i/></span>
                <span><strong><Sun size={15}/> Light</strong><small>Bright and clear</small></span>
                {theme === 'light' && <Check className="theme-check" size={15}/>} 
              </button>
              <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} aria-pressed={theme === 'dark'}>
                <span className="theme-preview theme-preview-dark"><i/><i/><i/></span>
                <span><strong><Moon size={15}/> Dark</strong><small>Easy on the eyes</small></span>
                {theme === 'dark' && <Check className="theme-check" size={15}/>} 
              </button>
            </div>
          </SettingsCard>

          <section className="settings-save-card">
            <span className="settings-save-icon"><Save size={18}/></span>
            <div><strong>Ready to save?</strong><p>Apply your latest profile and invoice changes.</p></div>
            <Button type="submit" loading={mutation.isPending}><Save size={16}/> Save changes</Button>
          </section>

          <section className="settings-account-card">
            <div><span className="settings-account-icon"><LogOut size={18}/></span><span><strong>Account access</strong><small>Sign out of CollabDock on this browser.</small></span></div>
            <Button variant="secondary" onClick={logout}><LogOut size={16}/> Log out</Button>
          </section>

          <section className="settings-help-card">
            <span className="settings-save-icon"><MessageSquareHeart size={18}/></span>
            <div><strong>Help shape CollabDock</strong><p>Share feedback or take another look around the workspace.</p></div>
            <Button variant="secondary" onClick={() => openFeedback('Manual')}><MessageSquareHeart size={16}/> Share feedback</Button>
            <Button variant="ghost" onClick={() => startTour({ replay: true })}><RotateCcw size={16}/> Replay product tour</Button>
          </section>

          <section className="settings-contact-card">
            <div><span className="settings-account-icon"><Mail size={18}/></span><span><strong>Need help?</strong><small>Contact the CollabDock admin for account or product support.</small></span></div>
            <Link className="button button-secondary button-md" to="/contact" state={{ from: '/app/settings' }}><Mail size={16}/> Contact admin</Link>
          </section>
        </aside>
      </form>
    </div>
  );
}
