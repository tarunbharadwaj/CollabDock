import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, updateProfile } from '@firebase/auth';
import { ArrowLeft, Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { auth, firebaseConfigured, googleProvider } from '@/lib/firebase';
import { Button, Input, RequiredMark } from '@/components/ui';
import { BrandLogo } from '@/components/BrandLogo';

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.25c0-.75-.06-1.3-.2-1.88H12v3.41h5.37a4.6 4.6 0 0 1-1.99 2.93v2.22h2.87c1.68-1.55 3.1-3.83 3.1-6.68Z"/><path fill="#34A853" d="M12 21.75c2.4 0 4.41-.79 5.88-2.15l-2.87-2.22c-.79.53-1.8.9-3.01.9-2.32 0-4.28-1.56-4.98-3.66H4.06v2.29A8.88 8.88 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M7.02 14.62A5.34 5.34 0 0 1 6.74 12c0-.91.16-1.79.44-2.62V7.09H4.06A9.76 9.76 0 0 0 3.1 12c0 1.77.44 3.44 1.22 4.91l2.7-2.29Z"/><path fill="#EA4335" d="M12 5.72c1.31 0 2.48.45 3.4 1.33l2.55-2.55A8.56 8.56 0 0 0 12 2.25a8.88 8.88 0 0 0-7.94 4.84l2.96 2.29c.7-2.1 2.66-3.66 4.98-3.66Z"/></svg>;
}

function authErrorMessage(error) {
  if (error?.code === 'auth/configuration-not-found') return 'Authentication is not available right now. Please try again later.';
  if (error?.code === 'auth/unauthorized-domain') return 'Sign in is not available from this address.';
  if (error?.code === 'auth/operation-not-allowed') return 'This sign-in option is not available right now.';
  return error?.code?.replace('auth/', '').replaceAll('-', ' ') || 'Could not continue';
}

export function AuthPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isAdmin = mode === 'admin';
  const destination = location.state?.from || (isAdmin ? '/admin' : '/app');
  const authContext = isForgot ? 'Account recovery' : isRegister ? 'Free beta access' : isAdmin ? 'Protected workspace' : 'Creator workspace';

  async function submit(event) {
    event.preventDefault();
    if (!auth) { toast.error('Authentication is not configured yet'); return; }
    setLoading(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (isForgot) {
        await sendPasswordResetEmail(auth, values.email);
        toast.success('Reset link sent. Check your inbox.');
        navigate('/login');
        return;
      }
      if (isRegister) {
        const result = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await updateProfile(result.user, { displayName: values.name });
        navigate('/onboarding');
      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password);
        navigate(destination);
      }
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    if (!auth || !googleProvider) { toast.error('Authentication is not configured yet'); return; }
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate(destination);
    } catch (error) {
      toast.error(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <header className="auth-header">
        <Link className="brand" to="/"><BrandLogo className="brand-logo-auth"/></Link>
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to home</Link>
      </header>
      <main className="auth-main">
        <section className={`auth-card ${isRegister ? 'auth-card-register' : ''}`}>
          <div className="auth-card-heading">
            <span className="auth-kicker"><Sparkles size={13} /> {authContext}</span>
            <h1>{isForgot ? 'Reset your password' : isRegister ? 'Join the free beta' : isAdmin ? 'CollabDock Admin' : 'Welcome back'}</h1>
            <p>{isForgot ? 'Enter the email linked to your account.' : isRegister ? 'Set up your creator workspace in minutes.' : isAdmin ? 'Sign in with an approved administrator account.' : 'Your collaborations are waiting for you.'}</p>
            {isRegister && <div className="auth-beta-notes"><span><Check size={13} /> Free during beta</span><span><Check size={13} /> No card required</span></div>}
          </div>
          {!firebaseConfigured && <div className="auth-config-notice"><strong>Authentication setup required</strong><span>Add the Firebase Web App values to <code>frontend/.env</code>, then restart the development server.</span></div>}
          {!isForgot && <><Button variant="outline" className="google-button" onClick={google} loading={loading} disabled={!firebaseConfigured}><GoogleIcon /> Continue with Google</Button><div className="divider"><span>or continue with email</span></div></>}
          <form onSubmit={submit}>
            {isRegister && <Input label="Your name" name="name" autoComplete="name" placeholder="Your name" required minLength="2" />}
            <Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            {!isForgot && <label className="field"><span>Password <RequiredMark/></span><div className="password-field"><input name="password" type={show ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="6" required placeholder="At least 6 characters"/><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{!isRegister && <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>}</label>}
            <Button type="submit" className="auth-submit" loading={loading} disabled={!firebaseConfigured}>{isForgot ? 'Send reset link' : isRegister ? 'Join free beta' : 'Log in'}</Button>
          </form>
          {!isAdmin && <p className="auth-switch">{isForgot ? <Link to="/login">Back to login</Link> : isRegister ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New to CollabDock? <Link to="/register">Create an account</Link></>}</p>}
        </section>
      </main>
    </div>
  );
}
