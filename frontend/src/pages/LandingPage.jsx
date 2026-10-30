import { Link } from 'react-router-dom';
import { ArrowRight, BadgeIndianRupee, CalendarCheck2, Check, FileText, MessageCircleMore, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

const workflowSteps = [
  [CalendarCheck2, '01', 'Add your deal', 'Capture the brand, value and deadline in under a minute. Add more details whenever you are ready.'],
  [BadgeIndianRupee, '02', 'Track every rupee', 'See what is paid, pending or overdue. Partial payments stay clear and accurate.'],
  [MessageCircleMore, '03', 'Follow up gracefully', 'Open a professional WhatsApp reminder with the right amount and due date.'],
  [FileText, '04', 'Invoice in moments', 'Create and download a clean PDF invoice using your saved business details.'],
];

const featureItems = [
  ['Deadlines', 'See what needs to go live next.'],
  ['Payments', 'Know exactly what every brand owes.'],
  ['Invoices', 'Create polished PDFs in a few clicks.'],
  ['Reminders', 'Follow up on WhatsApp without awkward wording.'],
  ['Fast capture', 'Add a new deal before the DM gets buried.'],
];

export function LandingPage() {
  return (
    <div className="landing landing-refresh">
      <header className="landing-nav">
        <Link className="brand" to="/"><BrandLogo className="brand-logo-nav"/><small>beta</small></Link>
        <nav><a href="#workflow">How it works</a><a href="#features">Features</a></nav>
        <div><Link className="text-link" to="/login">Log in</Link><Link className="button button-primary button-md" to="/register">Join free beta <ArrowRight size={16} /></Link></div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-pill"><Sparkles size={14} /> The creator admin glow-up</span>
            <h1>Creator admin,<br /><em>minus the chaos.</em></h1>
            <p>Brand deals, deadlines, invoices and payments in one calm workspace built for independent creators.</p>
            <div className="hero-actions"><Link className="button button-primary button-lg" to="/register">Join the free beta <ArrowRight size={17} /></Link><span>Free during beta</span></div>
            <div className="trust-row"><span><Check size={15} /> Set up in 2 minutes</span><span><Check size={15} /> Made for INR</span><span><Check size={15} /> Private by default</span></div>
          </div>

          <div className="hero-product" aria-label="CollabDock product preview">
            <span className="hero-sticker hero-sticker-paid">₹ paid</span>
            <span className="hero-sticker hero-sticker-live">content live ✓</span>
            <div className="mock-window">
              <div className="mock-top"><span /><span /><span /><strong>Creator overview</strong><small>Live workspace</small></div>
              <div className="mock-body">
                <aside><div className="mock-logo"><BrandLogo compact/></div>{[1, 2, 3, 4].map((item) => <i key={item} />)}</aside>
                <section>
                  <div className="mock-heading"><div><p>Good morning</p><h3>Your business at a glance.</h3></div><span>October</span></div>
                  <div className="mock-stats"><b><small>Pending</small>₹18,500</b><b><small>Received</small>₹42,000</b><b><small>Active deals</small>3</b></div>
                  <div className="mock-card">
                    <div><span className="logo-chip lilac">G</span><p><strong>Glow & Co.</strong><small>Diwali Reels Campaign</small></p><em>₹25,000</em></div>
                    <div><span className="logo-chip peach">M</span><p><strong>Minimalist</strong><small>Product Launch</small></p><em>₹18,500</em></div>
                    <div><span className="logo-chip mint">N</span><p><strong>Noise</strong><small>Smartwatch Stories</small></p><em>₹15,000</em></div>
                  </div>
                  <div className="mock-progress"><span><i /><strong>3 deadlines handled</strong></span><small>On track</small></div>
                </section>
              </div>
            </div>
          </div>
        </section>

        <section className="workflow" id="workflow">
          <div className="landing-section-heading"><div><span className="section-kicker">One simple flow</span><h2>From yes to paid,<br /><em>without the spreadsheet.</em></h2></div><p>CollabDock follows the way creator deals actually happen, from the first message to the final payment.</p></div>
          <div className="flow-grid">{workflowSteps.map(([Icon, number, title, text]) => <article key={number}><span className="step-number">{number}</span><span className="flow-icon"><Icon size={22} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="feature-band" id="features">
          <div className="feature-copy"><span className="feature-pill"><Sparkles size={13} /> Your creator HQ</span><h2>Less admin.<br /><em>More creating.</em></h2><p>Everything important stays visible, without turning your creative business into an enterprise dashboard.</p><Link to="/register">Explore the free beta <ArrowRight size={15} /></Link></div>
          <ul>{featureItems.map(([title, text], index) => <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{title}</strong><small>{text}</small></div><Check size={17} /></li>)}</ul>
        </section>

        <section className="final-cta">
          <div className="final-cta-chips" aria-hidden="true"><span className="cta-chip cta-chip-paid">₹ payment cleared</span><span className="cta-chip cta-chip-invoice">invoice sent ✓</span><span className="cta-chip cta-chip-deadline">deadline locked</span></div>
          <div className="final-cta-content"><span className="final-cta-pill"><Sparkles size={14} /> Free beta access</span><h2>Your creator business<br /><em>deserves a glow-up.</em></h2><p>Keep every deal, deadline, invoice and payment together in one calm workspace.</p><Link className="final-cta-button" to="/register"><span>Join the free beta</span><i><ArrowRight size={18} /></i></Link><small>Free during beta · No card required</small></div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-main">
          <div className="landing-footer-intro">
            <Link className="brand" to="/" aria-label="CollabDock home"><BrandLogo className="brand-logo-footer" /></Link>
            <p>Calm admin for independent creators managing brand deals.</p>
          </div>
          <nav className="landing-footer-nav" aria-label="Footer navigation">
            <span>Explore</span>
            <a href="#workflow">How it works</a>
            <a href="#features">Features</a>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="landing-footer-action">
            <span>Ready when you are</span>
            <Link to="/register">Join the free beta <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <small>© 2026 CollabDock</small>
          <p>Built thoughtfully for India&apos;s creator economy.</p>
          <span className="landing-footer-status"><i /> Free during beta</span>
        </div>
      </footer>
    </div>
  );
}
