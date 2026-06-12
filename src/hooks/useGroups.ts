import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface Group {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  image_url?: string;
  invite_code_expires_at?: string;
  last_read_at?: string;
  is_muted?: boolean;
}

export interface Standing {
  profile_id: string;
  username: string;
  avatar_url: string | null;
  equipped_character_id?: string | null;
  equipped_badge_id?: string | null;
  points: number;
}

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, last_read_at, is_muted, groups(*)')
      .eq('profile_id', user.id);

    if (!error && data) {
      const parsedGroups = data
        .map((row: any) => {
          if (!row.groups) return null;
          return {
            ...row.groups,
            last_read_at: row.last_read_at,
            is_muted: row.is_muted
          };
        })
        .filter((g) => g !== null) as Group[];
      setGroups(parsedGroups);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchGroups().finally(() => setLoading(false));
    } else {
      setGroups([]);
      setLoading(false);
    }
  }, [user]);

  const createGroup = async (name: string, imageUrl?: string): Promise<{ success: boolean; group?: Group; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Generate random 6-digit numeric invite code
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Insert group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        created_by: user.id,
        invite_code: inviteCode,
        image_url: imageUrl || null,
        invite_code_expires_at: expiresAt,
      })
      .select()
      .single();

    if (groupError || !groupData) {
      return { success: false, error: groupError?.message || 'Failed to create group' };
    }

    // 2. Add creator as member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupData.id,
        profile_id: user.id,
      });

    if (memberError) {
      return { success: false, error: memberError.message };
    }

    // 3. Create default active season for this group
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
      .toISOString()
      .split('T')[0]; // 1-month season default

    await supabase.from('seasons').insert({
      group_id: groupData.id,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
    });

    await fetchGroups();
    return { success: true, group: groupData };
  };

  const joinGroup = async (inviteCode: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const cleanCode = inviteCode.trim().toUpperCase();

    // Find group
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('id, invite_code_expires_at')
      .eq('invite_code', cleanCode)
      .single();

    if (groupError || !groupData) {
      return { success: false, error: 'League not found with this code' };
    }

    if (groupData.invite_code_expires_at && new Date(groupData.invite_code_expires_at) < new Date()) {
      return { success: false, error: 'This invite code/link has expired' };
    }

    // Add member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupData.id,
        profile_id: user.id,
      });

    if (memberError) {
      // If code is duplicate primary key, user is already a member
      if (memberError.code === '23505') {
        return { success: false, error: 'You are already in this league' };
      }
      return { success: false, error: memberError.message };
    }

    await fetchGroups();
    return { success: true };
  };

  const getStandings = async (groupId: string): Promise<Standing[]> => {
    // 1. Get active season for the group
    let { data: seasonData } = await supabase
      .from('seasons')
      .select('id')
      .eq('group_id', groupId)
      .eq('is_active', true)
      .maybeSingle();

    if (!seasonData) {
      // Create default active season for this group
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
        .select('id')
        .single();

      if (!insertErr && newSeason) {
        seasonData = newSeason;
      } else {
        console.error('Failed to automatically create season in getStandings:', insertErr);
        return [];
      }
    }

    // 2. Fetch points
    const { data: pointsData, error } = await supabase
      .from('group_season_points')
      .select('points, profile_id, profiles(username, avatar_url, equipped_character_id, equipped_badge_id)')
      .eq('group_id', groupId)
      .eq('season_id', seasonData.id)
      .order('points', { ascending: false });

    if (error || !pointsData) return [];

    return pointsData.map((row: any) => ({
      profile_id: row.profile_id,
      username: row.profiles?.username || 'Unknown',
      avatar_url: row.profiles?.avatar_url || null,
      equipped_character_id: row.profiles?.equipped_character_id || null,
      equipped_badge_id: row.profiles?.equipped_badge_id || null,
      points: row.points,
    }));
  };

  const getGroupMembers = async (groupId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('group_members')
      .select('profile_id, profiles(username, avatar_url, equipped_character_id, equipped_badge_id)')
      .eq('group_id', groupId);

    if (error || !data) return [];
    return data.map((row: any) => ({
      profile_id: row.profile_id,
      username: row.profiles?.username || 'Unknown',
      avatar_url: row.profiles?.avatar_url || null,
      equipped_character_id: row.profiles?.equipped_character_id || null,
      equipped_badge_id: row.profiles?.equipped_badge_id || null,
    }));
  };

  const updateMuteStatus = async (groupId: string, isMuted: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('group_members')
      .update({ is_muted: isMuted })
      .eq('group_id', groupId)
      .eq('profile_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update local state
    setGroups(prev =>
      prev.map((g) => (g.id === groupId ? { ...g, is_muted: isMuted } : g))
    );

    return { success: true };
  };

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    getStandings,
    getGroupMembers,
    updateMuteStatus,
    refreshGroups: fetchGroups,
  };
};
