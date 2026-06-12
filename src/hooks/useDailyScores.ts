import { useEffect, useState, useRef } from 'react';
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
  const [error, setError] = useState<Error | null>(null);
  const activeFetchId = useRef(0);

  const fetchGames = async () => {
    const { data, error: gamesErr } = await supabase.from('games').select('*');
    if (gamesErr) throw gamesErr;
    if (data) {
      setGames(data);
    }
  };

  const fetchTodayScores = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data, error: scoresErr } = await supabase
      .from('daily_scores')
      .select('*')
      .eq('profile_id', user.id)
      .eq('solved_date', today);

    if (scoresErr) throw scoresErr;
    if (data) {
      setScores(data);
    }
  };

  const loadData = async () => {
    if (!user) return;

    const fetchId = ++activeFetchId.current;

    setLoading(true);
    setError(null);

    const maxRetries = 3;
    let attempt = 0;
    let success = false;
    let lastError: any = null;

    while (attempt <= maxRetries && !success) {
      if (fetchId !== activeFetchId.current) return;
      try {
        await Promise.all([fetchGames(), fetchTodayScores()]);
        success = true;
      } catch (err: any) {
        lastError = err;
        attempt++;
        if (attempt <= maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.warn(`[useDailyScores] Load failed (attempt ${attempt}/${maxRetries + 1}). Retrying in ${delay}ms...`, err);
          if (fetchId !== activeFetchId.current) return;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (fetchId !== activeFetchId.current) return;

    if (!success) {
      console.error('[useDailyScores] All load attempts failed:', lastError);
      setError(lastError);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setScores([]);
      setError(null);
      setLoading(false);
    }
  }, [user]);

  const submitScore = async (
    gameId: string,
    rawText: string,
    score: number,
    maxScore: number
  ): Promise<{ success: boolean; message: string; pointsEarned?: number; newStreakCount?: number }> => {
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

      const res = data as { success: boolean; message: string; points_earned?: number; new_streak_count?: number };

      if (res.success) {
        await Promise.all([fetchTodayScores(), refreshProfile()]);
        return {
          success: true,
          message: res.message,
          pointsEarned: res.points_earned,
          newStreakCount: res.new_streak_count,
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
    error,
    submitScore,
    refreshScores: loadData,
  };
};
