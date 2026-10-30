import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, LockKeyhole, MessageSquareHeart, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { api, apiMessage } from '@/services/api';
import { Button, Modal, Select, Textarea } from '@/components/ui';

const ProductExperienceContext = createContext(null);
const TOUR_VERSION = 1;
const FEEDBACK_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

function tourStorageKey(uid) {
  return uid ? `collabdock-product-tour-${uid}-v${TOUR_VERSION}` : '';
}

function readStoredTourStatus(uid) {
  const key = tourStorageKey(uid);
  if (!key) return '';
  try {
    const value = localStorage.getItem(key);
    return ['Completed', 'Skipped'].includes(value) ? value : '';
  } catch {
    return '';
  }
}

function storeTourStatus(uid, status) {
  const key = tourStorageKey(uid);
  if (!key) return;
  try {
    localStorage.setItem(key, status);
  } catch {
    // Server persistence remains the source of truth when browser storage is unavailable.
  }
}

const TOUR_STEPS = [
  {
    route: '/app',
    target: 'overview-summary',
    eyebrow: 'Your daily view',
    title: 'See what needs attention',
    description: 'Your active deals, money collected, pending payments, and deadlines stay visible in one calm overview.',
  },
  {
    route: '/app',
    target: 'add-collaboration',
    eyebrow: 'Start here',
    title: 'Add a brand deal quickly',
    description: 'Capture the brand, value, deadline, and deliverables while the conversation is still fresh.',
  },
  {
    route: '/app/payments',
    target: 'payments-overview',
    eyebrow: 'Stay on top of money',
    title: 'Track every payment',
    description: 'Record full or partial payments and see exactly what is received, outstanding, or overdue.',
  },
  {
    route: '/app/invoices',
    target: 'invoice-workspace',
    eyebrow: 'Get paid professionally',
    title: 'Create polished invoices',
    description: 'Generate and download invoices using your saved creator and business details.',
  },
  {
    route: '/app/settings',
    target: 'workspace-settings',
    eyebrow: 'Make it yours',
    title: 'Keep your defaults ready',
    description: 'Update your profile, invoice details, theme, and replay this tour whenever you need a refresher.',
  },
];

export function isFeedbackPromptEligible(lastPromptAt, now = Date.now()) {
  if (!lastPromptAt) return true;
  const timestamp = new Date(lastPromptAt).getTime();
  return Number.isFinite(timestamp) && now - timestamp >= FEEDBACK_COOLDOWN_MS;
}

function visibleTarget(name) {
  return [...document.querySelectorAll(`[data-tour="${name}"]`)].find((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  });
}

function viewportClass() {
  if (window.innerWidth < 700) return 'Mobile';
  if (window.innerWidth < 1050) return 'Tablet';
  return 'Desktop';
}

