-- =====================================================
-- Commander Stadium: Add Second Commander Support
-- =====================================================
-- This migration adds support for partner commanders
-- by adding columns for a second commander.
-- =====================================================

-- Add second commander columns
ALTER TABLE decks
ADD COLUMN IF NOT EXISTS commander2_name TEXT,
ADD COLUMN IF NOT EXISTS commander2_image_url TEXT;

-- =====================================================
-- To apply this migration:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this entire file and run it
-- =====================================================
