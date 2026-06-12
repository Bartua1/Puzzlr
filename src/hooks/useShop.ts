import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface Cosmetic {
  id: string;
  name: string;
  type: 'character' | 'costume' | 'badge';
  price: number;
  asset_key: string;
  is_active: boolean;
}

export const useShop = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCosmetics = async () => {
    const { data, error } = await supabase
      .from('cosmetics')
      .select('*')
      .eq('is_active', true);
    if (!error && data) {
      setCosmetics(data);
    }
  };

  const fetchUnlockedCosmetics = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_cosmetics')
      .select('cosmetic_id')
      .eq('profile_id', user.id);
    if (!error && data) {
      setUnlockedIds(data.map((row) => row.cosmetic_id));
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchCosmetics(), fetchUnlockedCosmetics()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setCosmetics([]);
      setUnlockedIds([]);
      setLoading(false);
    }
  }, [user]);

  const buyCosmetic = async (cosmeticId: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Not authenticated' };

    try {
      const { data, error } = await supabase.rpc('purchase_cosmetic_rpc', {
        p_cosmetic_id: cosmeticId,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      const res = data as { success: boolean; message: string };

      if (res.success) {
        await Promise.all([fetchUnlockedCosmetics(), refreshProfile()]);
        return { success: true, message: res.message };
      } else {
        return { success: false, message: res.message };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Purchase failed' };
    }
  };

  const buyStreakProtector = async (): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Not authenticated' };

    try {
      const { data, error } = await supabase.rpc('buy_streak_protector_rpc');

      if (error) {
        return { success: false, message: error.message };
      }

      const res = data as { success: boolean; message: string };

      if (res.success) {
        await refreshProfile();
        return { success: true, message: res.message };
      } else {
        return { success: false, message: res.message };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Purchase failed' };
    }
  };

  const equipCosmetic = async (cosmeticId: string | null, type: 'character' | 'badge' | 'costume'): Promise<{ success: boolean }> => {
    if (!user || !profile) return { success: false };

    // Costumes or characters are bound to equipped_character_id, badges are bound to equipped_badge_id
    const updates: any = {};
    if (type === 'badge') {
      updates.equipped_badge_id = cosmeticId;
    } else {
      // character/costume sets equipped_character_id
      updates.equipped_character_id = cosmeticId;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      await refreshProfile();
      return { success: true };
    }
    return { success: false };
  };

  const adminBuyCosmetic = async (cosmeticId: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Not authenticated' };
    try {
      const { data, error } = await supabase.rpc('admin_purchase_cosmetic_rpc', {
        p_cosmetic_id: cosmeticId,
      });
      if (error) return { success: false, message: error.message };
      const res = data as { success: boolean; message: string };
      if (res.success) {
        await Promise.all([fetchUnlockedCosmetics(), refreshProfile()]);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (e: any) {
      return { success: false, message: e.message || 'Admin purchase failed' };
    }
  };

  const adminResetInventory = async (): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Not authenticated' };
    try {
      const { data, error } = await supabase.rpc('admin_reset_inventory_rpc');
      if (error) return { success: false, message: error.message };
      const res = data as { success: boolean; message: string };
      if (res.success) {
        await Promise.all([fetchUnlockedCosmetics(), fetchCosmetics(), refreshProfile()]);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (e: any) {
      return { success: false, message: e.message || 'Inventory reset failed' };
    }
  };

  return {
    cosmetics,
    unlockedIds,
    loading,
    buyCosmetic,
    buyStreakProtector,
    equipCosmetic,
    refreshShop: loadData,
    adminBuyCosmetic,
    adminResetInventory,
  };
};

