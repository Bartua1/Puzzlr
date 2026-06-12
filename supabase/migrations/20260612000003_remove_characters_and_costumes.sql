-- Remove character and costume type cosmetics
DELETE FROM cosmetics WHERE type != 'badge';

-- Redefine admin_reset_inventory_rpc to not re-seed default avatar
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

  RETURN json_build_object('success', true, 'message', 'Inventory reset successfully');
END;
$$;
