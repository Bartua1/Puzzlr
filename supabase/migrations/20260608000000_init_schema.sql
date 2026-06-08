-- 1. Cosmetics Shop Table
CREATE TABLE cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('character', 'costume', 'badge')),
  price INTEGER NOT NULL,
  asset_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- 2. Profiles (Linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  language TEXT DEFAULT 'en' NOT NULL,
  lifetime_points INTEGER DEFAULT 0 NOT NULL,
  spendable_points INTEGER DEFAULT 0 NOT NULL,
  equipped_character_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL,
  equipped_badge_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. User Unlocked Cosmetics
CREATE TABLE user_cosmetics (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cosmetic_id UUID REFERENCES cosmetics(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (profile_id, cosmetic_id)
);

-- 4. Games Configuration
CREATE TABLE games (
  id TEXT PRIMARY KEY, -- e.g., 'word_grid', 'word_group', 'chess_grid'
  display_name TEXT NOT NULL,
  reset_time_utc TIME NOT NULL, -- Defines daily reset schedule
  base_points INTEGER DEFAULT 10 NOT NULL
);

-- 5. Groups (Leagues)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Group Members
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (group_id, profile_id)
);

-- 7. Seasons
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- 8. Daily Scores
CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  solved_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_game_date UNIQUE (profile_id, game_id, solved_date)
);

-- 9. Group Season Standings
CREATE TABLE group_season_points (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0 NOT NULL,
  PRIMARY KEY (group_id, profile_id, season_id)
);

-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_season_points ENABLE ROW LEVEL SECURITY;

-- 1. Cosmetics: Read for everyone, Write for none (handled by admin/system)
CREATE POLICY "Allow public read access to cosmetics" ON cosmetics
  FOR SELECT TO authenticated, anon USING (is_active = true);

-- 2. Profiles: Read for everyone, Write for self
CREATE POLICY "Allow public read access to profiles" ON profiles
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Allow update/insert for self profiles" ON profiles
  FOR ALL TO authenticated USING (auth.uid() = id);

-- 3. User Cosmetics: Read for everyone, Write for self
CREATE POLICY "Allow public read access to user_cosmetics" ON user_cosmetics
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for self user_cosmetics" ON user_cosmetics
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

-- 4. Games: Read for everyone
CREATE POLICY "Allow public read access to games" ON games
  FOR SELECT TO authenticated, anon USING (true);

-- 5. Groups: Read for everyone, Write/Modify for creators/members
CREATE POLICY "Allow select for authenticated users" ON groups
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for creators" ON groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- 6. Group Members: Read for members, Write for self
CREATE POLICY "Allow public select for group_members" ON group_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow join group for self" ON group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Allow leave group for self" ON group_members
  FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- 7. Seasons: Read for everyone
CREATE POLICY "Allow select seasons" ON seasons
  FOR SELECT TO authenticated USING (true);

-- 8. Daily Scores: Read for everyone, Insert for self
CREATE POLICY "Allow select daily_scores" ON daily_scores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert daily_scores for self" ON daily_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

-- 9. Group Season Points: Read for everyone
CREATE POLICY "Allow select group_season_points" ON group_season_points
  FOR SELECT TO authenticated USING (true);

-- =========================================================================
-- DATABASE FUNCTIONS & TRANSACTIONAL RPCS (SECURITY DEFINER)
-- =========================================================================

-- RPC A: Submit Daily Score Transaction
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
  v_base_points INTEGER;
  v_points_earned INTEGER;
  v_row_id UUID;
  v_season_rec RECORD;
BEGIN
  -- Get invoking user ID from context
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- 1. Verify if user already submitted a score for this game on this date
  IF EXISTS (
    SELECT 1 FROM daily_scores 
    WHERE profile_id = v_user_id AND game_id = p_game_id AND solved_date = p_solved_date
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Already submitted score for this game today');
  END IF;

  -- Get game details
  SELECT base_points INTO v_base_points FROM games WHERE id = p_game_id;
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

  -- 4. Increment season standings points for all active seasons the user is part of
  FOR v_season_rec IN (
    SELECT s.id AS season_id, s.group_id
    FROM seasons s
    JOIN group_members gm ON gm.group_id = s.group_id
    WHERE gm.profile_id = v_user_id AND s.is_active = true
  ) LOOP
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
  END LOOP;

  RETURN json_build_object(
    'success', true, 
    'message', 'Score submitted successfully', 
    'points_earned', v_points_earned,
    'score_id', v_row_id
  );
END;
$$;

-- RPC B: Purchase Cosmetic Transaction
CREATE OR REPLACE FUNCTION purchase_cosmetic_rpc(
  p_cosmetic_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_price INTEGER;
  v_owned BOOLEAN;
BEGIN
  -- Get invoking user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Check price of cosmetic
  SELECT price INTO v_price FROM cosmetics WHERE id = p_cosmetic_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Cosmetic not found or inactive');
  END IF;

  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM user_cosmetics WHERE profile_id = v_user_id AND cosmetic_id = p_cosmetic_id
  ) INTO v_owned;

  IF v_owned THEN
    RETURN json_build_object('success', false, 'message', 'You already own this cosmetic');
  END IF;

  -- Verify enough spendable points
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_user_id AND spendable_points >= v_price
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient points balance');
  END IF;

  -- Deduct price from profile
  UPDATE profiles
  SET spendable_points = spendable_points - v_price
  WHERE id = v_user_id;

  -- Insert unlocked cosmetic link
  INSERT INTO user_cosmetics (profile_id, cosmetic_id)
  VALUES (v_user_id, p_cosmetic_id);

  RETURN json_build_object('success', true, 'message', 'Cosmetic purchased successfully');
END;
$$;

-- Seed default games configuration
INSERT INTO games (id, display_name, reset_time_utc, base_points) VALUES
  ('word_grid', 'Daily Word Grid', '00:00:00', 10),
  ('word_group', 'Group Categorization Game', '00:00:00', 10),
  ('chess_grid', 'Queen''s Grid', '00:00:00', 10)
ON CONFLICT (id) DO NOTHING;

-- Seed default cosmetics for the shop
INSERT INTO cosmetics (id, name, type, price, asset_key, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Default Avatar', 'character', 0, 'char_base', true),
  ('22222222-2222-2222-2222-222222222222', 'Gold Border Badge', 'badge', 15, 'badge_gold', true),
  ('33333333-3333-3333-3333-333333333333', 'Silver Border Badge', 'badge', 10, 'badge_silver', true),
  ('44444444-4444-4444-4444-444444444444', 'Knight Helmet', 'costume', 25, 'cos_knight', true),
  ('55555555-5555-5555-5555-555555555555', 'Wizard Robe', 'costume', 30, 'cos_wizard', true)
ON CONFLICT (id) DO NOTHING;
