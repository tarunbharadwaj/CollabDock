import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
export function NotFoundPage() { return <div className="not-found"><BrandLogo className="state-brand-logo"/><h1>That page drifted away.</h1><p>The link may be outdated, or the page does not exist.</p><Link className="button button-primary button-md" to="/app">Return to overview</Link></div>; }
