import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { useGroups } from './useGroups';
import { useDailyScores } from './useDailyScores';
import { Badge } from '@capawesome/capacitor-badge';
import { Capacitor } from '@capacitor/core';

export const useNotifications = () => {
  const { user } = useAuth();
  const { groups } = useGroups();
  const { scores } = useDailyScores();

  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [pendingGames, setPendingGames] = useState<Record<string, number>>({});
  const [totalNotifications, setTotalNotifications] = useState(0);

  const updateAppBadge = async (count: number) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const perm = await Badge.checkPermissions();
      if (perm.display === 'prompt') {
        await Badge.requestPermissions();
      }
      if (count > 0) {
        await Badge.set({ count });
      } else {
        await Badge.clear();
      }
    } catch (err) {
      console.error('Failed to update native app badge:', err);
    }
  };

  const fetchNotifications = useCallback(async () => {
    if (!user || groups.length === 0) {
      setUnreadMessages({});
      setPendingGames({});
      setTotalNotifications(0);
      updateAppBadge(0);
      return;
    }

    const groupIds = groups.map((g) => g.id);
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfToday = `${todayStr}T00:00:00.000Z`;

    try {
      // 1. Fetch group games mapping
      const { data: groupGamesData } = await supabase
        .from('group_games')
        .select('group_id, game_id')
        .in('group_id', groupIds);

      // 2. Fetch today's group messages
      const { data: messagesData } = await supabase
        .from('group_messages')
        .select('group_id, created_at, profile_id')
        .in('group_id', groupIds)
        .gte('created_at', startOfToday);

      // Calculate pending games per group
      const newPendingGames: Record<string, number> = {};
      const playedGameIds = scores.map((s) => s.game_id);

      // Resolve duplicates for wordle_es and la_palabra
      const hasPlayedWordleEs = playedGameIds.includes('wordle_es') || playedGameIds.includes('la_palabra');

      groups.forEach((group) => {
        const activeGames = groupGamesData
          ?.filter((gg) => gg.group_id === group.id)
          .map((gg) => gg.game_id) || [];

        const unplayedGames = activeGames.filter((gameId) => {
          if (gameId === 'wordle_es' || gameId === 'la_palabra') {
            return !hasPlayedWordleEs;
          }
          return !playedGameIds.includes(gameId);
        });

        newPendingGames[group.id] = unplayedGames.length;
      });

      // Calculate unread messages per group
      const newUnreadMessages: Record<string, number> = {};
      groups.forEach((group) => {
        const lastRead = group.last_read_at ? new Date(group.last_read_at).getTime() : 0;
        const unreadMsgs = messagesData?.filter((msg) => {
          if (msg.group_id !== group.id) return false;
          if (msg.profile_id === user.id) return false;
          const msgTime = new Date(msg.created_at).getTime();
          return msgTime > lastRead;
        }) || [];

        newUnreadMessages[group.id] = unreadMsgs.length;
      });

      // Calculate total notifications per group, and sum
      let sum = 0;
      groups.forEach((group) => {
        const count = (newUnreadMessages[group.id] || 0) + (newPendingGames[group.id] || 0);
        sum += count;
      });

      setUnreadMessages(newUnreadMessages);
      setPendingGames(newPendingGames);
      setTotalNotifications(sum);
      updateAppBadge(sum);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  }, [user, groups, scores]);

  useEffect(() => {
    // Request permission on mount if native
    if (Capacitor.isNativePlatform()) {
      Badge.requestPermissions().catch((err) => {
        console.warn('Failed to request badge permissions on mount:', err);
      });
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    if (!user || groups.length === 0) return;

    const groupIds = groups.map((g) => g.id);

    // Subscribe to realtime group messages inserts
    const channel = supabase
      .channel('realtime-group-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg && groupIds.includes(newMsg.group_id) && newMsg.profile_id !== user.id) {
            // Trigger recalculation
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groups, fetchNotifications]);

  return {
    unreadMessages,
    pendingGames,
    totalNotifications,
    refreshNotifications: fetchNotifications,
  };
};
