-- 1. Create streak freezes table
CREATE TABLE IF NOT EXISTS public.streak_freezes (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  freeze_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (profile_id, freeze_date)
);

-- Enable RLS
ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own freezes" ON public.streak_freezes
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own freezes" ON public.streak_freezes
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- 2. Update submit_daily_score_rpc to support streaks, protectors, and logging freezes
CREATE OR REPLACE FUNCTION submit_daily_score_rpc(
  p_game_id TEXT,
  p_raw_text TEXT,
  p_score INTEGER,
  p_max_score INTEGER,
  p_solved_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_username TEXT;
  v_base_points INTEGER;
  v_points_earned INTEGER;
  v_row_id UUID;
  v_season_rec RECORD;
  v_completion_msg TEXT;
  v_time_str TEXT;
  v_guesses_str TEXT;
  
  -- Streak variables
  v_last_played_date DATE;
  v_streak_count INTEGER;
  v_streak_protectors INTEGER;
  v_days_diff INTEGER;
  v_days_missed INTEGER;
  v_freeze_day DATE;
BEGIN
  -- Get invoking user ID from context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Get username and profile stats
  SELECT username, last_played_date, streak_count, streak_protectors
  INTO v_username, v_last_played_date, v_streak_count, v_streak_protectors
  FROM profiles WHERE id = v_user_id;

  -- 1. Verify if user already submitted a score for this game on this date
  IF EXISTS (
    SELECT 1 FROM daily_scores 
    WHERE profile_id = v_user_id AND game_id = p_game_id AND solved_date = p_solved_date
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Already submitted score for this game today');
  END IF;

  -- Award 15 points instantly for playing a minigame
  v_points_earned := 15;

  -- 2. Insert Daily Score row
  INSERT INTO daily_scores (
    profile_id,
    game_id,
    raw_text,
    score,
    max_score,
    solved_date
  ) VALUES (
    v_user_id,
    p_game_id,
    p_raw_text,
    p_score,
    p_max_score,
    p_solved_date
  ) RETURNING id INTO v_row_id;

  -- 3. Award points to user Profile
  UPDATE profiles
  SET 
    lifetime_points = lifetime_points + v_points_earned,
    spendable_points = spendable_points + v_points_earned
  WHERE id = v_user_id;

  -- 4. Calculate and Update user streak
  IF v_last_played_date IS NULL THEN
    -- First time playing, start streak at 1
    v_streak_count := 1;
    UPDATE profiles
    SET streak_count = v_streak_count, last_played_date = p_solved_date
    WHERE id = v_user_id;
  ELSE
    v_days_diff := p_solved_date - v_last_played_date;
    
    IF v_days_diff = 0 THEN
      -- Already submitted a game today, streak remains unchanged
    ELSIF v_days_diff = 1 THEN
      -- Submitted consecutively, increment streak
      v_streak_count := v_streak_count + 1;
      UPDATE profiles
      SET streak_count = v_streak_count, last_played_date = p_solved_date
      WHERE id = v_user_id;
    ELSE
      -- Missed days! Check if we can use streak protectors
      v_days_missed := v_days_diff - 1;
      IF v_streak_protectors >= v_days_missed THEN
        -- Keep streak alive using protectors
        v_streak_count := v_streak_count + 1;
        v_streak_protectors := v_streak_protectors - v_days_missed;
        
        -- Log the frozen days
        FOR i IN 1..v_days_missed LOOP
          v_freeze_day := v_last_played_date + i;
          INSERT INTO public.streak_freezes (profile_id, freeze_date)
          VALUES (v_user_id, v_freeze_day)
          ON CONFLICT (profile_id, freeze_date) DO NOTHING;
        END LOOP;

        UPDATE profiles
        SET 
          streak_count = v_streak_count,
          streak_protectors = v_streak_protectors,
          last_played_date = p_solved_date
        WHERE id = v_user_id;
      ELSE
        -- Reset streak to 1
        v_streak_count := 1;
        UPDATE profiles
        SET streak_count = v_streak_count, last_played_date = p_solved_date
        WHERE id = v_user_id;
      END IF;
    END IF;
  END IF;

  -- 5. Construct completion message based on game as JSON string
  IF p_game_id = 'word_grid' OR p_game_id = 'la_palabra' OR p_game_id = 'wordle_es' THEN
    v_guesses_str := substring(p_raw_text from '(?i)([1-6xX])/6');
    IF v_guesses_str IS NULL THEN
      v_guesses_str := (7 - p_score)::TEXT;
    END IF;
    IF v_guesses_str = '0' OR upper(v_guesses_str) = 'X' THEN
      v_guesses_str := 'X';
    END IF;
    v_completion_msg := json_build_object(
      'type', 'completed_word_grid',
      'gameId', p_game_id,
      'guesses', v_guesses_str
    )::TEXT;
  ELSIF p_game_id = 'chess_grid' THEN
    v_time_str := substring(p_raw_text from '(\d+:\d+)');
    IF v_time_str IS NOT NULL THEN
      v_completion_msg := json_build_object(
        'type', 'completed_chess_grid',
        'gameId', p_game_id,
        'time', v_time_str
      )::TEXT;
    ELSE
      v_completion_msg := json_build_object(
        'type', 'completed_chess_grid_no_time',
        'gameId', p_game_id
      )::TEXT;
    END IF;
  ELSE
    v_completion_msg := json_build_object(
      'type', 'completed_word_group',
      'gameId', p_game_id,
      'score', p_score,
      'max', p_max_score
    )::TEXT;
  END IF;

  -- 6. Increment season standings points & add chat message for all active seasons the user is part of
  FOR v_season_rec IN (
    SELECT s.id AS season_id, s.group_id
    FROM seasons s
    JOIN group_members gm ON gm.group_id = s.group_id
    WHERE gm.profile_id = v_user_id AND s.is_active = true
  ) LOOP
    -- Points
    INSERT INTO group_season_points (
      group_id,
      profile_id,
      season_id,
      points
    ) VALUES (
      v_season_rec.group_id,
      v_user_id,
      v_season_rec.season_id,
      v_points_earned
    )
    ON CONFLICT (group_id, profile_id, season_id)
    DO UPDATE SET points = group_season_points.points + v_points_earned;

    -- Chat message (only if game is active in that group)
    IF EXISTS (
      SELECT 1 FROM group_games 
      WHERE group_id = v_season_rec.group_id AND game_id = p_game_id
    ) THEN
      INSERT INTO group_messages (
        group_id,
        profile_id,
        message_type,
        content
      ) VALUES (
        v_season_rec.group_id,
        v_user_id,
        'system',
        v_completion_msg
      );
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true, 
    'message', 'Score submitted successfully', 
    'points_earned', v_points_earned,
    'score_id', v_row_id,
    'new_streak_count', v_streak_count
  );
END;
$$;

-- 3. Anonymous block to recalculate and fix streaks and freezes for existing users
DO $$
DECLARE
  v_profile RECORD;
  v_score RECORD;
  v_streak INTEGER;
  v_last_date DATE;
  v_protectors INTEGER;
  v_diff INTEGER;
  v_missed INTEGER;
BEGIN
  FOR v_profile IN SELECT id, streak_protectors FROM profiles LOOP
    v_streak := 0;
    v_last_date := NULL;
    v_protectors := v_profile.streak_protectors;
    
    FOR v_score IN 
      SELECT DISTINCT solved_date 
      FROM daily_scores 
      WHERE profile_id = v_profile.id 
      ORDER BY solved_date ASC
    Loop
      IF v_last_date IS NULL THEN
        v_streak := 1;
        v_last_date := v_score.solved_date;
      ELSE
        v_diff := v_score.solved_date - v_last_date;
        IF v_diff = 1 THEN
          v_streak := v_streak + 1;
          v_last_date := v_score.solved_date;
        ELSIF v_diff > 1 THEN
          v_missed := v_diff - 1;
          IF v_protectors >= v_missed THEN
            v_streak := v_streak + 1;
            v_protectors := v_protectors - v_missed;
            
            -- Backfill historical freezes
            FOR i IN 1..v_missed LOOP
              INSERT INTO public.streak_freezes (profile_id, freeze_date)
              VALUES (v_profile.id, v_last_date + i)
              ON CONFLICT DO NOTHING;
            END LOOP;
            
            v_last_date := v_score.solved_date;
          ELSE
            v_streak := 1;
            v_last_date := v_score.solved_date;
          END IF;
        END IF;
      END IF;
    END LOOP;
    
    -- Update profile with the recalculated streak
    UPDATE profiles
    SET 
      streak_count = COALESCE(v_streak, 0),
      last_played_date = v_last_date,
      streak_protectors = v_protectors
    WHERE id = v_profile.id;
  END LOOP;
END;
$$;
