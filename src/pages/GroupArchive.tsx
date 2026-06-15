import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import {
  triggerHapticClick,
  triggerHapticSelection
} from '../utils/haptics';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History,
  TrendingUp,
  Users
} from 'lucide-react';
import { AvatarViewer } from '../components/AvatarViewer';

interface ProfileSummary {
  id: string;
  username: string;
  avatar_url: string | null;
  equipped_character_id?: string | null;
  equipped_badge_id?: string | null;
}

interface Game {
  id: string;
  display_name: string;
  reset_time_utc: string;
  base_points: number;
}

interface Season {
  id: string;
  group_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface GroupArchiveProps {
  groupId: string;
  onClose: () => void;
  members: ProfileSummary[];
  allGames: Game[];
  activeGameIds: string[];
  cosmetics: any[];
  season: Season | null;
  profile: any;
}

// Game details and icons for style matching
const GAME_DECORATION: Record<string, { bg: string; text: string; icon: string }> = {
  word_grid: { bg: 'bg-emerald-50 border-emerald-150', text: 'text-emerald-700', icon: '📝' },
  wordle_es: { bg: 'bg-rose-50 border-rose-150', text: 'text-rose-700', icon: '🇪🇸' },
  la_palabra: { bg: 'bg-rose-50 border-rose-150', text: 'text-rose-700', icon: '🇪🇸' },
  word_group: { bg: 'bg-indigo-50 border-indigo-150', text: 'text-indigo-700', icon: '🔀' },
  chess_grid: { bg: 'bg-amber-50 border-amber-150', text: 'text-amber-700', icon: '👑' },
  strands: { bg: 'bg-sky-50 border-sky-150', text: 'text-sky-700', icon: '🧶' },
  linkedin_ques: { bg: 'bg-cyan-50 border-cyan-150', text: 'text-cyan-700', icon: '🧩' },
  pinpoint: { bg: 'bg-blue-50 border-blue-150', text: 'text-blue-700', icon: '🎯' },
  tango: { bg: 'bg-purple-50 border-purple-150', text: 'text-purple-700', icon: '⚖️' },
  zip: { bg: 'bg-teal-50 border-teal-150', text: 'text-teal-700', icon: '⚡' },
};

export const GroupArchive: React.FC<GroupArchiveProps> = ({
  groupId,
  onClose,
  members,
  allGames,
  activeGameIds,
  cosmetics,
  season,
  profile
}) => {
  const { t, i18n } = useTranslation();

  const activeGames = React.useMemo(() => {
    return allGames.filter((g) => activeGameIds.includes(g.id));
  }, [allGames, activeGameIds]);

  const [selectedGameId, setSelectedGameId] = useState<string>(activeGames[0]?.id || 'word_grid');
  const [archiveScores, setArchiveScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHistorical, setIsHistorical] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [archiveSeasons, setArchiveSeasons] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'minigame' | 'season'>('minigame');

  // Load seasons list once
  useEffect(() => {
    const loadSeasons = async () => {
      const { data } = await supabase
        .from('seasons')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', false)
        .order('end_date', { ascending: false });
      if (data) setArchiveSeasons(data);
    };
    loadSeasons();
  }, [groupId]);

  // Load scores for selected game
  const loadScores = async (gameId: string) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const memberIds = members.map((m) => m.id);
      if (memberIds.length === 0) {
        setArchiveScores([]);
        return;
      }

      const { data, error } = await supabase
        .from('daily_scores')
        .select('*, profiles(id, username, avatar_url, equipped_character_id, equipped_badge_id)')
        .in('profile_id', memberIds)
        .eq('game_id', gameId)
        .order('solved_date', { ascending: false });

      if (error) {
        console.error('Error loading archive scores:', error);
      } else {
        setArchiveScores(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGameId) {
      loadScores(selectedGameId);
    }
  }, [selectedGameId, members]);

  // Filtered scores depending on "This Season" vs "Historical"
  const filteredScores = React.useMemo(() => {
    if (isHistorical || !season) {
      return archiveScores;
    }
    return archiveScores.filter(
      (s) => s.solved_date >= season.start_date && s.solved_date <= season.end_date
    );
  }, [archiveScores, isHistorical, season]);

