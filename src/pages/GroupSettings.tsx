import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import {
  triggerHapticClick,
  triggerHapticMedium,
  triggerHapticSuccess,
  triggerHapticError
} from '../utils/haptics';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  Send,
  LogOut,
  X,
  UserPlus,
  Bell,
  BellOff,
  Settings,
  ChevronDown
} from 'lucide-react';
import { AvatarViewer } from '../components/AvatarViewer';
import { getMeta } from './ManageGames';

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
  equipped_badge_id?: string | null;
  equipped_character_id?: string | null;
}

export const GroupSettings = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Core data states
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<ProfileSummary[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [cosmetics, setCosmetics] = useState<any[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [expandedSeasons, setExpandedSeasons] = useState<Record<string, boolean>>({});
  const [seasonGamesMap, setSeasonGamesMap] = useState<Record<string, string[]>>({});
  const [loadingSeasonGames, setLoadingSeasonGames] = useState<Record<string, boolean>>({});

  // UI States
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; icon: string; visible: boolean } | null>(null);
  const [toastTimeout, setToastTimeout] = useState<any>(null);

  // Toast helper
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

  // Load settings data
  const loadSettingsData = async () => {
    if (!groupId || !user) return;
    try {
      setLoading(true);

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
      setNewGroupName(groupData.name);

      // 2. Members
      const { data: membersData } = await supabase
        .from('group_members')
        .select('profile_id, is_muted, profiles(id, username, avatar_url, equipped_character_id, equipped_badge_id)')
        .eq('group_id', groupId);

      if (membersData) {
        setMembers(membersData.map((m: any) => m.profiles).filter(Boolean));
        // Find current user membership row
        const myMemberRow = membersData.find((m: any) => m.profile_id === user.id);
        if (myMemberRow) {
          setIsMuted(myMemberRow.is_muted || false);
        }
      }

      // 3. Active Season
      const { data: seasonData } = await supabase
        .from('seasons')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .maybeSingle();

      // 4. Seasons list
      const { data: seasonsList } = await supabase
        .from('seasons')
        .select('*')
        .eq('group_id', groupId)
        .order('start_date', { ascending: false });
      if (seasonsList) {
        setSeasons(seasonsList);
      }

      // 5. Active games in group to filter user's played games count
      const { data: activeGamesData } = await supabase
        .from('group_games')
        .select('game_id')
        .eq('group_id', groupId);
      const activeGameIds = activeGamesData?.map(ag => ag.game_id) || [];

      // Calculate user's games played count in this group/season
      if (seasonData && activeGameIds.length > 0) {
        const { data: scoresData } = await supabase
          .from('daily_scores')
          .select('solved_date')
          .eq('profile_id', user.id)
          .in('game_id', activeGameIds)
          .gte('solved_date', seasonData.start_date)
          .lte('solved_date', seasonData.end_date);
        if (scoresData) {
          setGamesPlayed(scoresData.length);
        }
      } else {
        setGamesPlayed(0);
      }

      // 6. Cosmetics mapping
      const { data: cosmeticsData } = await supabase.from('cosmetics').select('*');
      if (cosmeticsData) setCosmetics(cosmeticsData);

      // 7. Load all games configuration
      const { data: gamesData } = await supabase
        .from('games')
        .select('*')
        .order('display_name');
      if (gamesData) setAllGames(gamesData);

    } catch (e) {
      console.error('Error loading group settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
    return () => {
      if (toastTimeout) clearTimeout(toastTimeout);
    };
  }, [groupId, user]);

  const fetchGamesForSeason = async (season: Season, memberIds: string[]): Promise<string[]> => {
    if (memberIds.length === 0) return [];
    
    // Fetch unique game IDs played during this season
    const { data, error } = await supabase
      .from('daily_scores')
      .select('game_id')
      .in('profile_id', memberIds)
      .gte('solved_date', season.start_date)
      .lte('solved_date', season.end_date);
      
    if (error || !data) return [];
    const playedGameIds = Array.from(new Set(data.map((d: any) => d.game_id)));
    
    // If it's active, also merge current active games
    if (season.is_active) {
      const { data: activeGames } = await supabase
        .from('group_games')
        .select('game_id')
        .eq('group_id', season.group_id);
      const activeIds = activeGames?.map((ag: any) => ag.game_id) || [];
      return Array.from(new Set([...playedGameIds, ...activeIds]));
    }
    
    return playedGameIds;
  };

  const handleToggleSeason = async (season: Season) => {
    await triggerHapticClick();
    
    setExpandedSeasons(prev => ({
      ...prev,
      [season.id]: !prev[season.id]
    }));
    
    // Load games if not already loaded and not loading
    if (!seasonGamesMap[season.id] && !loadingSeasonGames[season.id]) {
      setLoadingSeasonGames(prev => ({ ...prev, [season.id]: true }));
      try {
        const memberIds = members.map(m => m.id);
        const gameIds = await fetchGamesForSeason(season, memberIds);
        setSeasonGamesMap(prev => ({ ...prev, [season.id]: gameIds }));
      } catch (e) {
        console.error('Error fetching games for season:', e);
      } finally {
        setLoadingSeasonGames(prev => ({ ...prev, [season.id]: false }));
      }
    }
  };

  // Rename group
  const handleRenameGroup = async () => {
    if (!group || !newGroupName.trim() || newGroupName.trim() === group.name) return;
    const nameToSave = newGroupName.trim();
    try {
      const { error: updateErr } = await supabase
        .from('groups')
        .update({ name: nameToSave })
        .eq('id', group.id);

      if (updateErr) throw updateErr;

      // Insert system message to chat
      const { error: msgErr } = await supabase
        .from('group_messages')
        .insert({
          group_id: group.id,
          profile_id: user?.id || null,
          message_type: 'system',
          content: JSON.stringify({ type: 'group_rename', newName: nameToSave })
        });

      if (msgErr) {
        console.error('Failed to write rename system message:', msgErr);
      }

      setGroup({ ...group, name: nameToSave });
      showToast(t('groupSettings.renameSuccess', 'League renamed successfully!'), '✓');
      await triggerHapticSuccess();
    } catch (err: any) {
      console.error('Rename failed:', err);
      showToast(t('groupSettings.renameError', 'Failed to rename league.'), '⚠️');
      await triggerHapticError();
      setNewGroupName(group.name); // revert
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Toggle Mute
  const toggleMute = async () => {
    if (!group || !user) return;
    const newMuted = !isMuted;
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ is_muted: newMuted })
        .eq('group_id', group.id)
        .eq('profile_id', user.id);

      if (error) throw error;
      setIsMuted(newMuted);

      const message = newMuted
        ? t('dashboard.groupMuted', { defaultValue: 'Muted {{groupName}}', groupName: group.name })
        : t('dashboard.groupUnmuted', { defaultValue: 'Unmuted {{groupName}}', groupName: group.name });
      const toastIcon = newMuted ? '🔕' : '🔔';
      showToast(message, toastIcon);
      await triggerHapticMedium();
    } catch (e) {
      console.error('Muting update failed:', e);
      showToast('Muting failed', '⚠️');
      await triggerHapticError();
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!group || !user) return;
    const confirmed = window.confirm(t('groupSettings.leaveConfirm', 'Are you sure you want to leave this league?'));
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('profile_id', user.id);

      if (error) throw error;

      await triggerHapticMedium();
      navigate('/');
    } catch (e) {
      console.error('Failed to leave group:', e);
      showToast('Failed to leave group', '⚠️');
      await triggerHapticError();
    }
  };

  // Copy and share code helpers
  const handleCopyCode = async () => {
    if (!group) return;
    await triggerHapticClick();
    await navigator.clipboard.writeText(group.invite_code);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    if (!group) return;
    await triggerHapticClick();
    const inviteLink = `${window.location.origin}?join=${group.invite_code}`;
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!group) return;
    await triggerHapticClick();
    const inviteLink = `${window.location.origin}?join=${group.invite_code}`;
    const shareText = `Join my league "${group.name}" on Puzzlr! Code: ${group.invite_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: group.name,
          text: shareText,
          url: inviteLink
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  const getCosmeticKey = (cosmeticId: string | null | undefined): string => {
    if (!cosmeticId) return '';
    return cosmetics.find(c => c.id === cosmeticId)?.asset_key || '';
  };

  const formatDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading || !group) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-violet-100 via-indigo-50 to-emerald-50 text-slate-800 pt-safe font-sans">
        <header className="flex items-center px-6 py-4" style={{ minHeight: '72px' }}>
          <Link
            to={`/group/${groupId}`}
            onClick={() => triggerHapticClick()}
            className="p-2 text-slate-655 hover:text-slate-900 hover:bg-white/40 rounded-full transition-all active:scale-95 animate-fade-in"
            title={t('groupDetails.backBtn')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center pb-24 animate-fade-in">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-violet-100 via-indigo-50 to-emerald-50 text-slate-800 pt-safe font-sans pb-16">
      
      {/* HEADER SECTION */}
      <header className="flex items-center justify-between px-5 py-4" style={{ minHeight: '72px' }}>
        <Link
          to={`/group/${groupId}`}
          onClick={() => triggerHapticClick()}
          className="p-2 text-slate-655 hover:text-slate-900 hover:bg-white/40 rounded-full transition-all active:scale-95 flex items-center gap-1.5"
          title={t('groupDetails.backBtn')}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{t('groupSettings.members', 'Members')}</span>
        </Link>

        {/* Invite Button in top right */}
        <button
          onClick={async () => {
            await triggerHapticClick();
            setShowInviteModal(true);
          }}
          className="px-4 py-2 bg-indigo-50 border border-indigo-200/50 text-indigo-700 hover:bg-indigo-100 rounded-full font-black text-xs flex items-center gap-1.5 active:scale-95 shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t('groupSettings.inviteBtn', 'Invite')}</span>
        </button>
      </header>

      {/* CONTENT BODY */}
      <main className="flex-1 max-w-md w-full mx-auto px-5 pt-2 space-y-8 animate-fade-in">
        
        {/* Avatars Stack & Play Stats */}
        <div className="text-center space-y-3">
          
          {/* Overlapping member photos */}
          <div className="flex -space-x-3.5 justify-center items-center py-2">
            {members.slice(0, 5).map((member, idx) => (
              <div
                key={member.id}
                className="w-14 h-14 flex items-center justify-center relative overflow-visible"
                style={{ zIndex: 10 - idx }}
                title={member.username}
              >
                <AvatarViewer
                  avatarUrl={member.avatar_url}
                  badgeKey={getCosmeticKey(member.equipped_badge_id)}
                  size="md"
                  borderClass="border-white border-2"
                  shadowClass="shadow-md"
                />
              </div>
            ))}
            {members.length > 5 && (
              <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center shadow-md z-0">
                +{members.length - 5}
              </div>
            )}
          </div>

          {/* Number of days/games played */}
          <p className="text-xs font-black text-indigo-700 uppercase tracking-wide">
            {gamesPlayed === 1 
              ? t('groupSettings.gamesPlayedSingle', { count: gamesPlayed, defaultValue: '1 game played' }) 
              : t('groupSettings.gamesPlayed', { count: gamesPlayed, defaultValue: '{{count}} games played' })}
          </p>

        </div>

        {/* Name input */}
        <div className="space-y-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onBlur={handleRenameGroup}
            onKeyDown={handleKeyDown}
            className="w-full px-5 py-4 bg-white/90 border border-slate-200/80 rounded-2xl text-center text-sm font-extrabold text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all shadow-sm"
            placeholder={t('groupDetails.groupNamePlaceholder', 'Group Name')}
          />
        </div>

        {/* Notifications Button */}
        <div className="space-y-2 pt-2">
          <button
            onClick={toggleMute}
            className={`w-full py-4 px-6 rounded-2xl font-extrabold flex items-center justify-center gap-3 relative transition-all active:scale-[0.98] shadow-sm select-none cursor-pointer border ${
              isMuted
                ? 'bg-slate-50 border-slate-200/80 text-slate-500 hover:bg-slate-100'
                : 'bg-indigo-50 border-indigo-200/50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            <span>{t('groupSettings.notificationsLabel', 'Notifications')}</span>
            
            {/* Red dot badge when active (not muted) */}
            {!isMuted && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          
          <p className="text-[10px] text-slate-500 font-bold text-center max-w-[280px] mx-auto">
            {isMuted 
              ? t('groupSettings.notificationsDescMuted', 'Notifications are muted for this group.')
              : t('groupSettings.notificationsDesc', 'Activate notifications to not miss any game from your group.')}
          </p>
        </div>

        {/* Manage Games Button */}
        <div className="pt-2">
          <Link
            to={`/group/${groupId}/manage-games`}
            onClick={() => triggerHapticClick()}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-50 border border-indigo-200/50 hover:bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer shadow-sm text-sm"
          >
            <Settings className="w-4 h-4" />
            <span>{t('groupDetails.manageGames', 'Manage Games')}</span>
          </Link>
        </div>

        {/* Seasons Section */}
        <div className="space-y-3.5 pt-4">
          <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase pl-1">
            {seasons.length === 1 ? `1 ${t('groupSettings.seasons', 'Season')}` : `${seasons.length} ${t('groupSettings.seasons', 'Seasons')}`}
          </h3>

          <div className="space-y-2.5">
            {seasons.map((histSeason, index) => (
              <div
                key={histSeason.id}
                className="bg-white/75 border border-white/40 rounded-2xl shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* Header toggle button */}
                <button
                  type="button"
                  onClick={() => handleToggleSeason(histSeason)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/95 transition-all text-left focus:outline-none cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900 block">
                      {t('groupDetails.season', 'Season')} {seasons.length - index}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold tracking-tight block uppercase">
                      {formatDate(histSeason.start_date)} - {formatDate(histSeason.end_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {histSeason.is_active && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black rounded-full uppercase tracking-wider scale-95 shadow-sm flex items-center gap-1 animate-pulse">
                        <span>✨</span> {t('groupSettings.active', 'ACTIVE')}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-slate-450 transition-transform duration-250 ${
                        expandedSeasons[histSeason.id] ? 'rotate-180 text-slate-800' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible content area */}
                {expandedSeasons[histSeason.id] && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100/50 bg-white/40 divide-y divide-slate-100/60 animate-fade-in">
                    {loadingSeasonGames[histSeason.id] ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                      </div>
                    ) : seasonGamesMap[histSeason.id] && seasonGamesMap[histSeason.id].length > 0 ? (
                      <div className="space-y-2.5 pt-2">
                        {seasonGamesMap[histSeason.id].map(gameId => {
                          const gameObj = allGames.find(g => g.id === gameId);
                          const meta = getMeta(gameId);
                          const GameIcon = meta.icon;
                          const displayName = meta.genericName || gameObj?.display_name || gameId;
                          return (
                            <div key={gameId} className="flex items-center gap-3 py-1">
                              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                <GameIcon />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-slate-800 truncate block">
                                  {displayName}
                                </span>
                                {gameObj && (
                                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block">
                                    {gameObj.base_points} {t('groupSettings.points', 'pts')}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-[10px] text-slate-450 font-bold">
                        {t('groupSettings.noGamesInSeason', 'No games played in this season.')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {seasons.length === 0 && (
              <p className="text-center py-6 text-xs text-slate-400 font-bold">
                {t('groupDetails.noArchiveData', 'No seasons found.')}
              </p>
            )}
          </div>
        </div>

        {/* Leave Group Button */}
        <div className="pt-6">
          <button
            onClick={handleLeaveGroup}
            className="w-full py-4 px-6 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-extrabold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('groupSettings.leaveBtn', 'Leave Group')}</span>
          </button>
        </div>

      </main>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-md text-slate-800 rounded-[32px] max-w-sm w-full p-6 space-y-6 shadow-2xl relative border border-white/60 animate-scale-up">
            
            {/* Close Button */}
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {t('groupSettings.inviteModalTitle', 'Invite Friends')}
              </h3>
              <p className="text-xs text-slate-400 font-medium max-w-[260px] mx-auto leading-normal">
                {t('groupSettings.inviteModalSubtitle', 'Share this invite code or link with your friends to join this league.')}
              </p>
            </div>

            {/* 6-Digit invite code box */}
            <div className="bg-purple-50/70 border-2 border-dashed border-purple-200 rounded-2xl py-4 text-center space-y-1 relative group overflow-hidden">
              <span className="text-[10px] font-black uppercase text-purple-500 tracking-widest block">
                {t('groups.inviteCode', 'Invite Code')}
              </span>
              <span className="text-3xl font-black text-purple-800 tracking-wider block font-mono">
                {group.invite_code}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 text-indigo-700 hover:text-indigo-850 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{t('groupSettings.code', 'Code')}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 bg-sky-50 hover:bg-sky-100 border border-sky-200/50 text-sky-700 hover:text-sky-850 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{t('groupSettings.link', 'Link')}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-700 hover:text-emerald-850 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{t('groupSettings.share', 'Share')}</span>
              </button>
            </div>

            {/* Copy success badge */}
            {inviteCopied && (
              <div className="text-center text-xs font-black text-emerald-600 flex items-center justify-center gap-1 animate-pulse">
                <Check className="w-4 h-4" strokeWidth={3} />
                <span>{t('groupSettings.copied', 'Copied!')}</span>
              </div>
            )}

            {/* Close modal button */}
            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold rounded-2xl transition-all text-xs cursor-pointer shadow-sm border border-purple-200/50"
            >
              {t('groupDetails.close', 'Close')}
            </button>
          </div>
        </div>
      )}

      {/* GLASS MATERIAL TOAST NOTIFICATION */}
      {toast && toast.visible && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-[9999] pointer-events-none px-4">
          <div className="bg-white/45 backdrop-blur-md border border-white/30 shadow-lg text-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 transition-all duration-300 pointer-events-auto animate-fade-in-up">
            <span className="text-base select-none">{toast.icon}</span>
            <span className="text-xs font-bold tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Disclaimer Footer mandatory in settings view */}
      <footer className="max-w-md w-full mx-auto px-6 py-6 text-center text-[9px] text-slate-400 leading-relaxed font-semibold">
        {t('app.disclaimer')}
      </footer>

    </div>
  );
};
