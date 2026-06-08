-- Add image_url column to groups table to support custom group photos/banners
ALTER TABLE groups ADD COLUMN image_url TEXT;
