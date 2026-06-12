-- Update submit_daily_score_rpc to award 15 points instantly for playing
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
BEGIN
  -- Get invoking user ID from context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Get username
  SELECT username INTO v_username FROM profiles WHERE id = v_user_id;

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

  -- 4. Construct completion message based on game as JSON string
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

  -- 5. Increment season standings points & add chat message for all active seasons the user is part of
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
    'score_id', v_row_id
  );
END;
$$;
