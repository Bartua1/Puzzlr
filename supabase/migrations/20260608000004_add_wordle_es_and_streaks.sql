-- 1. Add streak tracking columns to profiles table if they do not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_played_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_protectors INTEGER DEFAULT 0 NOT NULL;

-- 2. Seed default games for Spanish Wordle / La Palabra del Día
INSERT INTO public.games (id, display_name, reset_time_utc, base_points) VALUES
  ('wordle_es', 'Palabra de 5 Letras', '08:00:00', 10),
  ('la_palabra', 'La Palabra del Día', '08:00:00', 10)
ON CONFLICT (id) DO NOTHING;

-- 3. Create or replace function to buy streak protectors
CREATE OR REPLACE FUNCTION public.buy_streak_protector_rpc()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_price CONSTANT INTEGER := 150;
BEGIN
  -- Get invoking user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Verify enough points
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_user_id AND spendable_points >= v_price
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient points balance');
  END IF;

  -- Deduct points & increment protectors count
  UPDATE public.profiles
  SET 
    spendable_points = spendable_points - v_price,
    streak_protectors = streak_protectors + 1
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'message', 'Streak Protector purchased successfully');
END;
$$;

-- 4. Create or replace submit_daily_score_rpc function to handle streaks, protectors, and group game propagation
CREATE OR REPLACE FUNCTION public.submit_daily_score_rpc(
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
BEGIN
  -- Get invoking user ID from context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Get username and profile stats
  SELECT username, last_played_date, streak_count, streak_protectors
  INTO v_username, v_last_played_date, v_streak_count, v_streak_protectors
  FROM public.profiles WHERE id = v_user_id;

  -- 1. Verify if user already submitted a score for this game on this date
  IF EXISTS (
    SELECT 1 FROM public.daily_scores 
    WHERE profile_id = v_user_id AND game_id = p_game_id AND solved_date = p_solved_date
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Already submitted score for this game today');
  END IF;

  -- Get game details
  SELECT base_points INTO v_base_points FROM public.games WHERE id = p_game_id;
  IF NOT FOUND THEN
    v_base_points := 10; -- default fallback
  END IF;

  -- Calculate points: Base points + bonus proportional to score ratio
  IF p_max_score > 0 THEN
    v_points_earned := v_base_points + floor((p_score::float / p_max_score::float) * 10)::integer;
  ELSE
    v_points_earned := v_base_points;
  END IF;

  -- 2. Insert Daily Score row
  INSERT INTO public.daily_scores (
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

  -- 3. Update User Profile Points
  UPDATE public.profiles
  SET 
    lifetime_points = lifetime_points + v_points_earned,
    spendable_points = spendable_points + v_points_earned
  WHERE id = v_user_id;

  -- 4. Calculate and Update user streak
  IF v_last_played_date IS NULL THEN
    -- First time playing, start streak at 1
    v_streak_count := 1;
    UPDATE public.profiles
    SET streak_count = v_streak_count, last_played_date = p_solved_date
    WHERE id = v_user_id;
  ELSE
    v_days_diff := p_solved_date - v_last_played_date;
    
    IF v_days_diff = 0 THEN
      -- Already submitted a game today, streak remains unchanged
    ELSIF v_days_diff = 1 THEN
      -- Submitted consecutively, increment streak
      v_streak_count := v_streak_count + 1;
      UPDATE public.profiles
      SET streak_count = v_streak_count, last_played_date = p_solved_date
      WHERE id = v_user_id;
    ELSE
      -- Missed days! Check if we can use streak protectors
      v_days_missed := v_days_diff - 1;
      IF v_streak_protectors >= v_days_missed THEN
        -- Keep streak alive using protectors
        v_streak_count := v_streak_count + 1;
        v_streak_protectors := v_streak_protectors - v_days_missed;
        UPDATE public.profiles
        SET 
          streak_count = v_streak_count,
          streak_protectors = v_streak_protectors,
          last_played_date = p_solved_date
        WHERE id = v_user_id;
      ELSE
        -- Reset streak to 1
        v_streak_count := 1;
        UPDATE public.profiles
        SET streak_count = v_streak_count, last_played_date = p_solved_date
        WHERE id = v_user_id;
      END IF;
    END IF;
  END IF;

  -- 5. Construct completion message based on game
  IF p_game_id = 'word_grid' OR p_game_id = 'wordle_es' THEN
    v_guesses_str := substring(p_raw_text from '(?i)([1-6xX])/6');
    IF v_guesses_str IS NULL THEN
      v_guesses_str := (7 - p_score)::TEXT;
    END IF;
    IF v_guesses_str = '0' OR upper(v_guesses_str) = 'X' THEN
      v_guesses_str := 'X';
    END IF;
    
    IF p_game_id = 'wordle_es' THEN
      v_completion_msg := 'completed Palabra de 5 Letras in ' || v_guesses_str || '/6 guesses';
    ELSE
      v_completion_msg := 'completed Daily Word Grid in ' || v_guesses_str || '/6 guesses';
    END IF;
  ELSIF p_game_id = 'la_palabra' THEN
    v_guesses_str := substring(p_raw_text from '(?i)([1-6xX])/6');
    IF v_guesses_str IS NULL THEN
      v_guesses_str := (7 - p_score)::TEXT;
    END IF;
    IF v_guesses_str = '0' OR upper(v_guesses_str) = 'X' THEN
      v_guesses_str := 'X';
    END IF;
    v_completion_msg := 'completed La Palabra del Día in ' || v_guesses_str || '/6 guesses';
  ELSIF p_game_id = 'chess_grid' THEN
    v_time_str := substring(p_raw_text from '(\d+:\d+)');
    IF v_time_str IS NOT NULL THEN
      v_completion_msg := 'completed Queen''s Grid in ' || v_time_str || ' seconds';
    ELSE
      v_completion_msg := 'completed Queen''s Grid';
    END IF;
  ELSE
    v_completion_msg := 'completed Group Categorization Game with ' || p_score::TEXT || '/' || p_max_score::TEXT || ' groups solved';
  END IF;

  -- 6. Increment season standings points & add chat message for active seasons if game is active in that group
  FOR v_season_rec IN (
    SELECT s.id AS season_id, s.group_id
    FROM public.seasons s
    JOIN public.group_members gm ON gm.group_id = s.group_id
    WHERE gm.profile_id = v_user_id AND s.is_active = true
  ) LOOP
    -- ONLY update points and add message if this minigame is assigned/active in the group
    IF EXISTS (
      SELECT 1 FROM public.group_games 
      WHERE group_id = v_season_rec.group_id AND game_id = p_game_id
    ) THEN
      -- Points
      INSERT INTO public.group_season_points (
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
      DO UPDATE SET points = public.group_season_points.points + v_points_earned;

      -- Chat message
      INSERT INTO public.group_messages (
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
