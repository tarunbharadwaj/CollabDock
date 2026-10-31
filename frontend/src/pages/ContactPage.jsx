import { ArrowLeft, Copy, ExternalLink, HelpCircle, Instagram, Linkedin, Mail, MessageCircleHeart, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/BrandLogo';

const ADMIN_EMAIL = 'tarunbharadwaj10@gmail.com';
const LINKEDIN_URL = 'https://www.linkedin.com/in/tarun-bharadwaj/';
const INSTAGRAM_URL = 'https://www.instagram.com/build_with_tarun/';

export function ContactPage() {
  const location = useLocation();
  const fromSettings = location.state?.from === '/app/settings';
  const returnTo = fromSettings ? '/app/settings' : '/';

  async function copyAdminEmail() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ADMIN_EMAIL);
      } else {
        const input = document.createElement('textarea');
        input.value = ADMIN_EMAIL;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      toast.success('Admin email copied');
    } catch {
      toast.error('Could not copy the email. Please select it manually.');
    }
  }

  return (
    <div className="contact-page">
      <header className="contact-header">
        <Link to="/" aria-label="CollabDock home"><BrandLogo className="contact-brand-logo"/></Link>
        <Link className="back-link" to={returnTo}><ArrowLeft size={16}/> {fromSettings ? 'Back to settings' : 'Back to home'}</Link>
      </header>

      <main className="contact-main">
        <span className="contact-kicker"><MessageCircleHeart size={14}/> CollabDock support</span>
        <h1>Need a hand?<br/><em>Talk to the admin.</em></h1>
        <p>Whether you found something confusing, need account help, or have an idea for the beta, you can reach the CollabDock admin directly.</p>

        <section className="contact-email-card">
          <span className="contact-email-icon"><Mail size={21}/></span>
          <div><small>ADMIN EMAIL</small><strong>{ADMIN_EMAIL}</strong><p>Use this email for product questions, account support, and beta feedback.</p></div>
          <button type="button" className="contact-email-open" onClick={copyAdminEmail} aria-label="Copy admin email" title="Copy email"><Copy size={18}/></button>
        </section>

        <section className="contact-social-section" aria-labelledby="contact-social-title">
          <div className="contact-social-heading">
            <span id="contact-social-title">Connect online</span>
            <small>Follow the journey and reach out directly.</small>
          </div>
          <div className="contact-social-grid">
            <a className="contact-social-link linkedin" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
              <span className="contact-social-icon"><Linkedin size={19}/></span>
              <span><small>LINKEDIN</small><strong>Tarun Bharadwaj</strong></span>
              <ExternalLink size={16} aria-hidden="true"/>
            </a>
            <a className="contact-social-link instagram" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
              <span className="contact-social-icon"><Instagram size={19}/></span>
              <span><small>INSTAGRAM</small><strong>@build_with_tarun</strong></span>
              <ExternalLink size={16} aria-hidden="true"/>
            </a>
          </div>
        </section>

        <div className="contact-topics" aria-label="Reasons to contact CollabDock">
          <span><HelpCircle size={15}/> Product questions</span>
          <span><ShieldCheck size={15}/> Account support</span>
          <span><MessageCircleHeart size={15}/> Beta feedback</span>
        </div>

        <div className="contact-actions">
          <Link className="button button-secondary button-lg" to={returnTo}>{fromSettings ? 'Return to settings' : 'Return home'}</Link>
        </div>
        <small className="contact-safety-note">For your security, never email passwords, authentication codes, or complete banking details.</small>
      </main>
    </div>
  );
}