function TourLayer({ stepIndex, onBack, onNext, onSkip }) {
  const location = useLocation();
  const navigate = useNavigate();
  const step = TOUR_STEPS[stepIndex];
  const [targetRect, setTargetRect] = useState(null);
  const [mobile, setMobile] = useState(() => window.innerWidth < 700);
  const cardRef = useRef(null);
  const titleId = useId();
  const maskId = useId().replaceAll(':', '');

  useEffect(() => {
    if (location.pathname !== step.route) {
      navigate(step.route);
      return undefined;
    }

    let frame;
    let targetTimer;
    const measure = () => {
      const target = visibleTarget(step.target);
      if (!target) {
        setTargetRect(null);
        return;
      }
      window.clearInterval(targetTimer);
      const rect = target.getBoundingClientRect();
      if (rect.top < 12 || rect.bottom > window.innerHeight - 12) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      frame = requestAnimationFrame(() => {
        const next = target.getBoundingClientRect();
        setTargetRect({ left: next.left - 7, top: next.top - 7, width: next.width + 14, height: next.height + 14 });
      });
    };
    const timer = window.setTimeout(measure, 120);
    targetTimer = window.setInterval(measure, 350);
    const handleViewport = () => {
      setMobile(window.innerWidth < 700);
      measure();
    };
    window.addEventListener('resize', handleViewport);
    window.addEventListener('scroll', handleViewport, true);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(targetTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleViewport);
      window.removeEventListener('scroll', handleViewport, true);
    };
  }, [location.pathname, navigate, step.route, step.target]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = 'hidden';
    const card = cardRef.current;
    card?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onSkip();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
      } else if (event.key === 'ArrowLeft' && stepIndex > 0) {
        event.preventDefault();
        onBack();
      } else if (event.key === 'Tab') {
        const focusable = [...(card?.querySelectorAll('button:not([disabled])') || [])];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === card)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onBack, onNext, onSkip, stepIndex]);

  const cardStyle = useMemo(() => {
    if (mobile) return undefined;
    if (!targetRect) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    const width = 340;
    if (targetRect.left + targetRect.width + width + 24 < window.innerWidth) return { left: targetRect.left + targetRect.width + 18, top: Math.max(18, Math.min(targetRect.top, window.innerHeight - 350)) };
    if (targetRect.left > width + 24) return { left: targetRect.left - width - 18, top: Math.max(18, Math.min(targetRect.top, window.innerHeight - 350)) };
    return { left: Math.max(18, Math.min(targetRect.left, window.innerWidth - width - 18)), top: Math.min(window.innerHeight - 350, targetRect.top + targetRect.height + 18) };
  }, [mobile, targetRect]);

  const isLast = stepIndex === TOUR_STEPS.length - 1;
  return createPortal(
    <div className={`product-tour-layer ${mobile ? 'is-mobile' : ''}`}>
      <svg className="product-tour-scrim" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white"/>
            {targetRect && <rect x={targetRect.left} y={targetRect.top} width={targetRect.width} height={targetRect.height} rx="18" fill="black"/>}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(12, 9, 20, .72)" mask={`url(#${maskId})`}/>
      </svg>
      {targetRect && <span className="product-tour-spotlight" style={targetRect} aria-hidden="true"/>}
      <section ref={cardRef} className="product-tour-card" style={cardStyle} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex="-1">
        <span className="product-tour-handle" aria-hidden="true"/>
        <header><span>{step.eyebrow}</span><button type="button" onClick={onSkip} aria-label="Skip product tour"><X size={17}/></button></header>
        <div className="product-tour-progress" aria-label={`Step ${stepIndex + 1} of ${TOUR_STEPS.length}`}>
          {TOUR_STEPS.map((item, index) => <i key={item.title} className={index <= stepIndex ? 'active' : ''}/>) }
        </div>
        <h2 id={titleId}>{step.title}</h2>
        <p>{step.description}</p>
        <footer>
          <Button variant="ghost" onClick={onBack} disabled={stepIndex === 0}><ArrowLeft size={15}/> Back</Button>
          <Button onClick={onNext}>{isLast ? <><Check size={16}/> Finish</> : <>Next <ArrowRight size={15}/></>}</Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function FeedbackModal({ open, context, onClose }) {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('General');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.post('/feedback', {
      rating,
      category,
      message: message.trim(),
      context,
      path: window.location.pathname,
      deviceClass: viewportClass(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Thanks for helping us improve CollabDock');
      onClose();
    },
    onError: (error) => toast.error(apiMessage(error)),
  });

  useEffect(() => {
    if (!open) return;
    setRating(0);
    setCategory('General');
    setMessage('');
  }, [open, context]);

  return (
    <Modal
      open={open}
      onClose={() => !mutation.isPending && onClose()}
      title={context === 'Manual' ? 'Share feedback' : 'How did that feel?'}
      description="A quick response helps us make CollabDock better for creators."
      size="feedback-modal"
    >
      <form className="feedback-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <fieldset>
          <legend>How was your experience?</legend>
          <div className="feedback-rating">
            {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={rating === value ? 'active' : ''} aria-pressed={rating === value} onClick={() => setRating(value)}><strong>{value}</strong><span>{value === 1 ? 'Poor' : value === 5 ? 'Great' : ''}</span></button>)}
          </div>
        </fieldset>
        <Select label="What is this about?" value={category} onChange={(event) => setCategory(event.target.value)}>
          {['General', 'Bug', 'Confusing', 'Idea', 'Other'].map((item) => <option key={item}>{item}</option>)}
        </Select>
        <Textarea label="Tell us more" value={message} onChange={(event) => setMessage(event.target.value)} maxLength="2000" rows="4" placeholder="What worked well, or what should feel easier?"/>
        <p className="feedback-identity-note"><LockKeyhole size={14}/> This feedback is connected to your creator account so we can understand the context.</p>
        <div className="modal-actions"><Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>Not now</Button><Button type="submit" loading={mutation.isPending} disabled={!rating}>Send feedback</Button></div>
      </form>
    </Modal>
  );
}

