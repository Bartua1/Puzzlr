import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { triggerHapticClick } from '../utils/haptics';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { AvatarViewer } from '../components/AvatarViewer';


interface Season {
  id: string;
  group_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Game {
  id: string;
  display_name: string;
  reset_time_utc: string;
  base_points: number;
}

interface ProfileSummary {
  id: string;
  username: string;
  avatar_url: string | null;
  equipped_badge_id?: string | null;
  equipped_character_id?: string | null;
}

interface DailyScore {
  profile_id: string;
  game_id: string;
  score: number;
  max_score: number;
  solved_date: string;
}

interface MemberStats {
  profile_id: string;
  username: string;
  avatar_url: string | null;
  equipped_badge_id: string | null;
  equipped_character_id: string | null;
  pointsHistory: number[];
  totalPlayed: number;
  totalWon: number;
  finalPoints: number;
  todayRank: number;
  yesterdayRank: number;
}

// User-specific colors based on final rank order (to match screenshot colors)
const USER_COLORS = [
  { border: 'border-red-500', stroke: '#EF4444', text: 'text-red-500', bg: 'bg-red-500/10' },
  { border: 'border-orange-500', stroke: '#F97316', text: 'text-orange-500', bg: 'bg-orange-500/10' },
  { border: 'border-yellow-400', stroke: '#FBBF24', text: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { border: 'border-emerald-500', stroke: '#10B981', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { border: 'border-sky-500', stroke: '#0EA5E9', text: 'text-sky-500', bg: 'bg-sky-500/10' },
  { border: 'border-purple-500', stroke: '#8B5CF6', text: 'text-purple-500', bg: 'bg-purple-500/10' },
];

// SVG Laurel branch wreath for the season card header
const LaurelBranch = () => (
  <svg viewBox="0 0 24 48" className="w-8 h-16 fill-current text-slate-800 opacity-80 select-none">
    {/* Stem */}
    <path d="M 22 46 Q 10 35 12 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Leaves left side of stem */}
    <path d="M 12 4 C 8 8, 4 14, 8 16 C 12 18, 12 12, 12 4 Z" />
    <path d="M 14 12 C 8 16, 4 22, 9 24 C 13 26, 14 20, 14 12 Z" />
    <path d="M 16 20 C 10 24, 6 30, 11 32 C 15 34, 16 28, 16 20 Z" />
    <path d="M 18 28 C 12 32, 8 38, 13 40 C 17 42, 18 36, 18 28 Z" />
    {/* Leaves right side of stem */}
    <path d="M 12 4 C 16 8, 20 14, 16 16 C 12 18, 12 12, 12 4 Z" opacity="0.75" />
    <path d="M 14 12 C 19 15, 22 20, 18 22 C 15 24, 14 18, 14 12 Z" opacity="0.75" />
    <path d="M 16 20 C 21 23, 24 28, 20 30 C 17 32, 16 26, 16 20 Z" opacity="0.75" />
    <path d="M 18 28 C 23 31, 26 36, 22 38 C 19 40, 18 34, 18 28 Z" opacity="0.75" />
  </svg>
);

// Green crystal gem badge for displaying user points
const GreenGemBadge = ({ points }: { points: number }) => (
  <div className="relative w-12 h-12 flex items-center justify-center select-none filter drop-shadow-md flex-shrink-0">
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" /> {/* emerald-400 */}
          <stop offset="50%" stopColor="#059669" /> {/* emerald-600 */}
          <stop offset="100%" stopColor="#065F46" /> {/* emerald-800 */}
        </linearGradient>
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A7F3D0" /> {/* emerald-200 */}
          <stop offset="100%" stopColor="#047857" /> {/* emerald-700 */}
        </linearGradient>
      </defs>
      <polygon
        points="50,5 92,27 92,73 50,95 8,73 8,27"
        fill="url(#gemGrad)"
        stroke="url(#borderGrad)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <polygon
        points="50,12 84,31 84,40 50,22"
        fill="#FFFFFF"
        opacity="0.25"
      />
      <polygon
        points="16,31 50,12 50,22 25,35"
        fill="#FFFFFF"
        opacity="0.12"
      />
    </svg>
    <span className="absolute text-[11px] font-black text-white tracking-tighter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]">
      {points}
    </span>
  </div>
);

export const GroupStats = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { profile } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [season, setSeason] = useState<Season | null>(null);
  const [seasonNumber, setSeasonNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [cosmetics, setCosmetics] = useState<any[]>([]);

  // Stats arrays
  const [dates, setDates] = useState<string[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [maxPointsScale, setMaxPointsScale] = useState<number>(400);

  // Load all historical daily score data for the season
  const loadStatsData = async () => {
    if (!groupId) return;
    try {
      setLoading(true);

      // 1. Fetch group details
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (!groupData) {
        navigate('/');
        return;
      }

      // 2. Fetch active season
      let { data: seasonData } = await supabase
        .from('seasons')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .maybeSingle();

      if (!seasonData) {
        // Automatically create default active season
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
          .toISOString()
          .split('T')[0]; // 1-month season default

        const { data: newSeason, error: insertErr } = await supabase
          .from('seasons')
          .insert({
            group_id: groupId,
            start_date: startDate,
            end_date: endDate,
            is_active: true,
          })
          .select('*')
          .single();

        if (!insertErr && newSeason) {
          seasonData = newSeason;
        } else {
          console.error("Failed to automatically create season in GroupStats:", insertErr);
        }
      }

      if (!seasonData) {
        setSeason(null);
        setLoading(false);
        return;
      }
      setSeason(seasonData);

      // Determine season number (index among all seasons for this group)
      const { data: allSeasons } = await supabase
        .from('seasons')
        .select('id, start_date')
        .eq('group_id', groupId)
        .order('start_date', { ascending: true });
      if (allSeasons) {
        const idx = allSeasons.findIndex(s => s.id === seasonData.id);
        setSeasonNumber(idx !== -1 ? idx + 1 : 1);
      }

      // 3. Fetch members
      const { data: membersData } = await supabase
        .from('group_members')
        .select('profile_id, profiles(id, username, avatar_url, equipped_badge_id, equipped_character_id)')
        .eq('group_id', groupId);

      if (!membersData || membersData.length === 0) {
        setMemberStats([]);
        setLoading(false);
        return;
      }
      const members = membersData.map((m: any) => m.profiles).filter(Boolean) as ProfileSummary[];

      // 4. Fetch games configuration
      const { data: gamesData } = await supabase
        .from('games')
        .select('*');
      const gamesMap = new Map<string, number>();
      if (gamesData) {
        gamesData.forEach((g: Game) => gamesMap.set(g.id, g.base_points));
      }

      // Fetch all cosmetics to map character profiles
      const { data: cosmeticsData } = await supabase
        .from('cosmetics')
        .select('*');
      if (cosmeticsData) setCosmetics(cosmeticsData);

      // 5. Generate dates list: start_date to Math.min(today, end_date)
      const todayStr = new Date().toISOString().split('T')[0];
      const endDateLimitStr = seasonData.end_date < todayStr ? seasonData.end_date : todayStr;

      const getDatesInRange = (startStr: string, endStr: string) => {
        const list = [];
        const current = new Date(startStr);
        const last = new Date(endStr);
        // Normalize to local midnight to avoid timezone shift omissions
        const curr = new Date(current.getFullYear(), current.getMonth(), current.getDate());
        const end = new Date(last.getFullYear(), last.getMonth(), last.getDate());
        while (curr <= end) {
          list.push(curr.toISOString().split('T')[0]);
          curr.setDate(curr.getDate() + 1);
        }
        return list;
      };

      const dateRange = getDatesInRange(seasonData.start_date, endDateLimitStr);
      setDates(dateRange);

      if (dateRange.length === 0) {
        setMemberStats([]);
        setLoading(false);
        return;
      }

      // 6. Fetch all daily scores for the season date range and group members
      const memberIds = members.map(m => m.id);
      const { data: scoresData } = await supabase
        .from('daily_scores')
        .select('profile_id, game_id, score, max_score, solved_date')
        .in('profile_id', memberIds)
        .gte('solved_date', seasonData.start_date)
        .lte('solved_date', endDateLimitStr)
        .order('solved_date', { ascending: true });

      const scoresList = (scoresData || []) as DailyScore[];

      // Group scores by profile_id and solved_date for fast indexing
      const scoresMap = new Map<string, DailyScore[]>();
      scoresList.forEach(score => {
        const key = `${score.profile_id}_${score.solved_date}`;
        if (!scoresMap.has(key)) {
          scoresMap.set(key, []);
        }
        scoresMap.get(key)!.push(score);
      });

      // Win validator helper
      const isGameWon = (gameId: string, score: number, maxScore: number) => {
        if (gameId === 'word_grid') return score > 0;
        if (gameId === 'word_group') return score === maxScore;
        return score > 0;
      };

      // 7. Pre-calculate position points per user per date per game category
      const gameScoresByDateAndGame = new Map<string, DailyScore[]>();
      scoresList.forEach(score => {
        const categoryId = ['word_grid', 'wordle_es', 'la_palabra'].includes(score.game_id) ? 'word_grid' : score.game_id;
        const key = `${score.solved_date}_${categoryId}`;
        if (!gameScoresByDateAndGame.has(key)) {
          gameScoresByDateAndGame.set(key, []);
        }
        gameScoresByDateAndGame.get(key)!.push(score);
      });

      const pointsByProfileAndDateAndGame = new Map<string, number>();

      gameScoresByDateAndGame.forEach((scores, dateAndCategoryKey) => {
        const [date] = dateAndCategoryKey.split('_');

        // De-duplicate by profile_id to get unique players' best scores
        const userBestScoresMap: Record<string, DailyScore> = {};
        scores.forEach(s => {
          const existing = userBestScoresMap[s.profile_id];
          if (!existing || s.score > existing.score) {
            userBestScoresMap[s.profile_id] = s;
          }
        });

        const uniqueScores = Object.values(userBestScoresMap);
        const sortedScores = uniqueScores.sort((a, b) => b.score - a.score);
        const totalPlayers = sortedScores.length;

        sortedScores.forEach(scoreRow => {
          const profileId = scoreRow.profile_id;
          const key = `${profileId}_${date}_${scoreRow.game_id}`;
          
          let pts = 15; // 15 instantly for playing
          
          // Position points: 5 * (total - position + 1)
          const userScore = scoreRow.score;
          const higherCount = sortedScores.filter(s => s.score > userScore).length;
          const position = higherCount + 1;
          pts += 5 * (totalPlayers - position + 1);
          pointsByProfileAndDateAndGame.set(key, pts);
        });
      });

      // 8. Aggregate day-by-day points
      const statsList: MemberStats[] = members.map(m => {
        const pointsHistory: number[] = [];
        let totalPlayed = 0;
        let totalWon = 0;
        let cumulative = 0;

        dateRange.forEach(date => {
          const key = `${m.id}_${date}`;
          const dayScores = scoresMap.get(key) || [];

          let dayPoints = 0;
          dayScores.forEach(score => {
            const pointsKey = `${m.id}_${date}_${score.game_id}`;
            const pts = pointsByProfileAndDateAndGame.get(pointsKey) || 15;
            dayPoints += pts;

            totalPlayed += 1;
            if (isGameWon(score.game_id, score.score, score.max_score)) {
              totalWon += 1;
            }
          });

          cumulative += dayPoints;
          pointsHistory.push(cumulative);
        });

        return {
          profile_id: m.id,
          username: m.username,
          avatar_url: m.avatar_url,
          equipped_badge_id: m.equipped_badge_id || null,
          equipped_character_id: m.equipped_character_id || null,
          pointsHistory,
          totalPlayed,
          totalWon,
          finalPoints: cumulative,
          todayRank: 0,
          yesterdayRank: 0
        };
      });

      // Sort by final points to calculate today's rank
      statsList.sort((a, b) => b.finalPoints - a.finalPoints);
      statsList.forEach((stat, i) => {
        stat.todayRank = i + 1;
      });

      // Calculate yesterday's rank for trend indicators if there are at least 2 days
      if (dateRange.length >= 2) {
        const yesterdaySorted = [...statsList].sort((a, b) => {
          const ptsA = a.pointsHistory[a.pointsHistory.length - 2] || 0;
          const ptsB = b.pointsHistory[b.pointsHistory.length - 2] || 0;
          return ptsB - ptsA;
        });

        statsList.forEach(stat => {
          const prevIdx = yesterdaySorted.findIndex(s => s.profile_id === stat.profile_id);
          stat.yesterdayRank = prevIdx !== -1 ? prevIdx + 1 : stat.todayRank;
        });
      } else {
        // No yesterday data, keep same
        statsList.forEach(stat => {
          stat.yesterdayRank = stat.todayRank;
        });
      }

      setMemberStats(statsList);

      // Determine dynamic Y scaling (max points ceiling)
      const maxPtsOfAll = statsList.reduce((max, curr) => Math.max(max, curr.finalPoints), 0);
      const dynamicCeiling = Math.max(400, Math.ceil((maxPtsOfAll + 1) / 100) * 100);
      setMaxPointsScale(dynamicCeiling);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsData();
  }, [groupId]);

  // Days left calculation
  const getDaysLeft = () => {
    if (!season) return 0;
    const [endY, endM, endD] = season.end_date.split('-').map(Number);
    const end = new Date(endY, endM - 1, endD); // local midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();

  // Date span formatter (outputs e.g., "23. may - 12. jun")
  const formatDateSpan = (startDateStr: string, endDateStr: string, lng: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

    const formatSingle = (date: Date) => {
      const locale = lng === 'es' ? 'es-ES' : 'en-US';
      const formatted = date.toLocaleDateString(locale, options);
      if (lng === 'es') {
        const parts = formatted.split(' ');
        if (parts.length === 2) {
          const day = parts[0];
          const month = parts[1].toLowerCase().replace('.', '');
          return `${day}. ${month}`;
        }
      } else {
        const parts = formatted.split(' ');
        if (parts.length === 2) {
          const month = parts[0].toLowerCase().slice(0, 3);
          const day = parts[1];
          return `${day}. ${month}`;
        }
      }
      return formatted.toLowerCase();
    };

    return `${formatSingle(start)} - ${formatSingle(end)}`;
  };

  if (loading) {
    return (
      <div
        className="flex flex-col min-h-screen bg-slate-50 text-slate-800 pt-safe font-sans"
        style={{
          backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px'
        }}
      >
        <header className="px-6 py-4 flex items-center">
          <Link
            to={`/group/${groupId}`}
            onClick={() => triggerHapticClick()}
            className="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white text-slate-700 rounded-full transition-all active:scale-95 shadow-sm border border-slate-200/50"
            title={t('groupStats.backBtn')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center pb-24">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-500 font-bold text-sm mb-4">{t('groupStats.noActiveSeason')}</p>
        <button
          onClick={() => navigate(`/group/${groupId}`)}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          {t('groupStats.backBtn')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-slate-50 text-slate-800 pt-safe"
      style={{
        backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)',
        backgroundSize: '16px 16px'
      }}
    >
      {/* 1. TOP HEADER & NAVIGATION */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Back button */}
          <Link
            to={`/group/${groupId}`}
            onClick={() => triggerHapticClick()}
            className="w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white text-slate-700 rounded-full transition-all active:scale-95 shadow-sm border border-slate-200/50"
            title={t('groupStats.backBtn')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Icon indicator */}
          <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full shadow-sm">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
        <div className="w-10 h-10" /> {/* Spacer */}
      </header>

      {/* 2. SEASON INFO CARD */}
      <section className="flex flex-col items-center text-center px-6 py-2 space-y-1">
        <div className="flex items-center gap-4">
          <LaurelBranch />
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight uppercase">
              {t('groupStats.season', { num: seasonNumber })}
            </h2>
            <span className="text-xs font-bold text-slate-500 tracking-wider block">
              {daysLeft === 1 ? t('groupStats.daysLeftSingle') : t('groupStats.daysLeft', { count: daysLeft })}
            </span>
          </div>
          <div className="scale-x-[-1]">
            <LaurelBranch />
          </div>
        </div>

        {/* Date span badge */}
        <div className="bg-slate-700 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 select-none mt-2">
          🏆 {formatDateSpan(season.start_date, season.end_date, i18n.language)}
        </div>
      </section>

      {/* 3. CUMULATIVE POINTS LINE GRAPH */}
      <section className="px-6 py-6 w-full max-w-lg mx-auto aspect-[4/3] flex flex-col justify-end">
        {memberStats.length > 0 && dates.length > 0 ? (
          <div className="w-full h-full relative">
            <svg
              viewBox="0 0 500 300"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid Lines */}
              {/* Horizontal grid lines */}
              <line x1="40" y1="20" x2="440" y2="20" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="40" y1="145" x2="440" y2="145" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="40" y1="270" x2="440" y2="270" stroke="#CBD5E1" strokeWidth="2" />

              {/* Vertical grid lines (4 lines, dividing chart into 5 segments) */}
              {[0, 1, 2, 3, 4].map(idx => {
                const xVal = 40 + idx * 100;
                return (
                  <line
                    key={idx}
                    x1={xVal}
                    y1="20"
                    x2={xVal}
                    y2="270"
                    stroke="#E2E8F0"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* Y Axis Labels (right aligned) */}
              <text x="450" y="24" textAnchor="start" className="text-[10px] fill-slate-400 font-black tracking-tighter">
                {maxPointsScale}
              </text>
              <text x="450" y="149" textAnchor="start" className="text-[10px] fill-slate-400 font-black tracking-tighter">
                {maxPointsScale / 2}
              </text>
              <text x="450" y="274" textAnchor="start" className="text-[10px] fill-slate-400 font-black tracking-tighter">
                0
              </text>

              {/* Curves for each user */}
              {memberStats.map((member, idx) => {
                const color = USER_COLORS[idx % USER_COLORS.length];
                const points = member.pointsHistory;
                const dLen = dates.length;

                // Map points history to SVG coordinates
                const pathPoints = points.map((p, dIdx) => {
                  const x = 40 + (dLen > 1 ? (dIdx / (dLen - 1)) * 400 : 200);
                  const y = 270 - (p / maxPointsScale) * 250;
                  return { x, y };
                });

                // Generate path command string
                const dAttr = pathPoints
                  .map((pt, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                  .join(' ');

                // Final point coordinates for the circular dot
                const lastPt = pathPoints[pathPoints.length - 1];

                return (
                  <g key={member.profile_id}>
                    {/* Line path */}
                    <path
                      d={dAttr}
                      fill="none"
                      stroke={color.stroke}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Circular indicator at the current day's value */}
                    {lastPt && (
                      <circle
                        cx={lastPt.x}
                        cy={lastPt.y}
                        r="5"
                        fill={color.stroke}
                        stroke="#FFF"
                        strokeWidth="1.5"
                        className="filter drop-shadow-sm"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">
            {t('groupStats.noData')}
          </div>
        )}
      </section>

      {/* 4. LEADERBOARD / STANDINGS LIST (Premium Light Bottom Panel) */}
      <section className="bg-white/95 border-t border-slate-200/60 rounded-t-[40px] px-6 py-6 pb-28 flex-1 flex flex-col gap-4 shadow-xl">
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2" />

        <div className="max-w-md w-full mx-auto space-y-3.5">
          {memberStats.map((member, i) => {
            const isMe = member.profile_id === profile?.id;
            const color = USER_COLORS[i % USER_COLORS.length];

            // Rank trend indicator
            let trendElement = null;
            if (dates.length >= 2) {
              if (member.todayRank < member.yesterdayRank) {
                trendElement = <span className="text-emerald-400 text-[10px] font-black flex items-center">⬆️</span>;
              } else if (member.todayRank > member.yesterdayRank) {
                trendElement = <span className="text-red-400 text-[10px] font-black flex items-center">⬇️</span>;
              }
            }

            return (
              <div
                key={member.profile_id}
                className={`bg-white border-2 ${color.border} rounded-[24px] p-4 flex items-center gap-4 transition-all shadow-sm`}
              >
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <AvatarViewer
                    characterKey={cosmetics.find(c => c.id === member.equipped_character_id)?.asset_key || 'char_base'}
                    badgeKey={cosmetics.find(c => c.id === member.equipped_badge_id)?.asset_key || ''}
                    size="md"
                  />
                </div>

                {/* Card Main Info */}
                <div className="flex-1 min-w-0">
                  {/* Top metadata line: Rank + Trend + You Badge */}
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      #{member.todayRank}
                    </span>
                    {trendElement}
                    {isMe && (
                      <span className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {t('dashboard.you').replace(/[()]/g, '')}
                      </span>
                    )}
                  </div>

                  {/* Username line */}
                  <h4 className="text-sm font-extrabold text-slate-900 truncate leading-tight mt-1">
                    {member.username}
                  </h4>

                  {/* Solved/Won stats line */}
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-1">
                    {t('groupStats.gamesWon', { won: member.totalWon, total: member.totalPlayed })}
                  </p>
                </div>

                {/* Gems/Points Badge */}
                <GreenGemBadge points={member.finalPoints} />
              </div>
            );
          })}

          {memberStats.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">{t('dashboard.noScoresSubmitted')}</p>
          )}
        </div>
      </section>

      {/* Mandatory legal disclaimer at Settings/Dashboard/Login level */}
      <DisclaimerFooter />
    </div>
  );
};
