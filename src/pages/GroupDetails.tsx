import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { 
  triggerHapticClick, 
  triggerHapticError
} from '../utils/haptics';
import { 
  ArrowLeft, 
  History, 
  Settings as SettingsIcon, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  Users,
  X
} from 'lucide-react';
import coinX3 from '../assets/coin_x3.svg';

interface GroupDetails {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  image_url?: string;
}

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
}

interface DailyScore {
  id: string;
  profile_id: string;
  game_id: string;
  score: number;
  max_score: number;
  raw_text: string;
  solved_date: string;
  profiles: ProfileSummary;
}

interface ChatMessage {
  id: string;
  group_id: string;
  profile_id: string | null;
  message_type: 'user' | 'system';
  content: string;
  created_at: string;
  profiles?: ProfileSummary | null;
}

export const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Core data states
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [members, setMembers] = useState<ProfileSummary[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [activeGameIds, setActiveGameIds] = useState<string[]>([]);
  const [todayScores, setTodayScores] = useState<DailyScore[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // UI inputs/modal states
  const [newMessage, setNewMessage] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showPlayedModal, setShowPlayedModal] = useState<{ gameId: string; gameName: string } | null>(null);
  const [archiveSeasons, setArchiveSeasons] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ticking state for per-game countdown clocks
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute countdown string for a game's daily reset time (UTC)
  const getCountdownTo = (resetTimeStr: string) => {
    void tick; // depend on tick so this re-evaluates every second
    if (!resetTimeStr) return '00:00:00';
    const now = new Date();
    const parts = resetTimeStr.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    const resetToday = new Date();
    resetToday.setUTCHours(h, m, s, 0);
    let diffMs = resetToday.getTime() - now.getTime();
    if (diffMs <= 0) {
      resetToday.setUTCDate(resetToday.getUTCDate() + 1);
      diffMs = resetToday.getTime() - now.getTime();
    }
    const hours = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, '0');
    const mins = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const secs = String(Math.floor((diffMs % (1000 * 60)) / 1000)).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  };

  // Fetch core league information
  const loadLeagueData = async () => {
    if (!groupId) return;
    try {
      // 1. Group info
      const { data: groupData, error: groupErr } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      
      if (groupErr || !groupData) {
        navigate('/');
        return;
      }
      setGroup(groupData);

      // 2. Active Season
      const { data: seasonData } = await supabase
        .from('seasons')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .maybeSingle();
      
      setSeason(seasonData || null);

      // 3. Members
      const { data: membersData } = await supabase
        .from('group_members')
        .select('profile_id, profiles(id, username, avatar_url)')
        .eq('group_id', groupId);
      
      if (membersData) {
        setMembers(membersData.map((m: any) => m.profiles).filter(Boolean));
      }

      // 4. All Games
      const { data: gamesData } = await supabase
        .from('games')
        .select('*');
      if (gamesData) setAllGames(gamesData);

      // 5. Active games in group
      const { data: activeGamesData } = await supabase
        .from('group_games')
        .select('game_id')
        .eq('group_id', groupId);
      if (activeGamesData) {
        setActiveGameIds(activeGamesData.map(ag => ag.game_id));
      }

      // 6. Today's scores for this group members
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: scoresData } = await supabase
        .from('daily_scores')
        .select('id, profile_id, game_id, score, max_score, raw_text, solved_date, profiles(id, username, avatar_url)')
        .eq('solved_date', todayStr);
      
      if (scoresData) {
        setTodayScores(scoresData as any);
      }

      // 7. Chat messages
      const { data: chatData } = await supabase
        .from('group_messages')
        .select('id, group_id, profile_id, message_type, content, created_at, profiles(id, username, avatar_url)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (chatData) {
        setChatMessages(chatData as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeagueData();

    // Subscribe to real-time chat messages
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'group_messages', 
        filter: `group_id=eq.${groupId}` 
      }, async (payload) => {
        // Fetch profile info for the new message
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', payload.new.profile_id)
          .maybeSingle();

        const fullMessage: ChatMessage = {
          ...(payload.new as any),
          profiles: profileData
        };
        
        setChatMessages(prev => [...prev, fullMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  // Days left calculation
  const getDaysLeft = () => {
    if (!season) return 0;
    // Parse end_date as LOCAL midnight to avoid UTC timezone offset issues.
    // new Date("YYYY-MM-DD") is interpreted as UTC midnight, which in UTC+2
    // would make today already "past" the end date, returning 0 days.
    const [endY, endM, endD] = season.end_date.split('-').map(Number);
    const end = new Date(endY, endM - 1, endD); // local midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();

  // Total gems gained in this season by the logged-in user
  const getUserGemsThisSeason = () => {
    if (!season || !profile) return 0;
    // We can count points from daily scores of this user solved between season start_date and end_date
    const userScores = todayScores.filter(s => s.profile_id === profile.id);
    // As a simplification we can fetch or use profiles.lifetime_points or compute points.
    // Let's search group_season_points for this group/season
    return userScores.reduce((acc, curr) => {
      const base = 10;
      const bonus = curr.max_score > 0 ? Math.floor((curr.score / curr.max_score) * 10) : 0;
      return acc + base + bonus;
    }, 0);
  };

  // Profile characters/avatars of users who participated in TODAY'S games
  const getTodayParticipants = () => {
    const participantIds = Array.from(new Set(todayScores.map(s => s.profile_id)));
    return members.filter(m => participantIds.includes(m.id));
  };

  const todayParticipants = getTodayParticipants();

  // Dynamic Standing for logged-in user in this group
  const getUserTodayStanding = () => {
    if (!profile) return 0;
    // Calculate global daily scores summation
    const totals = members.map(m => {
      const mScores = todayScores.filter(s => s.profile_id === m.id);
      const sum = mScores.reduce((acc, curr) => acc + curr.score, 0);
      return { profile_id: m.id, total: sum };
    });
    totals.sort((a, b) => b.total - a.total);
    const index = totals.findIndex(t => t.profile_id === profile.id);
    return index !== -1 ? index + 1 : totals.length;
  };

  const userStanding = getUserTodayStanding();

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile) return;
    
    await triggerHapticClick();
    
    const messageContent = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        profile_id: profile.id,
        message_type: 'user',
        content: messageContent
      });

    if (error) {
      await triggerHapticError();
      console.error(error);
    }
  };

  // Add or remove game settings
  const handleToggleGame = async (gameId: string) => {
    await triggerHapticClick();
    if (activeGameIds.includes(gameId)) {
      // Remove game
      const { error } = await supabase
        .from('group_games')
        .delete()
        .eq('group_id', groupId)
        .eq('game_id', gameId);
      
      if (!error) {
        setActiveGameIds(prev => prev.filter(id => id !== gameId));
      }
    } else {
      // Add game
      const { error } = await supabase
        .from('group_games')
        .insert({
          group_id: groupId,
          game_id: gameId
        });
      
      if (!error) {
        setActiveGameIds(prev => [...prev, gameId]);
      }
    }
  };

  // Archive standings logic (load previous seasons)
  const openArchive = async () => {
    await triggerHapticClick();
    setShowArchiveModal(true);
    
    // Load historical seasons
    const { data } = await supabase
      .from('seasons')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', false)
      .order('end_date', { ascending: false });
    
    if (data) setArchiveSeasons(data);
  };

  // ----------------------------------------------------
  // Points calculation helper (Formula: Ending up last = 5 coins, ties lower points)
  // ----------------------------------------------------
  const calculateCoinsForGame = (gameId: string) => {
    // 1. Get scores for this specific game
    const gameScores = todayScores
      .filter(s => s.game_id === gameId)
      .map(s => ({
        profile_id: s.profile_id,
        username: s.profiles.username,
        avatar_url: s.profiles.avatar_url,
        score: s.score
      }));

    if (gameScores.length === 0) return [];

    // 2. Sort scores ascending (lowest score is index 0)
    gameScores.sort((a, b) => a.score - b.score);

    // 3. Extract unique scores sorted ascending
    const uniqueScores = Array.from(new Set(gameScores.map(gs => gs.score))).sort((a, b) => a - b);

    // 4. Map each score to its coin allocation based on its rank among unique scores
    return gameScores.map(gs => {
      const uniqueIndex = uniqueScores.indexOf(gs.score);
      const coinsGained = (uniqueIndex + 1) * 5;
      return {
        ...gs,
        coins: coinsGained
      };
    }).sort((a, b) => b.score - a.score); // return sorted descending for presentation
  };

  // Global Standings combined for today (combining all active minigames)
  const getGlobalTodayStandings = () => {
    // For each active game, calculate coins
    const coinsAccumulator: Record<string, { username: string; avatar_url: string | null; coins: number }> = {};
    
    // Initialize all members
    members.forEach(m => {
      coinsAccumulator[m.id] = {
        username: m.username,
        avatar_url: m.avatar_url,
        coins: 0
      };
    });

    activeGameIds.forEach(gameId => {
      const results = calculateCoinsForGame(gameId);
      results.forEach(res => {
        if (coinsAccumulator[res.profile_id]) {
          coinsAccumulator[res.profile_id].coins += res.coins;
        }
      });
    });

    return Object.entries(coinsAccumulator)
      .map(([profile_id, data]) => ({
        profile_id,
        ...data
      }))
      .sort((a, b) => b.coins - a.coins);
  };

  const globalTodayStandings = getGlobalTodayStandings();
  const bestPlayer = globalTodayStandings[0];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-violet-100 via-indigo-50 to-emerald-50 text-slate-800 pt-[safe] font-sans">
      
      {/* 1. TOP HEADER SECTION — sticky with fade-to-transparent gradient below */}
      <header className="sticky top-0 z-20 pointer-events-none">
        {/* Gradient fade that masks content scrolling under the nav */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/95 via-violet-100/80 to-transparent backdrop-blur-[2px]" />
        
        <div className="relative pointer-events-auto flex items-center justify-between px-6 py-4">
          {/* Left top: redirect to main view */}
          <Link 
            to="/" 
            onClick={() => triggerHapticClick()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-full transition-all active:scale-95"
            title={t('groupDetails.backBtn')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Middle part: standing, gems, today participants */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="flex items-center gap-2 bg-white/60 border border-white/50 px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                🏆 #{userStanding}
              </span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <img src={coinX3} alt="Gems" className="w-5 h-5 object-contain" />
                {getUserGemsThisSeason()} {t('groupDetails.seasonGems')}
              </span>
            </div>
            
            {/* Overlapping avatars of users participating today */}
            <div className="flex -space-x-2.5 pt-0.5">
              {todayParticipants.slice(0, 5).map((part, idx) => (
                <div 
                  key={part.id} 
                  className="w-6 h-6 rounded-full border border-white bg-slate-200 overflow-hidden shadow-sm flex items-center justify-center"
                  style={{ zIndex: 10 - idx }}
                  title={part.username}
                >
                  <img 
                    src={part.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${part.username}`} 
                    alt={part.username} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {todayParticipants.length > 5 && (
                <div className="w-6 h-6 rounded-full border border-white bg-slate-850 text-white font-bold text-[8px] flex items-center justify-center shadow-sm z-0">
                  +{todayParticipants.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Top right part: Archive & Settings */}
          <div className="flex items-center gap-1">
            <button
              onClick={openArchive}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-full transition-all active:scale-95"
              title={t('groupDetails.archiveBtn')}
            >
              <History className="w-5 h-5" />
            </button>
            
            <button
              onClick={async () => {
                await triggerHapticClick();
                navigate(`/group/${groupId}/manage-games`);
              }}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-full transition-all active:scale-95"
              title={t('groupDetails.settingsBtn')}
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Extra fade tail — extends below the header buttons */}
        <div className="h-6 bg-gradient-to-b from-violet-100/30 to-transparent" />
      </header>

      {/* 2. BODY CONTENT — extra bottom padding so fixed chat bar doesn't cover content */}
      <main className="flex-1 max-w-md w-full mx-auto px-5 pt-2 pb-32 space-y-6">

        {/* Header Details */}
        <div className="text-center space-y-1">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            {daysLeft === 1 ? t('groupDetails.daysLeftSingle') : t('groupDetails.daysLeft', { count: daysLeft })}
          </span>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight uppercase">
            HOY
          </h2>
          <div className="h-1 w-12 bg-slate-800 mx-auto rounded-full mt-2" />
        </div>

        {/* 3. GAMES GRID */}
        <section className="space-y-3">
          {/* Icon-only add button pinned top-right */}
          <div className="flex justify-end">
            <button 
              onClick={async () => {
                await triggerHapticClick();
                navigate(`/group/${groupId}/manage-games`);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/60 border border-slate-200/60 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm active:scale-90 transition-all"
              title={t('groupDetails.addGame')}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-200/50">
            {allGames.filter(g => activeGameIds.includes(g.id)).map(game => {
              const gameResultCoins = calculateCoinsForGame(game.id);
              const playedTodayCount = gameResultCoins.length;
              const hasPlayed = todayScores.some(s => s.game_id === game.id && s.profile_id === profile?.id);
              const userScoreObj = todayScores.find(s => s.game_id === game.id && s.profile_id === profile?.id);

              return (
                <div 
                  key={game.id}
                  className="py-4 space-y-3.5 relative transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">
                        {game.id === 'word_grid' ? 'Daily Word Grid' : game.id === 'chess_grid' ? "Queen's Grid" : 'Group Categorization'}
                      </span>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                        {game.display_name}
                      </h4>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getCountdownTo(game.reset_time_utc)}
                      </span>
                      {hasPlayed && userScoreObj && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {userScoreObj.score} Pts
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button 
                      onClick={async () => {
                        await triggerHapticClick();
                        setShowPlayedModal({ gameId: game.id, gameName: game.display_name });
                      }}
                      className="text-xs text-slate-500 font-black hover:text-indigo-650 active:scale-95 transition-transform flex items-center gap-1 hover:bg-white/40 px-2.5 py-1 rounded-full"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {t('groupDetails.playedStats', { played: playedTodayCount, total: members.length })}
                    </button>

                    <span className="text-[10px] text-slate-400 italic">
                      {hasPlayed ? 'Completed ✓' : 'Not completed yet'}
                    </span>
                  </div>
                </div>
              );
            })}

            {activeGameIds.length === 0 && (
              <div className="text-center py-10 bg-white/40 backdrop-blur-md rounded-[24px] border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center space-y-2 mt-2">
                <span className="text-2xl">🎮</span>
                <p className="text-xs text-slate-500 font-bold">No active games in this league</p>
                <button
                  onClick={() => navigate(`/group/${groupId}/manage-games`)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl transition-all shadow-sm"
                >
                  Manage Games
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 4. TODAY'S PODIUM — compact centered trophy layout, no label */}
        {globalTodayStandings.length > 0 && bestPlayer && bestPlayer.coins > 0 && (
          <section className="pt-2 pb-4">
            {/* Trophy podium: 2nd | 1st | 3rd centered, different heights */}
            <div className="flex justify-center items-end gap-4">

              {/* 2nd place */}
              {globalTodayStandings[1] && globalTodayStandings[1].coins > 0 ? (
                <div className="flex flex-col items-center gap-1 mb-1">
                  <div className="w-11 h-11 rounded-full border-2 border-slate-300 bg-slate-100 overflow-hidden shadow">
                    <img src={globalTodayStandings[1].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${globalTodayStandings[1].username}`} alt={globalTodayStandings[1].username} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] font-black text-slate-600 truncate max-w-[56px] text-center">{globalTodayStandings[1].username}</span>
                  <div className="w-14 h-8 bg-slate-200/70 rounded-t-lg flex items-center justify-center">
                    <span className="text-xs font-black text-slate-500">🥈</span>
                  </div>
                </div>
              ) : <div className="w-14" />}

              {/* 1st place */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl select-none animate-bounce">👑</span>
                <div className="w-14 h-14 rounded-full border-[3px] border-amber-400 bg-slate-100 overflow-hidden shadow-lg">
                  <img src={bestPlayer.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${bestPlayer.username}`} alt={bestPlayer.username} className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-black text-slate-800 truncate max-w-[64px] text-center">{bestPlayer.username}</span>
                <div className="w-14 h-12 bg-amber-300/60 rounded-t-lg flex items-center justify-center">
                  <span className="text-sm font-black text-amber-700">🥇</span>
                </div>
              </div>

              {/* 3rd place */}
              {globalTodayStandings[2] && globalTodayStandings[2].coins > 0 ? (
                <div className="flex flex-col items-center gap-1 mb-2">
                  <div className="w-10 h-10 rounded-full border-2 border-orange-300/60 bg-slate-100 overflow-hidden shadow">
                    <img src={globalTodayStandings[2].avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${globalTodayStandings[2].username}`} alt={globalTodayStandings[2].username} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9px] font-black text-slate-600 truncate max-w-[56px] text-center">{globalTodayStandings[2].username}</span>
                  <div className="w-14 h-6 bg-orange-200/60 rounded-t-lg flex items-center justify-center">
                    <span className="text-xs font-black text-orange-600">🥉</span>
                  </div>
                </div>
              ) : <div className="w-14" />}

            </div>
          </section>
        )}

        {/* 5. COMPACT LEADERBOARD — no label, centered rows with medal */}
        <section className="space-y-1">
          {globalTodayStandings.map((userSt, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
            const isMe = userSt.profile_id === profile?.id;
            return (
              <div
                key={userSt.profile_id}
                className={`flex items-center gap-3 px-3 py-2 rounded-2xl transition-colors ${
                  isMe ? 'bg-indigo-50/60' : 'hover:bg-white/30'
                }`}
              >
                {/* Rank */}
                <span className="w-6 text-center flex-shrink-0">
                  {medal
                    ? <span className="text-base leading-none">{medal}</span>
                    : <span className="text-[10px] font-black text-slate-400">#{i + 1}</span>
                  }
                </span>
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden border border-white shadow-sm flex-shrink-0">
                  <img
                    src={userSt.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userSt.username}`}
                    alt={userSt.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Name */}
                <span className={`flex-1 text-xs font-bold truncate ${
                  isMe ? 'text-indigo-700' : 'text-slate-800'
                }`}>
                  {userSt.username}{isMe && <span className="text-indigo-400 font-black"> · {t('dashboard.you')}</span>}
                </span>
                {/* Points */}
                <span className="text-[11px] font-black text-slate-500">{userSt.coins} pts</span>
              </div>
            );
          })}

          {globalTodayStandings.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-4">{t('dashboard.noScoresSubmitted')}</p>
          )}
        </section>

        {/* 6. DAILY GLOBAL LEAGUE CHAT — seamless, no label */}
        <section className="space-y-0 pt-2">

          {/* Messages — flow naturally in the page scroll */}
          <div className="space-y-3">
            {chatMessages.map((msg) => {
              const isSelf = msg.profile_id === profile?.id;
              
              if (msg.message_type === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center text-center">
                    <span className="text-[10px] bg-white/60 text-slate-650 font-bold px-3 py-1.5 rounded-full border border-slate-200/50 max-w-[90%]">
                      <span className="text-slate-700 font-extrabold">{msg.profiles?.username || 'User'}</span>{' '}{msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-slate-150 border overflow-hidden flex-shrink-0 shadow-sm mt-4">
                    <img 
                      src={msg.profiles?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.profiles?.username || 'user'}`} 
                      alt={msg.profiles?.username || 'Avatar'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="space-y-0.5">
                    {!isSelf && (
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block ml-1">
                        {msg.profiles?.username || 'User'}
                      </span>
                    )}
                    <div className={`p-3 rounded-2xl text-xs font-semibold shadow-sm border ${
                      isSelf 
                        ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none' 
                        : 'bg-white/70 text-slate-800 border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {chatMessages.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">
                {t('groupDetails.chatEmpty', 'No messages yet. Say hi! 👋')}
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>
        </section>

      </main>

      {/* Fixed floating chat input — pill input + separated pill send button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        {/* Fade scrim above input */}
        <div className="h-10 bg-gradient-to-t from-emerald-50/70 to-transparent" />
        <div className="pb-[env(safe-area-inset-bottom)] px-4 pb-4 pointer-events-auto">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 max-w-md mx-auto mb-3"
          >
            <input 
              type="text" 
              placeholder={t('groupDetails.chatPlaceholder')}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-5 py-3 bg-white/90 backdrop-blur-md border border-white/70 rounded-full text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all shadow-lg"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="w-11 h-11 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-35 text-white rounded-full transition-all shadow-lg active:scale-90 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>


      {/* 8. ARCHIVE MODAL */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-[32px] max-w-sm w-full p-6 space-y-5 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowArchiveModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 flex items-center justify-center gap-1.5 uppercase tracking-tight">
                <History className="w-5 h-5 text-indigo-650" /> {t('groupDetails.archiveModalTitle')}
              </h3>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {archiveSeasons.map((histSeason) => (
                <div 
                  key={histSeason.id} 
                  className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1"
                >
                  <div className="flex justify-between items-center font-black">
                    <span>Season: {new Date(histSeason.start_date).toLocaleDateString()}</span>
                    <span className="text-[10px] text-slate-400">Ended</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {histSeason.start_date} to {histSeason.end_date}
                  </p>
                </div>
              ))}

              {archiveSeasons.length === 0 && (
                <div className="text-center py-8 text-slate-400 font-medium text-xs">
                  {t('groupDetails.noArchiveData')}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowArchiveModal(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl transition-all text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 9. PLAYED MODAL (Who completed minigame today) */}
      {showPlayedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-[32px] max-w-sm w-full p-6 space-y-5 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowPlayedModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h3 className="text-md font-black text-slate-900 flex flex-col items-center justify-center gap-1 uppercase tracking-tight">
                <span className="text-[10px] text-slate-400 font-black tracking-widest block uppercase">{t('groupDetails.playedModalTitle')}</span>
                <span className="text-indigo-650 block mt-1">{showPlayedModal.gameName}</span>
              </h3>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {calculateCoinsForGame(showPlayedModal.gameId).map((playedUser) => (
                <div 
                  key={playedUser.profile_id} 
                  className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border">
                    <img 
                      src={playedUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${playedUser.username}`} 
                      alt={playedUser.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-black text-slate-800 block">{playedUser.username}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Score: {playedUser.score}</span>
                  </div>
                  <span className="text-emerald-600 font-black text-xs">+{playedUser.coins} coins</span>
                </div>
              ))}

              {calculateCoinsForGame(showPlayedModal.gameId).length === 0 && (
                <div className="text-center py-8 text-slate-400 font-medium text-xs">
                  {t('groupDetails.noPlayersCompleted')}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPlayedModal(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl transition-all text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer disclaimer hidden on this screen per design — shown on Login/Dashboard/Settings */}

    </div>
  );
};
