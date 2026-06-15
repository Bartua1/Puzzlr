import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDailyScores } from '../hooks/useDailyScores';
import { useGroups } from '../hooks/useGroups';
import { useNotifications } from '../hooks/useNotifications';
import { parseShareText } from '../services/parser';
import { triggerHapticClick, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { Clipboard, ShieldAlert, CheckCircle2, Volume2, VolumeX, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import coinX3 from '../assets/coin_x3.svg';
import streakHot from '../assets/streak_hot.svg';
import streakCold from '../assets/streak_cold.svg';
import streakProtector from '../assets/streak_protector.svg';
import appLogoNoBg from '../assets/app_logo_no_bg.svg';
import { supabase } from '../services/supabase';
import { AvatarViewer } from '../components/AvatarViewer';
import { CreateGroupModal, BANNER_PRESETS } from '../components/CreateGroupModal';
import { ClipboardAutoSubmitter } from '../components/ClipboardAutoSubmitter';

const SUGGESTED_NAMES = [
  "Ghostbusters 👻",
  "Mind Benders 🧠",
  "Sudoku Slayers 🔢",
  "Word Hunters 🔍",
  "Grid Gurus 🗺️",
  "Chess Champions 👑",
  "Connection Queens 👑",
  "Daily Solvers 📅",
  "Trivia Titans 💡",
  "Logic Legends 🧩"
];

const formatDateRange = (startDateStr?: string, endDateStr?: string, lang = 'es') => {
  if (!startDateStr || !endDateStr) return '';
  try {
    const parseUTC = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    };
    const start = parseUTC(startDateStr);
    const end = parseUTC(endDateStr);
    const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
    
    const locale = lang.startsWith('es') ? 'es-ES' : 'en-US';
    const startFormatted = start.toLocaleDateString(locale, formatOptions).replace('.', '').toLowerCase();
    const endFormatted = end.toLocaleDateString(locale, formatOptions).replace('.', '').toLowerCase();
    return `${startFormatted} - ${endFormatted}`;
  } catch (e) {
    console.error('Error formatting date range:', e);
    return '';
  }
};

export const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const { scores, submitScore, error: scoresError, refreshScores } = useDailyScores();
  const { groups, joinGroup, loading: groupsLoading, error: groupsError, getStandings, getGroupMembers, updateMuteStatus, refreshGroups } = useGroups();
  useNotifications(groups, scores);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [clipboardText, setClipboardText] = useState('');
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [streakAnimationValue, setStreakAnimationValue] = useState(0);

  const [showCalendar, setShowCalendar] = useState(false);
  const [solvedDates, setSolvedDates] = useState<string[]>([]);

  // Toast state
  const [mutedGroups, setMutedGroups] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; icon: string; visible: boolean } | null>(null);
  const [toastTimeout, setToastTimeout] = useState<any>(null);

  const showToast = (message: string, icon: string = '🔔') => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    setToast({ message, icon, visible: true });
    const timer = setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 2500);
    setToastTimeout(timer);
  };

  // Sync mutedGroups state with groups fetched from DB
  useEffect(() => {
    if (groups && groups.length > 0) {
      const initialMuted: Record<string, boolean> = {};
      groups.forEach((g) => {
        initialMuted[g.id] = g.is_muted || false;
      });
      setMutedGroups(initialMuted);
    }
  }, [groups]);

  // Clean up toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeout) clearTimeout(toastTimeout);
    };
  }, [toastTimeout]);

  // Listen to app foreground transition to auto-refresh data
  useEffect(() => {
    let appStateListener: { remove: () => void } | null = null;
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('[Dashboard] App resumed. Refreshing dashboard data...');
          refreshGroups();
          refreshScores();
          refreshProfile();
        }
      }).then(listener => {
        appStateListener = listener;
      });
    }

    return () => {
      appStateListener?.remove();
    };
  }, [refreshGroups, refreshScores, refreshProfile]);
  const [frozenDates, setFrozenDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchSolvedDates = async () => {
      if (!profile?.id) return;
      const { data, error } = await supabase
        .from('daily_scores')
        .select('solved_date')
        .eq('profile_id', profile.id);
      if (!error && data) {
        const dates = data.map((d: any) => d.solved_date);
        setSolvedDates(Array.from(new Set(dates)));
      }
    };

    const fetchFrozenDates = async () => {
      if (!profile?.id) return;
      const { data, error } = await supabase
        .from('streak_freezes')
        .select('freeze_date')
        .eq('profile_id', profile.id);
      if (!error && data) {
        const dates = data.map((d: any) => d.freeze_date);
        setFrozenDates(Array.from(new Set(dates)));
      }
    };

    fetchSolvedDates();
    fetchFrozenDates();
  }, [profile?.id, scores]);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  const handlePrevMonth = () => {
    triggerHapticClick();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    triggerHapticClick();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0: Sun, 1: Mon...

    // Total days in the month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    // Pad leading days from previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Add current month days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const playedToday = scores.length > 0;



  // Standings and members state per group
  const [groupStandings, setGroupStandings] = useState<Record<string, any[]>>({});
  const [groupMembers, setGroupMembers] = useState<Record<string, any[]>>({});
  const [groupSeasons, setGroupSeasons] = useState<Record<string, any>>({});
  const [cosmetics, setCosmetics] = useState<any[]>([]);

  // Fetch cosmetics for character resolution
  useEffect(() => {
    supabase.from('cosmetics').select('*').then(({ data }) => {
      if (data) setCosmetics(data);
    });
    // Reference groupStandings to silence unused-locals compiler warning
    if (Object.keys(groupStandings).length > 0) {
      console.debug('Standings loaded');
    }
  }, [groupStandings]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);


  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [suggestedName] = useState(() => {
    const randomIndex = Math.floor(Math.random() * SUGGESTED_NAMES.length);
    return SUGGESTED_NAMES[randomIndex];
  });

  // Check for join/code query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join') || params.get('code');
    if (code) {
      setJoinInviteCode(code);
      setShowJoinModal(true);
      // Remove query parameters from URL without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleAutoSubmitSuccess = async (
    _gameId: string,
    _pointsEarned: number,
    isFirstSubmissionToday: boolean,
    newStreakCount?: number
  ) => {
    // Refresh standings for user groups
    groups.forEach(async (g) => {
      const standings = await getStandings(g.id);
      setGroupStandings((prev) => ({ ...prev, [g.id]: standings }));
    });

    // Show streak animation if first submission today
    if (isFirstSubmissionToday) {
      setStreakAnimationValue(newStreakCount || (profile?.streak_count || 0) + 1);
      setShowStreakAnimation(true);
    }

    refreshProfile();
    refreshScores();
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  // Fetch standings, members and active seasons for user groups
  useEffect(() => {
    let active = true;
    if (groups.length > 0) {
      const fetchGroupData = async () => {
        const standingsMap: Record<string, any> = {};
        const membersMap: Record<string, any> = {};
        const seasonsMap: Record<string, any> = {};

        await Promise.all(
          groups.map(async (g) => {
            const [standings, members, { data: seasonData }] = await Promise.all([
              getStandings(g.id),
              getGroupMembers(g.id),
              supabase
                .from('seasons')
                .select('start_date, end_date')
                .eq('group_id', g.id)
                .eq('is_active', true)
                .maybeSingle()
            ]);
            standingsMap[g.id] = standings;
            membersMap[g.id] = members;
            seasonsMap[g.id] = seasonData || null;
          })
        );

        if (active) {
          setGroupStandings((prev) => ({ ...prev, ...standingsMap }));
          setGroupMembers((prev) => ({ ...prev, ...membersMap }));
          setGroupSeasons((prev) => ({ ...prev, ...seasonsMap }));
        }
      };

      fetchGroupData();
    }
    return () => {
      active = false;
    };
  }, [groups]);

  const processSubmission = async (text: string) => {
    if (!text.trim()) return;
    await triggerHapticClick();
    setSubmitMessage(null);

    const parsed = parseShareText(text);
    if (!parsed) {
      await triggerHapticError();
      setSubmitMessage({ type: 'error', text: t('dashboard.errors.failedToParse', 'Failed to parse the minigame. Please try again.') });
      return;
    }

    // Check if user has any groups joined
    if (groups.length === 0) {
      await triggerHapticError();
      setSubmitMessage({
        type: 'error',
        text: t('dashboard.errors.noGroupsWithGame', 'You dont have any group with this minigame. Please add this minigame to a group or create a new group with this minigame.')
      });
      return;
    }

    // Query active games for the user's groups to see if the minigame is assigned to any of them
    const gameIdsToCheck = parsed.gameId === 'wordle_es' || parsed.gameId === 'la_palabra'
      ? ['wordle_es', 'la_palabra']
      : [parsed.gameId];

    // Query active games for the user's groups to see if the minigame is assigned to any of them
    const { data: activeGroupGames, error: activeErr } = await supabase
      .from('group_games')
      .select('group_id')
      .in('game_id', gameIdsToCheck)
      .in('group_id', groups.map(g => g.id));

    if (activeErr || !activeGroupGames || activeGroupGames.length === 0) {
      await triggerHapticError();
      setSubmitMessage({
        type: 'error',
        text: t('dashboard.errors.noGroupsWithGame', 'You dont have any group with this minigame. Please add this minigame to a group or create a new group with this minigame.')
      });
      return;
    }

    // Check if user already submitted this game today
    const alreadySubmitted = scores.some((s) =>
      s.game_id === parsed.gameId ||
      ((parsed.gameId === 'wordle_es' || parsed.gameId === 'la_palabra') &&
        (s.game_id === 'wordle_es' || s.game_id === 'la_palabra'))
    );
    if (alreadySubmitted) {
      await triggerHapticError();
      setSubmitMessage({ type: 'error', text: t('dashboard.alreadySubmitted') });
      return;
    }

    const isFirstSubmissionToday = scores.length === 0;

    // Submit via RPC
    const res = await submitScore(parsed.gameId, text, parsed.score, parsed.maxScore);
    if (res.success) {
      await triggerHapticSuccess();
      setSubmitMessage({
        type: 'success',
        text: `${t('dashboard.submitSuccess')} (+${res.pointsEarned} pts)`,
      });
      setClipboardText('');
      // Refresh standings
      groups.forEach(async (g) => {
        const standings = await getStandings(g.id);
        setGroupStandings((prev) => ({ ...prev, [g.id]: standings }));
      });

      // Show streak animation if first submission today
      if (isFirstSubmissionToday) {
        setStreakAnimationValue(res.newStreakCount || (profile?.streak_count || 0) + 1);
        setShowStreakAnimation(true);
      }

      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmitMessage(null);
      }, 2000);
    } else {
      await triggerHapticError();
      setSubmitMessage({ type: 'error', text: res.message });
    }
  };

  // Listen for native share target events forwarded via route state
  useEffect(() => {
    const locState = location.state as any;
    if (locState?.sharedText) {
      const text = locState.sharedText;
      // Clear navigation state to prevent re-submitting on reload/re-render
      navigate(location.pathname, { replace: true, state: {} });

      // Open modal, set clipboardText, and auto-submit
      setShowSubmitModal(true);
      setClipboardText(text);

      // Process submission automatically after a slight delay to allow modal render
      setTimeout(() => {
        processSubmission(text);
      }, 500);
    }
  }, [location.state, navigate, groups, scores]);

  const handleSubmitScore = async () => {
    await processSubmission(clipboardText);
  };



  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInviteCode.trim()) return;
    await triggerHapticClick();

    const res = await joinGroup(joinInviteCode);
    if (res.success) {
      await triggerHapticSuccess();
      setJoinInviteCode('');
      setShowJoinModal(false);
    } else {
      await triggerHapticError();
      alert(res.error || t('dashboard.errors.joinFailed'));
    }
  };

  const toggleMuteGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await triggerHapticClick();

    const currentMuted = mutedGroups[groupId] || false;
    const newMuted = !currentMuted;

    // Find group name
    const groupName = groups.find(g => g.id === groupId)?.name || t('dashboard.group', 'Group');

    // Show glass material toast message
    const message = newMuted
      ? t('dashboard.groupMuted', { defaultValue: 'Muted {{groupName}}', groupName })
      : t('dashboard.groupUnmuted', { defaultValue: 'Unmuted {{groupName}}', groupName });

    const toastIcon = newMuted ? '🔕' : '🔔';
    showToast(message, toastIcon);

    // Optimistically update local UI state
    setMutedGroups(prev => ({ ...prev, [groupId]: newMuted }));

    // Save to database
    const res = await updateMuteStatus(groupId, newMuted);
    if (!res.success) {
      // Revert local state on database error
      setMutedGroups(prev => ({ ...prev, [groupId]: currentMuted }));
      showToast(t('dashboard.errors.muteFailed', { defaultValue: 'Failed to update mute status' }), '⚠️');
    }
  };



  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-b from-surface-container-low to-surface-container text-on-surface font-body-md pb-24 pt-safe pb-safe">
      {/* Top Navbar */}
      <header className="flex justify-between items-center px-margin-mobile pt-safe h-[calc(4rem+env(safe-area-inset-top,0px))] w-full z-50 fixed top-0 bg-surface-container-low/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <img
              alt="Puzzlr Mascot"
              className="w-full h-full object-contain"
              src={appLogoNoBg}
            />
          </div>
          <h1 className="font-bungee text-2xl text-amber-400 text-shadow-3d-amber dark:text-shadow-3d-amber-dark tracking-normal">PUZZLR</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Stats - Streak */}
          <button
            onClick={() => {
              triggerHapticClick();
              setShowCalendar(!showCalendar);
            }}
            className={`h-7 flex items-center bg-white px-2 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer ${
              playedToday
                ? 'text-orange-600'
                : 'text-sky-600'
            }`}
            title="Streak Progress"
          >
            <img
              src={playedToday ? streakHot : streakCold}
              alt={playedToday ? "Hot Streak" : "Cold Streak"}
              className="w-4 h-4 object-contain select-none mr-0.5"
            />
            <span className="font-space-mono font-bold text-xs leading-none tabular-nums text-slate-800">
              {profile?.streak_count || 0}
            </span>
          </button>

          {/* Stats - Coins */}
          <Link
            to="/shop"
            onClick={() => triggerHapticClick()}
            className="h-7 flex items-center bg-white px-2 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all text-slate-800 cursor-pointer"
            title={t('dashboard.shop')}
          >
            <img src={coinX3} alt="Coins" className="w-4 h-4 object-contain mr-0.5 select-none" />
            <span className="font-space-mono font-bold text-xs leading-none tabular-nums text-slate-800">
              {profile?.spendable_points || 0}
            </span>
          </Link>

          {/* Settings Button */}
          <Link
            to="/settings"
            onClick={() => triggerHapticClick()}
            className="w-7 h-7 bg-white border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all flex items-center justify-center text-slate-800"
            title={t('dashboard.settings')}
          >
            <span className="material-symbols-outlined text-[15px]">settings</span>
          </Link>
        </div>
      </header>

      {/* Content Wrapper to offset the fixed header */}
      <div className="w-full pt-16 flex-1 flex flex-col">
        {/* Mini Calendar Drawer - Moves the rest of the UI down */}
        <div className={`bg-white/95 border-slate-200/50 shadow-sm transition-all duration-500 ease-in-out overflow-hidden ${showCalendar
          ? 'max-h-[600px] py-5 px-6 opacity-100 border-y'
          : 'max-h-0 py-0 px-6 opacity-0 border-y-0'
          }`}>
          <div className="max-w-md mx-auto space-y-4">

            {/* Header controls for Calendar */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest min-w-[120px] text-center">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs font-black text-slate-600 flex items-center gap-1.5 select-none bg-slate-50 border border-slate-200/60 rounded-full px-2.5 py-1">
                <span>{profile?.streak_protectors || 0} x</span>
                <img src={streakProtector} alt="Streak Protector" className="w-4 h-4 object-contain" />
              </div>
            </div>

            {/* Duolingo Style Statistics Cards */}
            {(() => {
              const currentMonthYearPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
              const activeDaysThisMonth = solvedDates.filter(d => d.startsWith(currentMonthYearPrefix)).length;
              const freezesThisMonth = frozenDates.filter(d => d.startsWith(currentMonthYearPrefix)).length;

              return (
                <div className="grid grid-cols-2 gap-3 mb-1.5 border-b border-slate-100/50 pb-2">
                  {/* Active Days Card */}
                  <div className="relative flex items-center gap-3 p-1 select-none">
                    {activeDaysThisMonth >= 5 && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-black px-1.5 py-0.5 rounded absolute -top-3 left-1 uppercase tracking-wider scale-90 origin-left">
                        {t('calendar.excellent', 'EXCELLENT')}
                      </span>
                    )}
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 text-lg shadow-inner">
                      🔥
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-base font-black text-slate-800 leading-none">{activeDaysThisMonth}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight mt-0.5">
                        {t('calendar.practiceDaysLabel', 'practice days')}
                      </span>
                    </div>
                  </div>

                  {/* Freezes Used Card */}
                  <div className="flex items-center gap-3 p-1 select-none">
                    <div className="w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center text-white shrink-0 text-lg shadow-inner">
                      ❄️
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-base font-black text-slate-800 leading-none">{freezesThisMonth}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight mt-0.5">
                        {t('calendar.freezesUsedLabel', 'freezes used')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Calendar grid headers */}
            <div className="grid grid-cols-7 gap-2 text-center border-b border-slate-100 pb-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                <span key={label} className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
              ))}
            </div>

            {/* Calendar grid days */}
            <div className="grid grid-cols-7 gap-x-2 gap-y-3">
              {(() => {
                const days = getMonthDays();
                return days.map((dayDate, idx) => {
                  if (!dayDate) {
                    return <div key={`empty-${idx}`} className="w-9 h-9" />;
                  }

                  // YYYY-MM-DD local construction safely
                  const year = dayDate.getFullYear();
                  const monthStr = String(dayDate.getMonth() + 1).padStart(2, '0');
                  const dateStrNum = String(dayDate.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${monthStr}-${dateStrNum}`;

                  const isSolved = solvedDates.includes(dateStr);
                  const isFrozen = frozenDates.includes(dateStr);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const signupDateStr = profile?.created_at ? profile.created_at.split('T')[0] : '';

                  const isBeforeSignup = signupDateStr ? dateStr < signupDateStr : false;
                  const isAfterToday = dateStr > todayStr;
                  const isToday = dateStr === todayStr;

                  // Simple render if outside of active user usage bounds (before signup or in future)
                  if (isBeforeSignup || isAfterToday) {
                    return (
                      <div key={dateStr} className="flex flex-col items-center justify-center h-9 relative">
                        <span className={`text-[10px] font-black text-slate-300 w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'border-2 border-slate-200 text-slate-400' : ''}`}>
                          {dayDate.getDate()}
                        </span>
                      </div>
                    );
                  }

                  // Determine connection to neighbors in the same week row for active (solved) days
                  const colIdx = idx % 7;

                  const getFormattedDayAt = (offset: number) => {
                    const targetIdx = idx + offset;
                    if (targetIdx < 0 || targetIdx >= days.length) return null;
                    const d = days[targetIdx];
                    if (!d) return null;
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const dn = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${dn}`;
                  };

                  const prevDayStr = colIdx > 0 ? getFormattedDayAt(-1) : null;
                  const nextDayStr = colIdx < 6 ? getFormattedDayAt(1) : null;

                  const hasLeftConnection = isSolved && prevDayStr && solvedDates.includes(prevDayStr);
                  const hasRightConnection = isSolved && nextDayStr && solvedDates.includes(nextDayStr);

                  // Render day cell
                  return (
                    <div key={dateStr} className="flex flex-col items-center justify-center h-9 relative group">

                      {/* Active Connection Background Capsule */}
                      {isSolved && (
                        <div
                          className={`absolute top-0.5 bottom-0.5 bg-gradient-to-r from-amber-400 to-orange-400 shadow-sm z-0 ${hasLeftConnection ? '-left-2' : 'left-0.5'
                            } ${hasRightConnection ? '-right-2' : 'right-0.5'
                            } ${!hasLeftConnection ? 'rounded-l-full' : ''
                            } ${!hasRightConnection ? 'rounded-r-full' : ''
                            }`}
                        />
                      )}

                      {/* Day number container */}
                      <div
                        className={`w-8 h-8 flex items-center justify-center text-xs font-black select-none z-10 transition-all ${isSolved
                            ? 'text-white'
                            : isFrozen
                              ? 'bg-sky-100 border-2 border-sky-300 text-sky-700 rounded-full shadow-sm'
                              : isToday
                                ? 'border-2 border-dashed border-amber-400 text-slate-700 bg-amber-50/20 rounded-full animate-pulse'
                                : 'text-slate-300 bg-transparent border-transparent'
                          }`}
                        title={isSolved ? 'Solved!' : isFrozen ? 'Streak Frozen' : isToday ? 'Today' : 'Missed day'}
                      >
                        <span>{dayDate.getDate()}</span>

                        {/* Fire badge for single/isolated solved days */}
                        {isSolved && !hasLeftConnection && !hasRightConnection && (
                          <span className="absolute -top-1.5 -right-1 text-[8px] filter drop-shadow-sm select-none z-20">🔥</span>
                        )}
                        {/* Snowflake badge for freeze days */}
                        {isFrozen && (
                          <span className="absolute -top-1.5 -right-1.5 text-[10px] select-none z-20">❄️</span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

          </div>
        </div>

        {/* Main Container */}
        <main className="w-full px-margin-mobile max-w-lg mx-auto pt-4 space-y-6 flex-1">

          {/* Group / League Cards */}
          <div className="space-y-6">
            {groupsLoading ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 font-bold tracking-wider uppercase">{t('dashboard.loadingLeagues')}</p>
              </div>
            ) : (groupsError || scoresError) ? (
              <div className="text-center py-10 bg-rose-50/60 border border-rose-200/50 rounded-[32px] p-6 backdrop-blur-md shadow-sm flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 bg-rose-100/80 border border-rose-200/50 rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-rose-800 tracking-tight">{t('groups.loadErrorTitle', 'Failed to Load Leagues')}</h3>
                  <p className="text-xs text-rose-600 font-medium max-w-[220px] mx-auto leading-relaxed">
                    {t('groups.loadErrorDesc', 'There was an issue fetching your leagues. Please check your connection.')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    triggerHapticClick();
                    refreshGroups();
                    refreshScores();
                  }}
                  className="mt-1 px-4 py-2 bg-rose-100 hover:bg-rose-200 active:bg-rose-300 text-rose-700 text-xs font-bold rounded-full transition-colors shadow-sm"
                >
                  {t('groups.retry', 'Retry')}
                </button>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12 bg-white/70 border border-slate-200/60 rounded-[32px] p-8 backdrop-blur-md shadow-sm flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-3xl">👥</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">{t('groups.noGroups')}</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-[200px] mx-auto leading-relaxed">{t('dashboard.createGroupHint')}</p>
                </div>
              </div>
            ) : (
              groups.map((group) => {
                 const members = groupMembers[group.id] || [];
                 const isMuted = mutedGroups[group.id] || false;

                return (
                  <Link
                    key={group.id}
                    to={`/group/${group.id}`}
                    onClick={() => triggerHapticClick()}
                    className="block bg-white rounded-2xl overflow-hidden border-[1.5px] border-slate-900 shadow-[1.5px_1.5px_0px_0px_#ffffff,3px_3px_0px_0px_#0f172a] transition-all hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1px_1px_0px_0px_#ffffff,2px_2px_0px_0px_#0f172a]"
                  >
                    {/* Banner image with overlapping avatars */}
                    <div className="relative h-36 w-full bg-slate-900">
                      <img
                        src={group.image_url || BANNER_PRESETS[0].url}
                        alt={group.name}
                        className="w-full h-full object-cover opacity-90"
                      />

                      {/* Volume Mute Toggle */}
                      <button
                        onClick={(e) => toggleMuteGroup(group.id, e)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/95 border border-slate-900 flex items-center justify-center text-[10px] shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-900 z-20"
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Member Avatars Overlapping at the bottom-left */}
                      <div className="absolute -bottom-2.5 left-4 flex -space-x-2 z-10">
                        {members.slice(0, 4).map((member, idx) => (
                          <div
                            key={member.profile_id || idx}
                            className="w-8 h-8 flex items-center justify-center relative overflow-visible"
                            style={{ zIndex: 10 - idx }}
                            title={member.username}
                          >
                            <AvatarViewer
                              avatarUrl={member.avatar_url}
                              badgeKey={cosmetics.find(c => c.id === member.equipped_badge_id)?.asset_key || ''}
                              size="sm"
                              borderClass="border-slate-900"
                              shadowClass="shadow-sm"
                            />
                          </div>
                        ))}
                        {members.length > 4 && (
                          <div className="w-8 h-8 rounded-full border border-slate-900 bg-slate-900 text-white font-extrabold text-[9px] flex items-center justify-center shadow-md z-0">
                            +{members.length - 4}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info details under the banner image */}
                    <div className="p-4 pt-5 bg-white text-slate-900 space-y-1 relative z-0">
                      <div className="flex justify-between items-center">
                        <div className="space-y-0.5 min-w-0">
                          <h3 className="font-extrabold text-base text-slate-900 font-outfit tracking-tight truncate">
                            {group.name}
                          </h3>
                          <div className="text-[10px] font-bold text-slate-400 font-sans">
                            {(() => {
                              const season = groupSeasons[group.id];
                              return season ? formatDateRange(season.start_date, season.end_date, i18n.language) : '';
                            })()}
                          </div>
                        </div>

                        {/* Right-aligned CTA retro button */}
                        <div className="shrink-0 bg-white border border-slate-900 px-3 py-1.5 text-[9px] font-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#0f172a] uppercase tracking-wider text-slate-900 select-none">
                          {playedToday ? t('dashboard.viewScores') : t('dashboard.sendResult')}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Group Suggestion Box */}
          <section className="w-full mt-6 border-2 border-dashed border-primary/20 rounded-3xl py-6 flex flex-col items-center justify-center bg-surface-container-lowest/50 backdrop-blur-sm">
            <h3 className="text-headline-sm font-headline-sm text-on-surface mb-1 flex items-center gap-2">
              {suggestedName}
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant">
              {t('dashboard.groupSuggestion')}
            </p>
          </section>

          {/* Create/Join Action Buttons */}
          <div className="w-full mt-8 flex flex-col gap-4 pb-8">
            {/* + NUEVO GRUPO button in yellow */}
            <button
              onClick={() => {
                triggerHapticClick();
                openCreateModal();
              }}
              className="w-full py-4 rounded-2xl font-outfit font-black italic text-sm tracking-tight text-on-tertiary-fixed bg-tertiary-fixed-dim shadow-[0_4px_14px_rgba(249,189,34,0.3)] hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 border-b-4 border-tertiary/20 uppercase"
            >
              {t('dashboard.newGroupBtn')}
            </button>

            {/* Unirse a grupo pill link */}
            <button
              onClick={() => {
                triggerHapticClick();
                setShowJoinModal(true);
              }}
              className="w-max mx-auto px-8 py-3 rounded-full font-outfit font-bold italic text-xs tracking-tight uppercase text-on-surface bg-surface-container-lowest shadow-sm border border-outline-variant/30 hover:scale-[0.98] transition-transform"
            >
              {t('dashboard.joinGroupBtn')}
            </button>
          </div>

        </main>
      </div>



      {/* JOIN GROUP MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-sky-50 text-slate-800 border-2 border-slate-900 rounded-[32px] max-w-md w-full p-8 md:p-10 space-y-6 shadow-[4px_4px_0px_#0f172a] relative">
            <button
              onClick={() => {
                triggerHapticClick();
                setShowJoinModal(false);
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            <div className="space-y-2">
              <h3 className="font-outfit font-black text-2xl text-slate-900 uppercase tracking-tight">
                {t('dashboard.joinModal.title')}
              </h3>
              <p className="text-xs font-outfit text-slate-500 leading-snug">
                {t('dashboard.joinModal.subtitle')}
              </p>
            </div>

            <hr className="border-slate-900/10" />

            <form onSubmit={handleJoinGroup} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-outfit font-black uppercase tracking-wider text-slate-600">
                  {t('groups.inviteCode')}
                </label>
                <input
                  type="text"
                  placeholder={t('dashboard.joinModal.codePlaceholder')}
                  value={joinInviteCode}
                  onChange={(e) => setJoinInviteCode(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-slate-900 rounded-xl text-center text-sm font-semibold tracking-wider text-slate-800 placeholder-slate-400 uppercase focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={!joinInviteCode.trim()}
                className="w-full py-3.5 bg-sky-400 hover:bg-sky-300 text-slate-900 font-outfit font-black border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_#0c4a6e] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all text-xs tracking-wider uppercase disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-0"
              >
                {t('dashboard.joinModal.joinBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <ClipboardAutoSubmitter onSuccess={handleAutoSubmitSuccess} />

      {/* SCORE SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
                <Clipboard className="w-5 h-5 text-emerald-600" /> {t('dashboard.submitModal.title')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{t('dashboard.submitModal.subtitle')}</p>
            </div>

            <div className="space-y-4">
              <textarea
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                placeholder={t('dashboard.pastePlaceholder')}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-medium text-xs"
              />

              {submitMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${submitMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                    }`}
                >
                  {submitMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                  <span className="text-[10px]">{submitMessage.text}</span>
                </div>
              )}

              <button
                onClick={handleSubmitScore}
                disabled={!clipboardText.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 font-bold rounded-2xl shadow-sm transition-all text-xs"
              >
                {t('dashboard.pasteButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STREAK INCREASE ANIMATION MODAL */}
      {showStreakAnimation && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 text-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl relative border border-white/20 transform scale-100 transition-all duration-300 flex flex-col items-center text-center space-y-6 animate-scale-up">

            {/* Sparkles / Effects */}
            <div className="absolute top-4 right-6 text-2xl animate-ping opacity-60">✨</div>
            <div className="absolute bottom-6 left-6 text-xl animate-bounce">⭐</div>

            {/* Animated Fire Icon */}
            <div className="relative w-28 h-28 flex items-center justify-center bg-white/20 rounded-full border border-white/30 shadow-lg animate-pulse">
              <img
                src={streakHot}
                alt="Streak Fire"
                className="w-20 h-20 object-contain select-none"
              />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase drop-shadow-sm">
                {t('dashboard.streakIncreased', 'Streak Increased!')}
              </h2>
              <p className="text-xs font-semibold opacity-90 leading-relaxed">
                {t('dashboard.streakIncreasedDesc', 'Your daily puzzle solving streak is heating up! Keep it going tomorrow.')}
              </p>
            </div>

            {/* Streak Count Circle */}
            <div className="bg-white text-orange-600 rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg border border-orange-200">
              <span className="text-3xl font-black leading-none tabular-nums">{streakAnimationValue}</span>
              <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">Days</span>
            </div>

            {/* CTA Close Button */}
            <button
              onClick={async () => {
                await triggerHapticClick();
                setShowStreakAnimation(false);
              }}
              className="w-full py-4 bg-white hover:bg-slate-50 text-orange-600 font-black rounded-2xl transition-all text-sm uppercase tracking-wider shadow-md active:scale-[0.98] cursor-pointer"
            >
              Sweet!
            </button>
          </div>
        </div>
      )}



      {/* GLASS MATERIAL TOAST NOTIFICATION */}
      {toast && toast.visible && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-[9999] pointer-events-none px-4">
          <div className="bg-white/45 dark:bg-slate-900/45 backdrop-blur-md border border-white/30 dark:border-slate-800/30 shadow-lg text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all duration-300 pointer-events-auto animate-fade-in-up">
            <span className="text-base select-none">{toast.icon}</span>
            <span className="text-xs font-bold tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
};