export function ProductExperienceProvider({ children }) {
  const { data: profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourReplay, setTourReplay] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackContext, setFeedbackContext] = useState('Manual');
  const [localTourStatus, setLocalTourStatus] = useState(() => readStoredTourStatus(profile?.uid));
  const feedbackPendingRef = useRef(false);
  const tourAcknowledgedRef = useRef(false);
  const tourSyncAttemptedRef = useRef(false);
  const promptTimerRef = useRef(null);

  const mergeProfile = useCallback((updates) => {
    queryClient.setQueryData(['me'], (current) => ({ ...current, ...updates }));
  }, [queryClient]);

  const tourMutation = useMutation({
    mutationFn: (status) => api.post('/me/product-tour', { status, version: TOUR_VERSION }),
    onSuccess: ({ data }) => mergeProfile(data.data),
  });

  const rememberTourStatus = useCallback((status) => {
    tourAcknowledgedRef.current = true;
    storeTourStatus(profile?.uid, status);
    setLocalTourStatus(status);
    mergeProfile({
      productTourStatus: status,
      productTourVersion: TOUR_VERSION,
      productTourAcknowledgedAt: new Date().toISOString(),
    });
    tourMutation.mutate(status);
  }, [mergeProfile, profile?.uid, tourMutation]);

  useEffect(() => {
    if (!profile?.uid) return;
    const storedStatus = readStoredTourStatus(profile.uid);
    setLocalTourStatus(storedStatus);
    if (!storedStatus || (profile.productTourStatus || 'Not Seen') !== 'Not Seen' || tourSyncAttemptedRef.current) return;
    tourSyncAttemptedRef.current = true;
    tourMutation.mutate(storedStatus);
  }, [profile?.productTourStatus, profile?.uid, tourMutation]);

  useEffect(() => {
    if (!profile?.onboardingCompleted || location.pathname !== '/app' || tourOpen || inviteOpen || tourAcknowledgedRef.current) return undefined;
    if (localTourStatus || (profile.productTourStatus || 'Not Seen') !== 'Not Seen') return undefined;
    const timer = window.setTimeout(() => setInviteOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [inviteOpen, localTourStatus, location.pathname, profile?.onboardingCompleted, profile?.productTourStatus, tourOpen]);

  useEffect(() => () => window.clearTimeout(promptTimerRef.current), []);

  const startTour = useCallback(({ replay = false } = {}) => {
    setInviteOpen(false);
    setFeedbackOpen(false);
    setTourReplay(replay);
    setStepIndex(0);
    setTourOpen(true);
    navigate('/app');
  }, [navigate]);

  const closeTour = useCallback((status) => {
    tourAcknowledgedRef.current = true;
    setTourOpen(false);
    setStepIndex(0);
    navigate('/app');
    if (!tourReplay) rememberTourStatus(status);
  }, [navigate, rememberTourStatus, tourReplay]);

  const skipInvitation = useCallback(() => {
    setInviteOpen(false);
    rememberTourStatus('Skipped');
  }, [rememberTourStatus]);

  const nextTourStep = useCallback(() => {
    if (stepIndex >= TOUR_STEPS.length - 1) closeTour('Completed');
    else setStepIndex((current) => current + 1);
  }, [closeTour, stepIndex]);

  const openFeedback = useCallback((context = 'Manual') => {
    setFeedbackContext(context);
    setFeedbackOpen(true);
  }, []);

  const signalMilestone = useCallback(async (context) => {
    if (feedbackPendingRef.current || feedbackOpen || inviteOpen || tourOpen) return;
    if (!isFeedbackPromptEligible(profile?.lastFeedbackPromptAt)) return;
    feedbackPendingRef.current = true;
    try {
      const response = await api.post('/me/feedback-prompt');
      mergeProfile(response.data.data);
      promptTimerRef.current = window.setTimeout(() => {
        setFeedbackContext(context);
        setFeedbackOpen(true);
        feedbackPendingRef.current = false;
      }, 900);
    } catch {
      feedbackPendingRef.current = false;
    }
  }, [feedbackOpen, inviteOpen, mergeProfile, profile?.lastFeedbackPromptAt, tourOpen]);

  const value = useMemo(() => ({ openFeedback, signalMilestone, startTour }), [openFeedback, signalMilestone, startTour]);
  return (
    <ProductExperienceContext.Provider value={value}>
      {children}
      <Modal open={inviteOpen} onClose={skipInvitation} title="Welcome to your creator workspace" description="Take a quick tour and see how CollabDock keeps every deal moving." size="tour-invite-modal">
        <div className="tour-invite-body">
          <span><Sparkles size={22}/></span>
          <div><strong>Five stops. About one minute.</strong><p>We will guide you through the real workspace without changing any of your data.</p></div>
          <div className="modal-actions"><Button variant="secondary" onClick={skipInvitation}>Skip for now</Button><Button onClick={() => startTour()}><Sparkles size={16}/> Take the tour</Button></div>
        </div>
      </Modal>
      {tourOpen && <TourLayer stepIndex={stepIndex} onBack={() => setStepIndex((current) => Math.max(0, current - 1))} onNext={nextTourStep} onSkip={() => closeTour('Skipped')}/>} 
      <FeedbackModal open={feedbackOpen} context={feedbackContext} onClose={() => setFeedbackOpen(false)}/>
    </ProductExperienceContext.Provider>
  );
}

export function useProductExperience() {
  const context = useContext(ProductExperienceContext);
  if (!context) throw new Error('useProductExperience must be used inside ProductExperienceProvider');
  return context;
}

export function FeedbackIcon() {
  return <MessageSquareHeart size={18}/>;
}
