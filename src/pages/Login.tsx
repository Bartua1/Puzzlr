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
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setErrorMsg('');
    setLoading(true);
    await triggerHapticClick();

    const action = isSignUp ? signUp : signIn;
    const res = await action(username);

    if (res.success) {
      await triggerHapticSuccess();
    } else {
      await triggerHapticError();
      setErrorMsg(res.error || t('login.errors.authFailed'));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
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
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4 p-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm inline-flex items-center justify-center overflow-hidden">
              <Logo size={52} className="rounded-xl overflow-hidden" />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              {t('app.title')}
            </h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
              {t('login.subtitle')}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 mb-4 bg-amber-50 rounded-2xl text-amber-700 text-xs font-semibold leading-normal">
              {errorMsg}
            </div>
          )}

          {!showEmailForm ? (
            <div className="space-y-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.62 4.21 1.71l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {t('login.googleCta')}
              </button>

              <div className="flex items-center">
                <div className="flex-grow border-t border-slate-150"></div>
                <span className="mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('login.or')}</span>
                <div className="flex-grow border-t border-slate-150"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHapticClick();
                  setShowEmailForm(true);
                }}
                disabled={loading}
                className="w-full py-3.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
              >
                {t('login.emailCta')}
              </button>
            </div>
          ) : (
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {t('login.usernameEmailLabel')}
                  </label>
                  <input
                    id="username"
                    type="text"
                    required
                    disabled={loading}
                    placeholder={t('login.usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !username.trim()}
                  className="w-full py-3.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
                >
                  {loading ? t('login.loggingIn') : t('login.cta')}
                </button>
              </form>

              <div className="mt-6 text-center flex flex-col gap-3">
                <button
                  onClick={() => {
                    triggerHapticClick();
                    setIsSignUp(!isSignUp);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold underline decoration-slate-200 hover:decoration-slate-400 transition-all cursor-pointer"
                >
                  {isSignUp ? t('login.hasAccount') : t('login.needAccount')}
                </button>

                <button
                  onClick={() => {
                    triggerHapticClick();
                    setShowEmailForm(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-all cursor-pointer"
                >
                  &larr; {t('login.backToOptions')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <DisclaimerFooter />
    </div>
  );
};
