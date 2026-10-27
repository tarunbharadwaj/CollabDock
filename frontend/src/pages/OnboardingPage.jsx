import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { api, apiMessage } from '@/services/api';
import { BrandLogo } from '@/components/BrandLogo';
import { Button, Input, Select, Textarea } from '@/components/ui';

const NICHE_OPTIONS = ['Fashion', 'Beauty', 'Lifestyle', 'Food', 'Travel', 'Technology', 'Fitness', 'Finance', 'Skits'];

export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({ currency: 'INR' });
  const [nicheChoice, setNicheChoice] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const { user } = useAuth();
  const { data } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (data) {
      setValues((current) => ({
        ...current,
        displayName: data.displayName || user?.displayName || '',
        instagramHandle: data.instagramHandle || '',
        businessName: data.businessName || '',
        phone: data.phone || '',
        businessAddress: data.businessAddress || '',
        upiId: data.upiId || '',
        bankDetails: data.bankDetails || '',
      }));
      if (data.niche) {
        if (NICHE_OPTIONS.includes(data.niche)) {
          setNicheChoice(data.niche);
          setCustomNiche('');
        } else {
          setNicheChoice('Other');
          setCustomNiche(data.niche);
        }
      }
    }
  }, [data, user]);

  const save = useMutation({
    mutationFn: (payload) => api.patch('/me', payload),
    onSuccess: ({ data: response }) => {
      queryClient.setQueryData(['me'], response.data);
      navigate('/app');
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  function collect(event) {
    event.preventDefault();
    const next = { ...values, ...Object.fromEntries(new FormData(event.currentTarget)) };
    if (step === 2) next.niche = nicheChoice === 'Other' ? customNiche.trim() : nicheChoice;
    setValues(next);
    if (step < 3) setStep(step + 1);
    else save.mutate({ ...next, onboardingCompleted: true });
  }

  function finish() {
    save.mutate({
      ...values,
      displayName: values.displayName || user.displayName || 'Creator',
      onboardingCompleted: true,
    });
  }

  return (
    <div className="onboarding">
      <aside>
        <span className="onboarding-brand"><BrandLogo/></span>
        <div>
          <span>STEP {step} OF 3</span>
          <h1>{step === 1 ? "Let's make it yours." : step === 2 ? 'Shape your workspace.' : 'Get invoice-ready.'}</h1>
          <p>{step === 1 ? 'Start with the essentials. This takes less than a minute.' : step === 2 ? 'A little context helps CollabDock feel like your own.' : 'Save the details you use repeatedly. You can change these anytime.'}</p>
        </div>
        <ol>{['Creator details', 'Creator profile', 'Invoice defaults'].map((label, index) => <li key={label} className={index + 1 <= step ? 'active' : ''}><span>{index + 1 < step ? <Check size={14}/> : index + 1}</span>{label}</li>)}</ol>
      </aside>
      <main>
        <form onSubmit={collect}>
          <div className="onboarding-title"><span>STEP {step} OF 3</span><h2>{step === 1 ? 'Creator details' : step === 2 ? 'Creator profile' : 'Invoice defaults'}</h2><p>{step === 3 && 'Optional - add these now or finish later in Settings.'}</p></div>
          {step === 1 && <><Input label="Creator / display name" name="displayName" defaultValue={values.displayName} required placeholder="Your name"/><Input label="Instagram handle" name="instagramHandle" defaultValue={values.instagramHandle} required placeholder="@yourhandle"/><Input label="Email" value={user?.email || ''} readOnly disabled hint="Managed securely by your sign-in provider"/></>}
          {step === 2 && <><Input label="Business or creator name" name="businessName" defaultValue={values.businessName} required placeholder="Your creator studio"/><Select label="Content niche" name="niche" value={nicheChoice} onChange={(event) => setNicheChoice(event.target.value)} placeholder="Choose your niche" required>{NICHE_OPTIONS.map((item) => <option key={item}>{item}</option>)}<option>Other</option></Select>{nicheChoice === 'Other' && <Input label="Your niche" value={customNiche} onChange={(event) => setCustomNiche(event.target.value)} required placeholder="For example, parenting or gaming" maxLength="80" autoFocus/>}<Input label="Phone number" name="phone" defaultValue={values.phone} required placeholder="+91 98765 43210"/><Select label="Preferred currency" name="currency" defaultValue="INR"><option value="INR">INR - Indian Rupee</option></Select></>}
          {step === 3 && <><Textarea label="Business address" name="businessAddress" defaultValue={values.businessAddress} rows="3" placeholder="Address shown on invoices"/><Input label="Phone number" name="phone" defaultValue={values.phone} placeholder="+91 98765 43210"/><Input label="UPI ID" name="upiId" defaultValue={values.upiId} placeholder="name@upi"/><Textarea label="Bank details" name="bankDetails" defaultValue={values.bankDetails} rows="3" placeholder="Account name, number and IFSC"/></>}
          <footer>
            {step > 1 ? <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={16}/> Back</Button> : <span/>}
            <div>{step === 3 && <Button variant="ghost" onClick={finish} loading={save.isPending}>Skip invoice details</Button>}<Button type="submit" loading={save.isPending}>{step === 3 ? 'Finish setup' : 'Continue'} {step < 3 && <ArrowRight size={16}/>}</Button></div>
          </footer>
        </form>
      </main>
    </div>
  );
}
