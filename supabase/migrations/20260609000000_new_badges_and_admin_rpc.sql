-- 1. Insert new badge cosmetics
INSERT INTO cosmetics (id, name, type, price, asset_key, is_active) VALUES
  ('66666666-6666-6666-6666-666666666666', 'Diamond Frost', 'badge', 35, 'badge_diamond', true),
  ('77777777-7777-7777-7777-777777777777', 'Emerald Flame', 'badge', 25, 'badge_emerald', true),
  ('88888888-8888-8888-8888-888888888888', 'Rose Crystal', 'badge', 20, 'badge_rose', true),
  ('99999999-9999-9999-9999-999999999999', 'Neon Pulse', 'badge', 40, 'badge_neon', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sunset Blaze', 'badge', 30, 'badge_sunset', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cosmic Void', 'badge', 50, 'badge_cosmic', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Admin purchase RPC (skips point deduction for is_admin users)
CREATE OR REPLACE FUNCTION admin_purchase_cosmetic_rpc(
  p_cosmetic_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_owned BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Check admin status
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = v_user_id;
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'message', 'Admin access required');
  END IF;

  -- Check cosmetic exists
  IF NOT EXISTS (SELECT 1 FROM cosmetics WHERE id = p_cosmetic_id AND is_active = true) THEN
    RETURN json_build_object('success', false, 'message', 'Cosmetic not found or inactive');
  END IF;

  -- Check if already owned
  SELECT EXISTS(
    SELECT 1 FROM user_cosmetics WHERE profile_id = v_user_id AND cosmetic_id = p_cosmetic_id
  ) INTO v_owned;

  IF v_owned THEN
    RETURN json_build_object('success', false, 'message', 'You already own this cosmetic');
  END IF;

  -- Insert without deducting points
  INSERT INTO user_cosmetics (profile_id, cosmetic_id)
  VALUES (v_user_id, p_cosmetic_id);

  RETURN json_build_object('success', true, 'message', 'Cosmetic unlocked for free (Admin)');
END;
$$;

-- 3. Admin reset inventory RPC
CREATE OR REPLACE FUNCTION admin_reset_inventory_rpc()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Check admin status
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = v_user_id;
  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'message', 'Admin access required');
  END IF;

  -- Delete all user cosmetics
  DELETE FROM user_cosmetics WHERE profile_id = v_user_id;

  -- Reset equipped items
  UPDATE profiles
  SET equipped_character_id = NULL, equipped_badge_id = NULL
  WHERE id = v_user_id;

  -- Re-seed default avatar
  INSERT INTO user_cosmetics (profile_id, cosmetic_id)
  VALUES (v_user_id, '11111111-1111-1111-1111-111111111111')
  ON CONFLICT (profile_id, cosmetic_id) DO NOTHING;

  RETURN json_build_object('success', true, 'message', 'Inventory reset successfully');
END;
$$;
