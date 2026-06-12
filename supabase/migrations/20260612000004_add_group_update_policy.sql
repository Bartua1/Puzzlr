-- Add update policy for groups table to allow members to change group details like the name
DROP POLICY IF EXISTS "Allow update for group members" ON groups;

CREATE POLICY "Allow update for group members" ON groups
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
        AND group_members.profile_id = auth.uid()
    )
  );
