import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { triggerHapticClick, triggerHapticSuccess } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { LogOut, Globe, ArrowLeft, Trash2, ShieldAlert } from 'lucide-react';
import { supabase } from '../services/supabase';

export const Settings = () => {
  const { profile, signOut, updateLanguage } = useAuth();
  const { t, i18n } = useTranslation();
  const [adminScores, setAdminScores] = useState<any[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);

  useEffect(() => {
    const fetchAdminScores = async () => {
      if (!profile?.is_admin) return;
      setLoadingScores(true);
      const { data, error } = await supabase
        .from('daily_scores')
        .select('*, games(display_name)')
        .eq('profile_id', profile.id)
        .order('solved_date', { ascending: false });
      if (!error && data) {
        setAdminScores(data);
      }
      setLoadingScores(false);
    };

    fetchAdminScores();
  }, [profile]);

  const handleDeleteScore = async (scoreId: string) => {
    await triggerHapticClick();
    const { error } = await supabase
      .from('daily_scores')
      .delete()
      .eq('id', scoreId);
    if (!error) {
      await triggerHapticSuccess();
      setAdminScores((prev) => prev.filter((s) => s.id !== scoreId));
    }
  };

  const handleClearAllScores = async () => {
    if (!profile) return;
    await triggerHapticClick();
    const { error } = await supabase
      .from('daily_scores')
      .delete()
      .eq('profile_id', profile.id);
    if (!error) {
      await triggerHapticSuccess();
      setAdminScores([]);
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    await triggerHapticClick();
    
    // Change language in i18n runtime
    i18n.changeLanguage(newLang);
    
    // Sync language back to Supabase database
    await updateLanguage(newLang);
    await triggerHapticSuccess();
  };

  const handleLogout = async () => {
    await triggerHapticClick();
    await signOut();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 text-slate-800 pt-[safe] pb-[safe]">
      <div className="max-w-md w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        {/* Back navigation header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            onClick={() => triggerHapticClick()}
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-slate-200 shadow-sm flex items-center justify-center transition-all text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{t('settings.backToDashboard')}</span>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 mb-2">{t('settings.title')}</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {t('settings.systemConfiguration')}
            </p>
          </div>

          {/* Language selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" /> {t('settings.languageLabel')}
            </label>
            <select
              value={profile?.language || 'en'}
              onChange={handleLanguageChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold"
            >
              <option value="en">{t('settings.languages.en')}</option>
              <option value="es">{t('settings.languages.es')}</option>
            </select>
          </div>

          {/* Admin panel */}
          {profile?.is_admin && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <div>
                  <h2 className="text-sm font-black text-slate-900 leading-none">{t('settings.adminTitle')}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t('settings.adminSubtitle')}</p>
                </div>
              </div>

              {loadingScores ? (
                <div className="text-center py-4 text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                  Loading...
                </div>
              ) : adminScores.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold text-center py-4 uppercase tracking-wider">{t('settings.noSubmissions')}</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {adminScores.map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-3 bg-rose-50/30 border border-rose-100/50 rounded-2xl transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800">
                          {score.games?.display_name || score.game_id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {score.solved_date} • {score.score}/{score.max_score}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteScore(score.id)}
                        className="p-2 bg-white hover:bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm transition-all cursor-pointer"
                        title={t('settings.deleteSubmissionBtn')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {adminScores.length > 0 && (
                <button
                  onClick={handleClearAllScores}
                  className="w-full py-2.5 bg-rose-600 text-white hover:bg-rose-700 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('settings.clearAllSubmissions')}
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full py-3.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {t('settings.logoutButton')}
            </button>
          </div>
        </div>
      </div>
      <DisclaimerFooter />
    </div>
  );
};
