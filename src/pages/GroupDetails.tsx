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
  Send,
  Clock,
  CheckCircle2,
  Users,
  X,
  BarChart2,
  Menu
} from 'lucide-react';
import coinX3 from '../assets/coin_x3.svg';
import { Browser } from '@capacitor/browser';
import { AvatarViewer } from '../components/AvatarViewer';
import { GameCardView } from '../components/GameCardView';

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
  equipped_character_id?: string | null;
  equipped_badge_id?: string | null;
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

const GAME_PLAY_URLS: Record<string, string> = {
  word_grid: 'https://www.nytimes.com/games/wordle',
  chess_grid: 'https://www.linkedin.com/games/queens/',
  word_group: 'https://www.nytimes.com/games/connections',
  crossword: 'https://www.nytimes.com/crosswords',
  mini: 'https://www.nytimes.com/crosswords/game/mini',
  spelling_bee: 'https://www.nytimes.com/puzzles/spelling-bee',
  strands: 'https://www.nytimes.com/games/strands',
  linkedin_ques: 'https://www.linkedin.com/games/queens/',
  pinpoint: 'https://www.linkedin.com/games/pinpoint/',
  tango: 'https://www.linkedin.com/games/tango/',
  zip: 'https://www.linkedin.com/games/zip/',
  la_palabra: 'https://lapalabradeldia.com/',
  wordle_es: 'https://lapalabradeldia.com/',
};

const getGameCategoryTag = (gameId: string) => {
  if (gameId === 'wordle_es' || gameId === 'la_palabra') return 'ESPAÑOL';
  if (gameId === 'word_grid') return 'ENGLISH';
  if (gameId === 'chess_grid' || gameId === 'linkedin_ques') return 'CHESS';
  if (gameId === 'word_group') return 'GROUPS';
  if (gameId === 'crossword' || gameId === 'mini') return 'CROSSWORD';
  if (gameId === 'spelling_bee') return 'LETTERS';
  if (gameId === 'strands') return 'STRANDS';
  if (gameId === 'pinpoint') return 'ASSOCIATION';
  if (gameId === 'tango' || gameId === 'zip') return 'LOGIC';
  return 'DAILY';
};

