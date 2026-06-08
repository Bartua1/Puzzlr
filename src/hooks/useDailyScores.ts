import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface DailyScore {
  id: string;
  profile_id: string;
  game_id: string;
  raw_text: string;
  score: number;
  max_score: number;
  solved_date: string;
  created_at: string;
}

export interface GameConfig {
  id: string;
  display_name: string;
  reset_time_utc: string;
  base_points: number;
}

export const useDailyScores = () => {
  const { user, refreshProfile } = useAuth();
  const [games, setGames] = useState<GameConfig[]>([]);
  const [scores, setScores] = useState<DailyScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = async () => {
    const { data, error } = await supabase.from('games').select('*');
    if (!error && data) {
      setGames(data);
    }
  };

  const fetchTodayScores = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_scores')
      .select('*')
      .eq('profile_id', user.id)
      .eq('solved_date', today);

    if (!error && data) {
      setScores(data);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchGames(), fetchTodayScores()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setScores([]);
      setLoading(false);
    }
  }, [user]);

  const submitScore = async (
    gameId: string,
    rawText: string,
    score: number,
    maxScore: number
  ): Promise<{ success: boolean; message: string; pointsEarned?: number }> => {
    if (!user) return { success: false, message: 'Not authenticated' };

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await supabase.rpc('submit_daily_score_rpc', {
        p_game_id: gameId,
        p_raw_text: rawText,
        p_score: score,
        p_max_score: maxScore,
        p_solved_date: today,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      const res = data as { success: boolean; message: string; points_earned?: number };

      if (res.success) {
        await Promise.all([fetchTodayScores(), refreshProfile()]);
        return {
          success: true,
          message: res.message,
          pointsEarned: res.points_earned,
        };
      } else {
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Submission failed' };
    }
  };

  return {
    games,
    scores,
    loading,
    submitScore,
    refreshScores: fetchTodayScores,
  };
};
