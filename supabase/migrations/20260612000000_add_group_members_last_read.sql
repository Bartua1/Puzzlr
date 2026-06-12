-- Add last_read_at column to group_members if it doesn't exist
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Enable update for self on group_members (idempotent setup)
DROP POLICY IF EXISTS "Allow update group_members for self" ON group_members;

CREATE POLICY "Allow update group_members for self" ON group_members
  FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
