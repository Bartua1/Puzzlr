-- Add invite_code_expires_at column to groups table
ALTER TABLE groups ADD COLUMN invite_code_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '7 days');