  // Guesses statistics logic
  const stats = React.useMemo(() => {
    const isWordleLike =
      selectedGameId === 'word_grid' ||
      selectedGameId === 'wordle_es' ||
      selectedGameId === 'la_palabra';

    const userScores = archiveScores.filter((s) => s.profile_id === profile?.id);
    if (userScores.length === 0) {
      return { XX: 0, YY: 0, avgStr: '0.00', isWordleLike };
    }

    if (isWordleLike) {
      // Find first played date of all time
      const solvedDates = userScores.map((s) => s.solved_date).sort();
      let minDateStr = solvedDates[0];

      if (!isHistorical && season) {
        if (minDateStr < season.start_date) {
          minDateStr = season.start_date;
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];
      let maxDateStr = todayStr;
      if (!isHistorical && season && season.end_date < todayStr) {
        maxDateStr = season.end_date;
      }

      if (minDateStr > maxDateStr) {
        return { XX: 0, YY: 0, avgStr: '0.00', isWordleLike };
      }

      const datesList: string[] = [];
      const current = new Date(minDateStr);
      const last = new Date(maxDateStr);
      const curr = new Date(current.getFullYear(), current.getMonth(), current.getDate());
      const end = new Date(last.getFullYear(), last.getMonth(), last.getDate());

      while (curr <= end) {
        datesList.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }

      let XX = 0;
      let YY = 0;

      datesList.forEach((dayStr) => {
        const scoreObj = userScores.find((s) => s.solved_date === dayStr);
        if (scoreObj) {
          const g = scoreObj.score === 0 ? 8 : 7 - scoreObj.score;
          XX += g;
        } else {
          XX += 8;
        }
        YY += 1;
      });

      const ZZ = YY > 0 ? XX / YY : 0;
      return {
        XX, // total guesses
        YY, // total games
        avgStr: ZZ.toFixed(2),
        isWordleLike
      };
    } else {
      // Non-Wordle like games (e.g. Connections, Chess)
      const filtered = !isHistorical && season
        ? userScores.filter((s) => s.solved_date >= season.start_date && s.solved_date <= season.end_date)
        : userScores;

      const YY = filtered.length;
      const totalScore = filtered.reduce((sum, s) => sum + s.score, 0);
      const avg = YY > 0 ? totalScore / YY : 0;

      return {
        XX: totalScore,
        YY,
        avgStr: avg.toFixed(1),
        isWordleLike
      };
    }
  }, [archiveScores, selectedGameId, profile, isHistorical, season]);

  // Weekly average trend comparison
  const weeklyTrend = React.useMemo(() => {
    const userScores = archiveScores.filter((s) => s.profile_id === profile?.id);
    if (userScores.length === 0) return null;

    const solvedDates = userScores.map((s) => s.solved_date).sort();
    const minDateStr = solvedDates[0];

    const today = new Date();
    const isWordleLike =
      selectedGameId === 'word_grid' ||
      selectedGameId === 'wordle_es' ||
      selectedGameId === 'la_palabra';

    const getWeekDays = (offsetDaysStart: number, offsetDaysEnd: number) => {
      const list: string[] = [];
      for (let i = offsetDaysStart; i >= offsetDaysEnd; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayVal = String(d.getDate()).padStart(2, '0');
        list.push(`${y}-${m}-${dayVal}`);
      }
      return list;
    };

    const thisWeekDates = getWeekDays(6, 0);
    const lastWeekDates = getWeekDays(13, 7);

    const getWeekStats = (dates: string[]) => {
      let sum = 0;
      let count = 0;

      dates.forEach((dayStr) => {
        if (dayStr >= minDateStr) {
          const scoreObj = userScores.find((s) => s.solved_date === dayStr);
          if (isWordleLike) {
            const g = scoreObj ? (scoreObj.score === 0 ? 8 : 7 - scoreObj.score) : 8;
            sum += g;
          } else {
            const s = scoreObj ? scoreObj.score : 0;
            sum += s;
          }
          count += 1;
        }
      });

      return { sum, count };
    };

    const thisWeek = getWeekStats(thisWeekDates);
    const lastWeek = getWeekStats(lastWeekDates);

    if (thisWeek.count === 0 || lastWeek.count === 0) return null;

    const avgThisWeek = thisWeek.sum / thisWeek.count;
    const avgLastWeek = lastWeek.sum / lastWeek.count;

    if (avgLastWeek === 0) return null;

    const percentChange = ((avgThisWeek - avgLastWeek) / avgLastWeek) * 100;

    const isImproved = isWordleLike ? percentChange < 0 : percentChange > 0;
    const isWorse = isWordleLike ? percentChange > 0 : percentChange < 0;

    return {
      percentChange,
      isImproved,
      isWorse
    };
  }, [archiveScores, selectedGameId, profile]);

  // Format score for displaying in log list
  const formatScoreDisplay = (
    gameId: string,
    score: number,
    maxScore: number,
    rawText: string
  ) => {
    if (gameId === 'word_grid' || gameId === 'wordle_es' || gameId === 'la_palabra') {
      const guesses = score === 0 ? 'X' : String(7 - score);
      return `${guesses}/6`;
    } else if (gameId === 'chess_grid') {
      const timeMatch = rawText?.match(/(\d+:\d+)/);
      if (timeMatch) {
        return timeMatch[0];
      } else {
        return `${score}/100`;
      }
    } else if (gameId === 'word_group') {
      return `${score}/4`;
    }
    return `${score}/${maxScore}`;
  };

  // Calendar render details
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const daysGrid = [];
    // Preceding empty days
    for (let i = 0; i < firstDayIndex; i++) {
      daysGrid.push(null);
    }
    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      daysGrid.push(new Date(year, month, d));
    }
    return daysGrid;
  };

  const calendarDays = getCalendarDays();
  const weekDays = i18n.language === 'es'
    ? ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Calculate day detail for calendar rendering
  const getDayDetail = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayVal = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayVal}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const userScores = archiveScores.filter((s) => s.profile_id === profile?.id);
    if (userScores.length === 0) return { status: 'disabled', text: '' };

    const solvedDates = userScores.map((s) => s.solved_date).sort();
    const minDateStr = solvedDates[0];

    // Determine boundaries based on season filter
    let startLimit = minDateStr;
    let endLimit = todayStr;

    if (!isHistorical && season) {
      if (startLimit < season.start_date) {
        startLimit = season.start_date;
      }
      if (season.end_date < endLimit) {
        endLimit = season.end_date;
      }
    }

    if (dateStr < startLimit || dateStr > endLimit) {
      return { status: 'disabled', text: '' };
    }

    // Check if score exists
    const scoreObj = userScores.find((s) => s.solved_date === dateStr);
    if (scoreObj) {
      if (scoreObj.score === 0) {
        return { status: 'failed', text: 'X' };
      }
      return { status: 'success', text: String(7 - scoreObj.score) };
    } else {
      return { status: 'missed', text: '8' };
    }
  };

  const handleMonthNav = async (direction: 'prev' | 'next') => {
    await triggerHapticClick();
    const offset = direction === 'prev' ? -1 : 1;
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1));
  };

  const selectedDeco = GAME_DECORATION[selectedGameId] || { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', icon: '🎮' };

  return (
    <div
      className="fixed inset-0 bg-slate-50 text-slate-800 z-50 flex flex-col pt-safe font-sans overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)',
        backgroundSize: '16px 16px'
      }}
    >
      {/* HEADER BAR */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 rounded-full transition-all active:scale-95 shadow-sm border border-slate-200"
          title={t('groupDetails.backBtn')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-md font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-tight">
          <History className="w-5 h-5 text-indigo-600" />
          {t('groupDetails.archiveModalTitle')}
        </h2>

        <div className="w-10 h-10" /> {/* Spacer */}
      </header>

      {/* VIEWPORT CONTROLLER TABS */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-100 flex p-1 max-w-sm mx-auto my-3 rounded-full shadow-inner w-[90%]">
        <button
          onClick={async () => {
            await triggerHapticClick();
            setActiveTab('minigame');
          }}
          className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-full transition-all ${
            activeTab === 'minigame'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('groupDetails.archiveTabMinigames')}
        </button>
        <button
          onClick={async () => {
            await triggerHapticClick();
            setActiveTab('season');
          }}
          className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-full transition-all ${
            activeTab === 'season'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('groupDetails.archiveTabSeasons')}
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-6">
        {activeTab === 'season' ? (
          /* SEASONS TAB VIEW */
          <div className="max-w-md mx-auto space-y-3.5 pt-2">
            {archiveSeasons.map((histSeason) => (
              <div
                key={histSeason.id}
                className="p-4 bg-white/95 border border-slate-100 rounded-[24px] shadow-sm flex items-center justify-between transition-all hover:shadow-md"
              >
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-900 block">
                    {t('groupDetails.season')}: {new Date(histSeason.start_date).toLocaleDateString()}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {histSeason.start_date} {t('groupDetails.to')} {histSeason.end_date}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-full uppercase tracking-wider">
                  {t('groupDetails.ended')}
                </span>
              </div>
            ))}

            {archiveSeasons.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium text-xs">
                {t('groupDetails.noArchiveData')}
              </div>
            )}
          </div>
        ) : (
          /* MINIGAMES TAB VIEW */
          <div className="max-w-md mx-auto space-y-5">
            {/* 1. HORIZONTAL CAROUSEL PICKER (ACTIVE GAMES ONLY) */}
            <div className="w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 block mb-2">
                {t('groupDetails.minigames')}
              </span>
              <div className="flex gap-2.5 overflow-x-auto px-1.5 py-3 -mx-1.5 scroll-smooth no-scrollbar">
                {activeGames.map((game) => {
                  const isSelected = game.id === selectedGameId;
                  const deco = GAME_DECORATION[game.id] || { bg: 'bg-slate-50', text: 'text-slate-700', icon: '🎮' };
                  return (
                    <button
                      key={game.id}
                      onClick={async () => {
                        await triggerHapticSelection();
                        setSelectedGameId(game.id);
                      }}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 border-2 rounded-2xl transition-all shadow-sm active:scale-95 ${
                        isSelected
                          ? `${deco.bg} border-indigo-500 scale-[1.02] shadow`
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{deco.icon}</span>
                      <div className="text-left">
                        <span className={`text-xs font-black block leading-none ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                          {game.id === 'wordle_es' || game.id === 'la_palabra' ? 'La Palabra' : game.display_name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. COLLAPSIBLE TRIGGER BAR */}
            <button
              onClick={async () => {
                await triggerHapticClick();
                setIsCollapsed(!isCollapsed);
              }}
              className="w-full flex items-center justify-between bg-white border border-slate-100 px-5 py-3.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedDeco.icon}</span>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  {selectedGameId === 'wordle_es' || selectedGameId === 'la_palabra' ? 'La Palabra del Día' : activeGames.find(g => g.id === selectedGameId)?.display_name}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-indigo-650 uppercase tracking-widest">
                <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>
            </button>

            {/* 3. COLLAPSIBLE CONTENT (STATS & CALENDAR & SCORES LOG) */}
            {!isCollapsed && (
              <div className="space-y-5 animate-fade-in">
                {/* SEASON FILTER TOGGLE */}
                <div className="flex items-center justify-between bg-white/70 border border-slate-100/50 p-1 rounded-full shadow-inner max-w-[260px] mx-auto">
                  <button
                    onClick={async () => {
                      await triggerHapticClick();
                      setIsHistorical(false);
                    }}
                    className={`flex-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider rounded-full transition-all ${
                      !isHistorical
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    {t('groupDetails.archiveToggleSeason')}
                  </button>
                  <button
                    onClick={async () => {
                      await triggerHapticClick();
                      setIsHistorical(true);
                    }}
                    className={`flex-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider rounded-full transition-all ${
                      isHistorical
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    {t('groupDetails.archiveToggleHistorical')}
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="w-7 h-7 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* STATS SUMMARY */}
                    {stats && (
                      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <TrendingUp className="w-20 h-20 text-slate-850" />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {t('groupDetails.archiveStatsLabel')}
                        </h4>
                        {stats.YY > 0 ? (
                          <div className="space-y-1">
                            {stats.isWordleLike ? (
                              <>
                                <p className="text-sm font-extrabold text-slate-900 leading-tight">
                                  <span className="text-2xl font-black text-indigo-650 tracking-tighter">{stats.XX}</span>{' '}
                                  {i18n.language === 'es' ? 'intentos en' : 'guesses out of'}{' '}
                                  <span className="text-2xl font-black text-indigo-650 tracking-tighter">{stats.YY}</span>{' '}
                                  {i18n.language === 'es' ? 'partidas' : 'games'}
                                </p>
                                <p className="text-[11px] font-bold text-slate-500">
                                  ⭐ <span className="text-indigo-600 font-extrabold">{stats.avgStr}</span>{' '}
                                  {i18n.language === 'es' ? 'intentos por partida' : 'guesses per game'}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-extrabold text-slate-900 leading-tight">
                                  <span className="text-2xl font-black text-indigo-650 tracking-tighter">{stats.YY}</span>{' '}
                                  {i18n.language === 'es' ? 'partidas jugadas' : 'games played'}
                                </p>
                                <p className="text-[11px] font-bold text-slate-500">
                                  ⭐ {i18n.language === 'es' ? 'Puntuación media:' : 'Average score:'}{' '}
                                  <span className="text-indigo-600 font-extrabold">{stats.avgStr}</span>
                                </p>
                              </>
                            )}

                            {/* Weekly Trend Indicator */}
                            {weeklyTrend && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <span
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    weeklyTrend.isImproved
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : weeklyTrend.isWorse
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {weeklyTrend.percentChange === 0 ? (
                                    <span>0.0%</span>
                                  ) : (
                                    <>
                                      <span>{weeklyTrend.isImproved ? (stats.isWordleLike ? '↓' : '↑') : (stats.isWordleLike ? '↑' : '↓')}</span>
                                      <span>{Math.abs(weeklyTrend.percentChange).toFixed(1)}%</span>
                                    </>
                                  )}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                  {i18n.language === 'es' ? 'desde la semana pasada' : 'since last week'}
                                </span>
                              </div>
                            )}

                            {stats.isWordleLike && (
                              <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase block pt-1.5 border-t border-slate-50">
                                ℹ️ {i18n.language === 'es' ? 'Contando X/6 o no jugado como 8/6' : 'Counting X/6 or not played as 8/6'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-slate-400">
                            {i18n.language === 'es' ? 'Aún no has jugado este minijuego' : 'You haven\'t played this minigame yet'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* CALENDAR VIEW */}
                    {stats && stats.YY > 0 && (
                      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                              {t('groupDetails.archiveCalendarTries')}
                            </h4>
                          </div>
                          {/* Month navigation */}
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-0.5 rounded-full shadow-inner">
                            <button
                              onClick={() => handleMonthNav('prev')}
                              className="p-1 hover:bg-white rounded-full transition-all active:scale-90"
                            >
                              <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                            <span className="text-[9px] font-black uppercase text-slate-700 px-1 select-none">
                              {calendarMonth.toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <button
                              onClick={() => handleMonthNav('next')}
                              className="p-1 hover:bg-white rounded-full transition-all active:scale-90"
                            >
                              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                          </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-7 gap-1 text-[9px] font-black text-slate-400 uppercase text-center tracking-widest pb-1 border-b border-slate-50">
                            {weekDays.map((wd, i) => (
                              <div key={i}>{wd}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center font-black">
                            {calendarDays.map((day, idx) => {
                              if (!day) return <div key={idx} className="aspect-square" />;
                              const detail = getDayDetail(day);
                              let cellClass = 'bg-slate-50 text-slate-450 border border-slate-100';
                              if (detail.status === 'disabled') {
                                cellClass = 'opacity-20 text-slate-300';
                              } else if (detail.status === 'success') {
                                cellClass = 'bg-emerald-50 text-emerald-700 border border-emerald-150 scale-95 shadow-sm';
                              } else if (detail.status === 'failed') {
                                cellClass = 'bg-rose-50 text-rose-700 border border-rose-150 scale-95 shadow-sm';
                              } else if (detail.status === 'missed') {
                                cellClass = 'bg-slate-100 text-slate-450 border border-slate-200/50 scale-95';
                              }

                              return (
                                <div
                                  key={idx}
                                  className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative ${cellClass}`}
                                >
                                  <span className="text-[9px] font-bold absolute top-1 left-1 opacity-60">
                                    {day.getDate()}
                                  </span>
                                  {detail.text && (
                                    <span className="text-xs font-black mt-2 leading-none">
                                      {detail.text}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-450 font-bold block text-center uppercase tracking-wider">
                          {t('groupDetails.archiveFirstPlayHint')}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
