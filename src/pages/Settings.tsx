import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useShop } from '../hooks/useShop';
import { AvatarViewer } from '../components/AvatarViewer';
import { triggerHapticClick, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { LogOut, Globe, ArrowLeft, Trash2, ShieldAlert, Trophy, Camera } from 'lucide-react';
import { supabase } from '../services/supabase';

interface MemberGroup {
  group_id: string;
  joined_at: string;
  groups: {
    name: string;
  } | null;
}

interface GroupGame {
  group_id: string;
  game_id: string;
}

interface PersonalBest {
  gameId: string;
  gameName: string;
  score: number;
  maxScore: number;
  date: string;
  groups: string[];
  formattedScore: string;
}

interface AdminScore {
  id: string;
  game_id: string;
  score: number;
  max_score: number;
  solved_date: string;
  games: {
    display_name: string;
  } | null;
}

export const Settings = () => {
  const { profile, signOut, updateLanguage, refreshProfile } = useAuth();
  const { cosmetics } = useShop();
  const { t, i18n } = useTranslation();
  const [adminScores, setAdminScores] = useState<AdminScore[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [pbs, setPbs] = useState<PersonalBest[]>([]);
  const [loadingPbs, setLoadingPbs] = useState(false);
  const [pbsVersion, setPbsVersion] = useState(0);
  const [uploading, setUploading] = useState(false);

  const activeBadge = cosmetics.find((c) => c.id === profile?.equipped_badge_id);
  const badgeKey = activeBadge?.asset_key || '';

  const resizeImage = (file: File, maxWidth = 150, maxHeight = 150): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Crop to square
          const minSize = Math.min(width, height);
          const startX = (width - minSize) / 2;
          const startY = (height - minSize) / 2;

          canvas.width = maxWidth;
          canvas.height = maxHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              img,
              startX, startY, minSize, minSize, // Source crop
              0, 0, maxWidth, maxHeight // Destination canvas size
            );
            resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality JPEG
          } else {
            reject(new Error('Canvas context not available'));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAvatarClick = () => {
    triggerHapticClick();
    document.getElementById('avatar-upload')?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const dataUrl = await resizeImage(file, 150, 150);

      if (!profile?.id) return;

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: dataUrl })
        .eq('id', profile.id);

      if (error) throw error;

      await triggerHapticSuccess();
      await refreshProfile();
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      await triggerHapticError();
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchPbsData = async () => {
      if (!profile?.id) return;
      setLoadingPbs(true);
      try {
        // 1. Fetch user scores
        const { data: scoresData } = await supabase
          .from('daily_scores')
          .select('*, games(display_name)')
          .eq('profile_id', profile.id);

        if (!scoresData) {
          setPbs([]);
          setLoadingPbs(false);
          return;
        }

        // 2. Fetch user group memberships
        const { data: memberGroupsData } = await supabase
          .from('group_members')
          .select('group_id, joined_at, groups(name)')
          .eq('profile_id', profile.id);

        const memberGroups = (memberGroupsData || []) as unknown as MemberGroup[];

        // 3. Fetch active games for those groups
        let groupGames: GroupGame[] = [];
        if (memberGroups.length > 0) {
          const groupIds = memberGroups.map((mg) => mg.group_id);
          const { data: ggData } = await supabase
            .from('group_games')
            .select('group_id, game_id')
            .in('group_id', groupIds);
          if (ggData) {
            groupGames = ggData as unknown as GroupGame[];
          }
        }

        // 4. Calculate PBs in memory
        const scoresByGame: Record<string, typeof scoresData> = {};
        scoresData.forEach((score) => {
          if (!scoresByGame[score.game_id]) {
            scoresByGame[score.game_id] = [];
          }
          scoresByGame[score.game_id].push(score);
        });

        const calculatedPbs = Object.entries(scoresByGame).map(([gameId, gameScores]) => {
          const sorted = gameScores.sort((a, b) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            return a.solved_date.localeCompare(b.solved_date);
          });
          const bestScore = sorted[0];

          const matchedGroups = memberGroups
            .filter((mg) => {
              const joinDate = mg.joined_at.split('T')[0];
              const isMember = joinDate <= bestScore.solved_date;
              const isGameActive = groupGames.some(
                (gg) => gg.group_id === mg.group_id && gg.game_id === bestScore.game_id
              );
              return isMember && isGameActive;
            })
            .map((mg) => mg.groups?.name || 'Unknown Group');

          let formattedScore = `${bestScore.score}/${bestScore.max_score}`;
          if (bestScore.game_id === 'word_grid' || bestScore.game_id === 'wordle_es') {
            const guesses = bestScore.score === 0 ? 'X' : String(7 - bestScore.score);
            formattedScore = `${guesses}/6`;
          } else if (bestScore.game_id === 'chess_grid') {
            const timeMatch = bestScore.raw_text.match(/(\d+:\d+)/);
            if (timeMatch) {
              formattedScore = timeMatch[0];
            } else {
              formattedScore = `${bestScore.score}/100`;
            }
          }

          const isEs = i18n.language === 'es';
          let gameName = bestScore.games?.display_name || bestScore.game_id;
          if (bestScore.game_id === 'word_group') {
            gameName = isEs ? 'Categorización de Grupos' : 'Group Categorization Game';
          } else if (bestScore.game_id === 'chess_grid') {
            gameName = "Queen's Grid";
          }

          return {
            gameId,
            gameName,
            score: bestScore.score,
            maxScore: bestScore.max_score,
            date: bestScore.solved_date,
            groups: matchedGroups,
            formattedScore,
          };
        });

        setPbs(calculatedPbs);
      } catch (err) {
        console.error('Failed to calculate personal bests:', err);
      } finally {
        setLoadingPbs(false);
      }
    };

    fetchPbsData();
  }, [profile, i18n.language, pbsVersion]);

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
        setAdminScores(data as unknown as AdminScore[]);
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
      setPbsVersion((prev) => prev + 1);
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
      setPbsVersion((prev) => prev + 1);
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 text-slate-800 pt-safe pb-safe">
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

          {/* User Profile Photo Uploader */}
          <div className="flex flex-col items-center pt-2">
            <div 
              onClick={handleAvatarClick}
              className="relative group cursor-pointer flex items-center justify-center w-36 h-36 rounded-full overflow-visible"
              title="Change profile picture"
            >
              <AvatarViewer
                avatarUrl={profile?.avatar_url || null}
                badgeKey={badgeKey}
                size="lg"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-full transition-opacity z-20 text-white font-bold text-xs select-none">
                <Camera className="w-5 h-5 mb-1" />
                <span>{uploading ? '...' : t('settings.changePhoto', 'Upload')}</span>
              </div>
            </div>
            <button 
              onClick={handleAvatarClick} 
              disabled={uploading}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100/80 active:scale-95 disabled:opacity-50 text-slate-700 text-xs font-extrabold rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              {uploading ? 'Uploading...' : t('settings.changePhoto', 'Change Photo')}
            </button>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
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

          {/* Personal Bests Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-purple-600">
              <Trophy className="w-5 h-5 text-purple-500" />
              <div>
                <h2 className="text-sm font-black text-slate-900 leading-none">{t('settings.pbsTitle')}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t('settings.pbsSubtitle')}</p>
              </div>
            </div>

            {loadingPbs ? (
              <div className="text-center py-4 text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                Loading...
              </div>
            ) : pbs.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-4 uppercase tracking-wider">{t('settings.noPbs')}</p>
            ) : (
              <div className="space-y-2.5">
                {pbs.map((pb) => {
                  const groupNames = pb.groups.length > 0 ? pb.groups.join(', ') : t('settings.pbsGroupsNone');
                  return (
                    <div
                      key={pb.gameId}
                      className="p-3 bg-purple-50/30 border border-purple-100/30 rounded-2xl flex flex-col gap-1 hover:bg-purple-50/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800">
                          {pb.gameName}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          {pb.formattedScore}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        <span>
                          {t('settings.pbsDate', { date: pb.date })}
                        </span>
                        <span className="truncate max-w-[160px]" title={`${t('settings.pbsGroupsLabel')}: ${groupNames}`}>
                          {t('settings.pbsGroupsLabel')}: <span className="font-extrabold text-slate-50">{groupNames}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
