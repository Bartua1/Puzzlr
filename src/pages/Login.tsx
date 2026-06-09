import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { triggerHapticClick, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/Logo';

export const Login = () => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isSignUp) {
      if (!username.trim()) {
        await triggerHapticError();
        setErrorMsg(t('login.errors.authFailed'));
        return;
      }
      if (!email.trim()) {
        await triggerHapticError();
        setErrorMsg(t('login.errors.authFailed'));
        return;
      }
      if (password.length < 6) {
        await triggerHapticError();
        setErrorMsg(t('login.errors.passwordTooShort'));
        return;
      }
      if (password !== confirmPassword) {
        await triggerHapticError();
        setErrorMsg(t('login.errors.passwordsMustMatch'));
        return;
      }
    } else {
      if (!email.trim() || !password) {
        await triggerHapticError();
        setErrorMsg(t('login.errors.authFailed'));
        return;
      }
    }

    setLoading(true);
    await triggerHapticClick();

    if (isSignUp) {
      const res = await signUp(email, password, username);
      if (res.success) {
        await triggerHapticSuccess();
        setSuccessMsg(t('login.checkInbox'));
        setPassword('');
        setConfirmPassword('');
        setIsSignUp(false);
      } else {
        await triggerHapticError();
        setErrorMsg(res.error || t('login.errors.authFailed'));
      }
    } else {
      const res = await signIn(email, password);
      if (res.success) {
        await triggerHapticSuccess();
      } else {
        await triggerHapticError();
        setErrorMsg(res.error || t('login.errors.authFailed'));
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    await triggerHapticClick();
    const res = await signInWithGoogle();
    if (res.success) {
      await triggerHapticSuccess();
    } else {
      await triggerHapticError();
      setErrorMsg(res.error || t('login.errors.googleFailed'));
      setLoading(false);
    }
  };

  return (
    /* ── Page shell ─────────────────────────────────────────── */
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ backgroundColor: '#f0f3ff', color: '#111c2d', fontFamily: "'Quicksand', sans-serif" }}
    >
      {/* flex-grow centre zone — card sits here */}
      <div className="flex-1 flex items-center justify-center p-5">
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Rubik:wght@500;700&display=swap');
        .login-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #f0f3ff;
          border: 1px solid rgba(202,196,212,0.6);
          border-radius: 14px;
          color: #111c2d;
          font-family: 'Quicksand', sans-serif;
          font-size: 15px;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input::placeholder { color: #7a7583; }
        .login-input:focus {
          border-color: #674bb5;
          box-shadow: 0 0 0 3px rgba(103,75,181,0.12);
        }
        .login-input:disabled { opacity: 0.5; }
        .login-label {
          display: block;
          font-family: 'Rubik', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #494552;
          margin-bottom: 6px;
        }
        .btn-primary {
          width: 100%;
          padding: 0.875rem 1rem;
          background: #674bb5;
          color: #fff;
          border: none;
          border-radius: 14px;
          font-family: 'Rubik', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(103,75,181,0.22);
        }
        .btn-primary:hover:not(:disabled) {
          background: #5a3fa8;
          box-shadow: 0 6px 18px rgba(103,75,181,0.32);
          transform: translateY(-1px);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary {
          width: 100%;
          padding: 0.875rem 1rem;
          background: #fff;
          color: #494552;
          border: 1px solid rgba(202,196,212,0.7);
          border-radius: 14px;
          font-family: 'Quicksand', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .btn-secondary:hover:not(:disabled) {
          background: #f0f3ff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        .btn-secondary:active:not(:disabled) { transform: translateY(0); }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Quicksand', sans-serif;
          font-weight: 700;
          transition: color 0.15s;
          padding: 0;
        }
      `}</style>

      {/* ── Decorative blobs ─────────────────────────────────── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-8rem', left: '-8rem',
          width: '24rem', height: '24rem',
          background: '#cebdff',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.4,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-8rem', right: '-8rem',
          width: '24rem', height: '24rem',
          background: '#b7c9d5',
          borderRadius: '50%',
          filter: 'blur(80px)',
          opacity: 0.3,
        }}
      />

      {/* ── Main card ─────────────────────────────────────────── */}
      <main
        className="w-full relative z-10 flex flex-col items-center"
        style={{
          maxWidth: 420,
          background: '#f9f9ff',
          borderRadius: 24,
          padding: 24,
          border: '1px solid rgba(202,196,212,0.3)',
          boxShadow: '0 12px 40px rgba(167,139,250,0.12)',
        }}
      >
        {/* Inner glow highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.4)',
          }}
        />

        {/* ── Logo ───────────────────────────────────────────── */}
        <div
          className="relative group mb-4 flex items-center justify-center overflow-hidden"
          style={{
            width: 80, height: 80,
            background: '#d8e3fb',
            borderRadius: 16,
            border: '1px solid rgba(202,196,212,0.2)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            padding: 4,
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          />
          <Logo size={64} className="rounded-xl overflow-hidden" />
        </div>

        {/* ── Title & subtitle ──────────────────────────────── */}
        <h1
          className="text-center mb-1"
          style={{
            fontFamily: "'Quicksand', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#111c2d',
          }}
        >
          {t('app.title')}
        </h1>
        <p
          className="text-center mb-6"
          style={{
            fontFamily: "'Quicksand', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: '#494552',
            maxWidth: 280,
            lineHeight: '1.5',
          }}
        >
          {t('login.subtitle')}
        </p>

        {/* ── Error / success banners ───────────────────────── */}
        {errorMsg && (
          <div
            className="w-full mb-4"
            style={{
              padding: '12px 16px',
              background: '#ffdad6',
              borderRadius: 12,
              color: '#93000a',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Quicksand', sans-serif",
            }}
          >
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div
            className="w-full mb-4"
            style={{
              padding: '12px 16px',
              background: '#d3e5f1',
              borderRadius: 12,
              color: '#0c1e26',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'Quicksand', sans-serif",
            }}
          >
            {successMsg}
          </div>
        )}

        {/* ── Main flow ─────────────────────────────────────── */}
        <div className="w-full">
          {!showEmailForm ? (
            /* ── Option selection ──────────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="btn-secondary"
              >
                <svg style={{ width: 20, height: 20, flexShrink: 0 }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.62 4.21 1.71l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {t('login.googleCta')}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(202,196,212,0.6)' }} />
                <span
                  style={{
                    fontFamily: "'Rubik', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#7a7583',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {t('login.or')}
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(202,196,212,0.6)' }} />
              </div>

              {/* Email / password */}
              <button
                type="button"
                onClick={() => { triggerHapticClick(); setShowEmailForm(true); }}
                disabled={loading}
                className="btn-secondary"
              >
                {t('login.emailCta')}
              </button>
            </div>
          ) : (
            /* ── Email form ──────────────────────────────────── */
            <div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {isSignUp && (
                  <div>
                    <label htmlFor="username" className="login-label">{t('login.usernameLabel')}</label>
                    <input
                      id="username"
                      type="text"
                      required
                      disabled={loading}
                      placeholder={t('login.usernamePlaceholder')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="login-input"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="login-label">{t('login.emailLabel')}</label>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={loading}
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="login-label">{t('login.passwordLabel')}</label>
                  <input
                    id="password"
                    type="password"
                    required
                    disabled={loading}
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                  />
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="login-label">{t('login.confirmPasswordLabel')}</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      disabled={loading}
                      placeholder={t('login.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="login-input"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (isSignUp
                    ? (!username.trim() || !email.trim() || !password || !confirmPassword)
                    : (!email.trim() || !password))}
                  className="btn-primary"
                  style={{ marginTop: 4 }}
                >
                  {loading
                    ? t('login.loggingIn')
                    : isSignUp
                      ? t('login.signUpCta')
                      : t('login.signInCta')}
                </button>
              </form>

              {/* Toggle sign-in / sign-up + back */}
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={() => {
                    triggerHapticClick();
                    setIsSignUp(!isSignUp);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="btn-ghost"
                  style={{ fontSize: 13, color: '#674bb5', textDecoration: 'underline', textDecorationColor: 'rgba(103,75,181,0.3)' }}
                >
                  {isSignUp ? t('login.hasAccount') : t('login.needAccount')}
                </button>

                <button
                  onClick={() => {
                    triggerHapticClick();
                    setShowEmailForm(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="btn-ghost"
                  style={{ fontSize: 12, color: '#7a7583' }}
                >
                  ← {t('login.backToOptions')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>{/* end flex-grow centre zone */}

      {/* ── Disclaimer footer ─────────────────────────────────── */}
      <DisclaimerFooter />
    </div>
  );
};
