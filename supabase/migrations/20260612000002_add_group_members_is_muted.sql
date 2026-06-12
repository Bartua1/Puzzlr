-- Add is_muted column to group_members if it doesn't exist
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false NOT NULL;