const renderGamePreviewIcon = (gameId: string, randomGrid?: string[][]) => {
  if (gameId === 'word_grid' || gameId === 'wordle_es' || gameId === 'la_palabra') {
    const grid = randomGrid || [
      ['bg-slate-200', 'bg-slate-200', 'bg-slate-200', 'bg-emerald-500', 'bg-amber-400'],
      ['bg-slate-200', 'bg-slate-200', 'bg-slate-200', 'bg-slate-200', 'bg-slate-200'],
      ['bg-slate-200', 'bg-emerald-500', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-500'],
      ['bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500', 'bg-emerald-500']
    ];
    return (
      <div className="grid grid-cols-5 gap-1.5 w-24 h-20 justify-center items-center flex-shrink-0">
        {grid.map((row, rIdx) =>
          row.map((color, cIdx) => (
            <div key={`${rIdx}-${cIdx}`} className={`w-3.5 h-3.5 rounded-[3px] ${color}`}></div>
          ))
        )}
      </div>
    );
  }
  if (gameId === 'chess_grid') {
    return (
      <div className="grid grid-cols-4 gap-1.5 w-24 h-20 justify-center items-center flex-shrink-0">
        <div className="w-4 h-4 bg-purple-200 rounded-[3px]"></div>
        <div className="w-4 h-4 bg-slate-100 rounded-[3px]"></div>
        <div className="w-4 h-4 bg-purple-200 rounded-[3px]"></div>
        <div className="w-4 h-4 bg-slate-100 rounded-[3px]"></div>
        
        <div className="w-4 h-4 bg-slate-100 rounded-[3px]"></div>
        <div className="w-4 h-4 bg-purple-200 rounded-[3px] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-purple-800">
            <path d="M2 18h20v2H2zm2-2h16l-2-7-3 4-3-8-3 8-3-4z" />
          </svg>
        </div>
        <div className="w-4 h-4 bg-slate-100 rounded-[3px]"></div>
        <div className="w-4 h-4 bg-purple-200 rounded-[3px]"></div>
        
        <div className="w-4 h-4 bg-purple-200 rounded-[3px]"></div>
        <div className="w-4 h-4 bg-slate-100 rounded-[3px]"></div>
        <div className="w-4 h-4 bg-purple-200 rounded-[3px]"></div>
        <div className="w-4 h-4 bg-slate-100 rounded-[3px]"></div>
      </div>
    );
  }
  if (gameId === 'word_group') {
    return (
      <div className="flex flex-col gap-1.5 w-24 h-20 justify-center flex-shrink-0">
        <div className="h-3 bg-amber-100 border border-amber-200 rounded-[3px]"></div>
        <div className="h-3 bg-emerald-100 border border-emerald-200 rounded-[3px]"></div>
        <div className="h-3 bg-sky-100 border border-sky-200 rounded-[3px]"></div>
        <div className="h-3 bg-purple-100 border border-purple-200 rounded-[3px]"></div>
      </div>
    );
  }
  return null;
};

const generateRandomWordleGrid = () => {
  const grid: string[][] = [];
  
  // Generate first 3 rows randomly
  for (let r = 0; r < 3; r++) {
    const row: string[] = [];
    for (let c = 0; c < 5; c++) {
      const rand = Math.random();
      if (rand < 0.6) {
        row.push('bg-slate-200');
      } else if (rand < 0.85) {
        row.push('bg-amber-400');
      } else {
        row.push('bg-emerald-500');
      }
    }
    grid.push(row);
  }
  
  // Last row is always all green
  grid.push(Array(5).fill('bg-emerald-500'));
  
  return grid;
};

export const GroupDetails = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Memoized random grids for wordle-type games to prevent re-randomizing on every render
  const randomGrids = React.useMemo<Record<string, string[][]>>(() => {
    return {
      word_grid: generateRandomWordleGrid(),
      wordle_es: generateRandomWordleGrid(),
      la_palabra: generateRandomWordleGrid(),
    };
  }, []);

  const handlePlayGame = async (gameId: string) => {
    await triggerHapticClick();
    const url = GAME_PLAY_URLS[gameId] || 'https://www.nytimes.com/crosswords';
    await Browser.open({ url });
  };

  // Core data states
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [members, setMembers] = useState<ProfileSummary[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [activeGameIds, setActiveGameIds] = useState<string[]>([]);
  const [todayScores, setTodayScores] = useState<DailyScore[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [cosmetics, setCosmetics] = useState<any[]>([]);

  // UI inputs/modal states
  const [newMessage, setNewMessage] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showPlayedModal, setShowPlayedModal] = useState<{ gameId: string; gameName: string } | null>(null);
  const [archiveSeasons, setArchiveSeasons] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const updateLastRead = async () => {
    if (!user || !groupId) return;
    try {
      await supabase
        .from('group_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('profile_id', user.id);
    } catch (e) {
      console.error('Failed to update last_read_at:', e);
    }
  };

  // Update last read when entering group or group changes
  useEffect(() => {
    if (user && groupId) {
      updateLastRead();
    }
  }, [user, groupId]);

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
          console.error("Failed to automatically create season in GroupDetails:", insertErr);
        }
      }

      setSeason(seasonData || null);

      // 3. Members
      const { data: membersData } = await supabase
        .from('group_members')
        .select('profile_id, profiles(id, username, avatar_url, equipped_character_id, equipped_badge_id)')
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
      const memberIds = membersData?.map((m: any) => m.profile_id) || [];
      const { data: scoresData } = await supabase
        .from('daily_scores')
        .select('id, profile_id, game_id, score, max_score, raw_text, solved_date, profiles(id, username, avatar_url, equipped_character_id, equipped_badge_id)')
        .eq('solved_date', todayStr)
        .in('profile_id', memberIds);

      if (scoresData) {
        setTodayScores(scoresData as any);
      }

      // 7. Chat messages (only from the current UTC day)
      const startOfToday = `${todayStr}T00:00:00.000Z`;
      const endOfToday = `${todayStr}T23:59:59.999Z`;

      const { data: chatData } = await supabase
        .from('group_messages')
        .select('id, group_id, profile_id, message_type, content, created_at, profiles(id, username, avatar_url, equipped_character_id, equipped_badge_id)')
        .eq('group_id', groupId)
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday)
        .order('created_at', { ascending: true })
        .limit(100);

      if (chatData) {
        setChatMessages(chatData as any);
      }

      // 8. Cosmetics
      const { data: cosmeticsData } = await supabase.from('cosmetics').select('*');
      if (cosmeticsData) setCosmetics(cosmeticsData);
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
        // Only append the message if it was sent on the current UTC day
        const msgDateStr = payload.new.created_at
          ? new Date(payload.new.created_at).toISOString().split('T')[0]
          : '';
        const currentTodayStr = new Date().toISOString().split('T')[0];

        if (msgDateStr === currentTodayStr) {
          // Fetch profile info for the new message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, equipped_character_id, equipped_badge_id')
            .eq('id', payload.new.profile_id)
            .maybeSingle();

          const fullMessage: ChatMessage = {
            ...(payload.new as any),
            profiles: profileData
          };

          setChatMessages(prev => [...prev, fullMessage]);
          updateLastRead();
        }
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
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-violet-100 via-indigo-50 to-emerald-50 text-slate-800 pt-safe font-sans">
        <header className="flex items-center px-6 py-4" style={{ minHeight: '72px' }}>
          <Link
            to="/"
            onClick={() => triggerHapticClick()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-full transition-all active:scale-95"
            title={t('groupDetails.backBtn')}
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
    // Today they get exactly 15 gems/points per played minigame instantly
    const userScores = todayScores.filter(s => s.profile_id === profile.id);
    return userScores.length * 15;
  };

  // Helper: resolve cosmetic asset_key from a cosmetic UUID
  const getCosmeticKey = (cosmeticId: string | null | undefined): string => {
    if (!cosmeticId) return '';
    return cosmetics.find(c => c.id === cosmeticId)?.asset_key || '';
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
    } else {
      updateLastRead();
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
    const isSameGameCategory = (scoreGameId: string, targetGameId: string) => {
      if (scoreGameId === targetGameId) return true;
      const wordleIds = ['word_grid', 'wordle_es', 'la_palabra'];
      if (wordleIds.includes(scoreGameId) && wordleIds.includes(targetGameId)) return true;
      return false;
    };

    // 1. Get scores for this specific game category
    const gameScores = todayScores
      .filter(s => isSameGameCategory(s.game_id, gameId))
      .map(s => ({
        profile_id: s.profile_id,
        username: s.profiles.username,
        avatar_url: s.profiles.avatar_url,
        equipped_character_id: (s.profiles as any).equipped_character_id ?? null,
        equipped_badge_id: (s.profiles as any).equipped_badge_id ?? null,
        score: s.score,
        solved_date: s.solved_date
      }));

    if (gameScores.length === 0) return [];

    // Sort unique scores descending by score (higher score is better)
    const sortedScores = [...gameScores].sort((a, b) => b.score - a.score);

    // 4. Map each score to its coin allocation based on its rank
    return gameScores.map(gs => {
      let coinsGained = 15; // 15 instantly for playing
      
      // Position points: 5 * (total - position + 1)
      const userScore = gs.score;
      const higherCount = sortedScores.filter(s => s.score > userScore).length;
      const position = higherCount + 1;
      coinsGained += 5 * (sortedScores.length - position + 1);

      return {
        ...gs,
        coins: coinsGained
      };
    }).sort((a, b) => b.score - a.score); // return sorted descending for presentation
  };

  // Global Standings combined for today (combining all active minigames)
  const getGlobalTodayStandings = () => {
    // For each active game, calculate coins
    const coinsAccumulator: Record<string, { username: string; avatar_url: string | null; equipped_character_id?: string | null; equipped_badge_id?: string | null; coins: number }> = {};

    // Initialize all members
    members.forEach(m => {
      coinsAccumulator[m.id] = {
        username: m.username,
        avatar_url: m.avatar_url,
        equipped_character_id: m.equipped_character_id,
        equipped_badge_id: m.equipped_badge_id,
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

  const getPlayerRank = (index: number) => {
    if (index >= globalTodayStandings.length) return 0;
    const playerCoins = globalTodayStandings[index].coins;
    const higherCount = globalTodayStandings.filter(s => s.coins > playerCoins).length;
    return higherCount + 1;
  };

  const getPodiumStyle = (rank: number) => {
    if (rank === 1) {
      return {
        medal: '🥇',
        crown: true,
        pedestalClass: 'w-14 h-12 bg-amber-300/60 rounded-t-lg flex items-center justify-center',
        medalClass: 'text-sm font-black text-amber-700',
        mbClass: '',
        avatarSize: 'md' as const
      };
    } else if (rank === 2) {
      return {
        medal: '🥈',
        crown: false,
        pedestalClass: 'w-14 h-8 bg-slate-200/70 rounded-t-lg flex items-center justify-center',
        medalClass: 'text-xs font-black text-slate-500',
        mbClass: 'mb-1',
        avatarSize: 'md' as const
      };
    } else {
      return {
        medal: '🥉',
        crown: false,
        pedestalClass: 'w-14 h-6 bg-orange-200/60 rounded-t-lg flex items-center justify-center',
        medalClass: 'text-xs font-black text-orange-650',
        mbClass: 'mb-2',
        avatarSize: 'sm' as const
      };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-violet-100 via-indigo-50 to-emerald-50 text-slate-800 pt-safe font-sans">

      {/* 1. TOP HEADER SECTION — sticky with fade-to-transparent gradient below */}
      <header className="sticky top-0 z-20 pointer-events-none">
        {/* Click-outside backdrop when menu is open */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-25 pointer-events-auto cursor-default bg-black/[0.03]"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
        {/* Gradient fade that masks content scrolling under the nav */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/95 via-violet-100/80 to-transparent backdrop-blur-[2px]" />

        <div className="relative pointer-events-auto flex items-center justify-center px-6 py-4" style={{ minHeight: '72px' }}>
          {/* Left top: redirect to main view — absolutely positioned */}
          <Link
            to="/"
            onClick={() => triggerHapticClick()}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-full transition-all active:scale-95"
            title={t('groupDetails.backBtn')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Middle part: standing, gems, today participants — truly centered */}
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
                  className="w-6 h-6 flex items-center justify-center relative overflow-visible"
                  style={{ zIndex: 10 - idx }}
                  title={part.username}
                >
                  <AvatarViewer
                    characterKey={getCosmeticKey(part.equipped_character_id)}
                    badgeKey={getCosmeticKey(part.equipped_badge_id)}
                    size="xs"
                    borderClass="border-white"
                    shadowClass="shadow-sm"
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

          {/* Top right part: Menu Button */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center z-30">
            <button
              onClick={async () => {
                await triggerHapticClick();
                setIsMenuOpen(!isMenuOpen);
              }}
              className={`w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white/40 rounded-full transition-all active:scale-95 relative ${
                isMenuOpen ? 'bg-white/60 text-slate-900' : ''
              }`}
              title={t('groupDetails.menuBtn', 'Menu')}
            >
              <Menu className={`w-5 h-5 absolute transition-all duration-350 ${isMenuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
              <X className={`w-5 h-5 absolute transition-all duration-350 ${isMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute top-full right-0 mt-2 flex flex-col items-center gap-1.5 bg-white/90 backdrop-blur-md border border-white/60 p-1.5 rounded-2xl shadow-xl transition-all duration-300 origin-top z-30 ${
                isMenuOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-90 -translate-y-4 pointer-events-none'
              }`}
            >
              <button
                onClick={async () => {
                  setIsMenuOpen(false);
                  await openArchive();
                }}
                className="p-2 text-slate-650 hover:text-indigo-650 hover:bg-indigo-50/50 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                title={t('groupDetails.archiveBtn')}
              >
                <History className="w-5 h-5" />
              </button>

              <button
                onClick={async () => {
                  setIsMenuOpen(false);
                  await triggerHapticClick();
                  navigate(`/group/${groupId}/stats`);
                }}
                className="p-2 text-slate-655 hover:text-indigo-650 hover:bg-indigo-50/50 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                title={t('groupDetails.statsBtn', 'Stats')}
              >
                <BarChart2 className="w-5 h-5" />
              </button>

              <button
                onClick={async () => {
                  setIsMenuOpen(false);
                  await triggerHapticClick();
                  navigate(`/group/${groupId}/manage-games`);
                }}
                className="p-2 text-slate-655 hover:text-indigo-650 hover:bg-indigo-50/50 rounded-xl transition-all active:scale-95 flex items-center justify-center"
                title={t('groupDetails.settingsBtn')}
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
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
            {t('groupDetails.today')}
          </h2>
          <div className="h-1 w-12 bg-slate-800 mx-auto rounded-full mt-2" />
        </div>

        {/* 3. GAMES GRID */}
        <section className="space-y-3">
          <div className="space-y-4">
            {allGames.filter(g => activeGameIds.includes(g.id)).map(game => {
              const gameResultCoins = calculateCoinsForGame(game.id);
              const playedTodayCount = gameResultCoins.length;
              const hasPlayed = todayScores.some(s => s.game_id === game.id && s.profile_id === profile?.id);

              return (
                <div
                  key={game.id}
                  className="bg-white/90 backdrop-blur-md rounded-[28px] p-4 shadow-sm flex flex-col gap-3 hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-fade-in max-w-[320px] mx-auto w-full"
                >
                  {/* Top Row: Preview Icon & Closes-In Timer */}
                  <div className="flex justify-between items-center">
                    {renderGamePreviewIcon(game.id, randomGrids[game.id])}

                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[9px] font-black uppercase text-indigo-650 tracking-wider">
                        {getGameCategoryTag(game.id)}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {getCountdownTo(game.reset_time_utc)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Played Count Stats & Minimal Flat Action Icon */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    {/* Flat X/Y People text */}
                    <button
                      onClick={async () => {
                        await triggerHapticClick();
                        setShowPlayedModal({ gameId: game.id, gameName: game.id === 'wordle_es' || game.id === 'la_palabra' ? 'La Palabra del Día' : game.display_name });
                      }}
                      className="text-xs text-slate-500 font-extrabold hover:text-indigo-600 active:scale-95 transition-all flex items-center gap-1.5 hover:bg-slate-50 px-2.5 py-0.5 rounded-lg"
                    >
                      <span>{playedTodayCount}/{members.length}</span>
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Flat Action Icon */}
                    <div>
                      {hasPlayed ? (
                        <div className="text-emerald-600 flex items-center justify-center p-1" title={t('groupDetails.completed')}>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePlayGame(game.id)}
                          className="w-8 h-8 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-600 flex items-center justify-center hover:scale-110 active:scale-90 transition-all cursor-pointer shadow-sm border border-sky-100/50"
                          title={t('dashboard.openGame', 'Play Game')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-sky-600 ml-0.5">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {activeGameIds.length === 0 && (
              <div className="text-center py-10 bg-white/40 backdrop-blur-md rounded-[24px] border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center space-y-2 mt-2">
                <span className="text-2xl">🎮</span>
                <p className="text-xs text-slate-500 font-bold">{t('groupDetails.noActiveGames')}</p>
                <button
                  onClick={() => navigate(`/group/${groupId}/manage-games`)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl transition-all shadow-sm"
                >
                  {t('groupDetails.manageGames')}
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

              {/* 2nd place (rendered on the left, which is index 1) */}
              {globalTodayStandings[1] && globalTodayStandings[1].coins > 0 ? (() => {
                const rank = getPlayerRank(1);
                const style = getPodiumStyle(rank);
                return (
                  <div className={`flex flex-col items-center gap-1 ${style.mbClass}`}>
                    {style.crown && <span className="text-xl select-none animate-bounce">👑</span>}
                    <div className="w-12 h-12 flex items-center justify-center">
                      <AvatarViewer
                        characterKey={getCosmeticKey(globalTodayStandings[1].equipped_character_id)}
                        badgeKey={getCosmeticKey(globalTodayStandings[1].equipped_badge_id)}
                        size={style.avatarSize}
                      />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 truncate max-w-[56px] text-center">{globalTodayStandings[1].username}</span>
                    <div className={style.pedestalClass}>
                      <span className={style.medalClass}>{style.medal}</span>
                    </div>
                  </div>
                );
              })() : <div className="w-14" />}

              {/* 1st place (rendered in the center, which is index 0) */}
              {(() => {
                const rank = getPlayerRank(0);
                const style = getPodiumStyle(rank);
                return (
                  <div className={`flex flex-col items-center gap-1 ${style.mbClass}`}>
                    {style.crown && <span className="text-xl select-none animate-bounce">👑</span>}
                    <div className="w-12 h-12 flex items-center justify-center">
                      <AvatarViewer
                        characterKey={getCosmeticKey(bestPlayer.equipped_character_id)}
                        badgeKey={getCosmeticKey(bestPlayer.equipped_badge_id)}
                        size={style.avatarSize}
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-800 truncate max-w-[64px] text-center">{bestPlayer.username}</span>
                    <div className={style.pedestalClass}>
                      <span className={style.medalClass}>{style.medal}</span>
                    </div>
                  </div>
                );
              })()}

              {/* 3rd place (rendered on the right, which is index 2) */}
              {globalTodayStandings[2] && globalTodayStandings[2].coins > 0 ? (() => {
                const rank = getPlayerRank(2);
                const style = getPodiumStyle(rank);
                return (
                  <div className={`flex flex-col items-center gap-1 ${style.mbClass}`}>
                    {style.crown && <span className="text-xl select-none animate-bounce">👑</span>}
                    <div className="w-8 h-8 flex items-center justify-center">
                      <AvatarViewer
                        characterKey={getCosmeticKey(globalTodayStandings[2].equipped_character_id)}
                        badgeKey={getCosmeticKey(globalTodayStandings[2].equipped_badge_id)}
                        size={style.avatarSize}
                      />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 truncate max-w-[56px] text-center">{globalTodayStandings[2].username}</span>
                    <div className={style.pedestalClass}>
                      <span className={style.medalClass}>{style.medal}</span>
                    </div>
                  </div>
                );
              })() : <div className="w-14" />}

            </div>
          </section>
        )}


        {/* 6. DAILY GLOBAL LEAGUE CHAT — seamless, no label */}
        <section className="space-y-0 pt-2">

          {/* Messages — flow naturally in the page scroll */}
          <div className="space-y-3">
            {chatMessages.map((msg) => {
              const isSelf = msg.profile_id === profile?.id;

              let parsedSystemMsg: any = null;
              if (msg.message_type === 'system') {
                try {
                  parsedSystemMsg = JSON.parse(msg.content);
                } catch (e) {
                  // Not JSON
                }
              }

              const isGameSystemMsg = parsedSystemMsg && (
                parsedSystemMsg.type === 'completed_word_grid' ||
                parsedSystemMsg.type === 'completed_chess_grid' ||
                parsedSystemMsg.type === 'completed_chess_grid_no_time' ||
                parsedSystemMsg.type === 'completed_word_group'
              );

              if (msg.message_type === 'system' && !isGameSystemMsg) {
                return (
                  <div key={msg.id} className="flex justify-center text-center my-1 w-full">
                    <span className="text-[10px] bg-white/60 text-slate-650 font-bold px-3 py-1.5 rounded-full border border-slate-200/50 max-w-[90%]">
                      <span className="text-slate-700 font-extrabold">{msg.profiles?.username || 'User'}</span>{' '}{msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 flex-shrink-0 mt-2">
                    <AvatarViewer
                      characterKey={getCosmeticKey(msg.profiles?.equipped_character_id)}
                      badgeKey={getCosmeticKey(msg.profiles?.equipped_badge_id)}
                      size="xs"
                    />
                  </div>

                  <div className="space-y-0.5">
                    {!isSelf && (
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block ml-1">
                        {msg.profiles?.username || 'User'}
                      </span>
                    )}
                    {isGameSystemMsg ? (
                      <GameCardView
                        parsed={parsedSystemMsg}
                        profileId={msg.profile_id || ''}
                        todayScores={todayScores}
                      />
                    ) : (
                      <div className={`p-3 rounded-2xl text-xs font-semibold shadow-sm border ${isSelf
                        ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none'
                        : 'bg-white/70 text-slate-800 border-slate-100 rounded-tl-none'
                        }`}>
                        {msg.content}
                      </div>
                    )}
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
                    <span>{t('groupDetails.season')}: {new Date(histSeason.start_date).toLocaleDateString()}</span>
                    <span className="text-[10px] text-slate-400">{t('groupDetails.ended')}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {histSeason.start_date} {t('groupDetails.to')} {histSeason.end_date}
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
              {t('groupDetails.close')}
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
                  <div className="w-8 h-8 flex items-center justify-center">
                    <AvatarViewer
                      characterKey={getCosmeticKey(playedUser.equipped_character_id)}
                      badgeKey={getCosmeticKey(playedUser.equipped_badge_id)}
                      size="sm"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-black text-slate-800 block">{playedUser.username}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{t('groupDetails.scoreLabel')}: {playedUser.score}</span>
                  </div>
                  <span className="text-emerald-600 font-black text-xs">+{playedUser.coins} {t('groupDetails.coinsLabel')}</span>
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
              {t('groupDetails.close')}
            </button>
          </div>
        </div>
      )}

      {/* Footer disclaimer hidden on this screen per design — shown on Login/Dashboard/Settings */}

    </div>
  );
};
