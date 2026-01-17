-- =====================================================
-- Commander Stadium: Decks Table Migration
-- =====================================================
-- This migration creates the decks table for storing
-- user deck data including cards, color identity, etc.
-- =====================================================

-- Create the decks table
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Deck',
  commander_name TEXT,
  commander_image_url TEXT,
  color_identity TEXT[] DEFAULT '{}',
  cards JSONB NOT NULL DEFAULT '[]',
  card_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster user deck lookups
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);

-- Create index for sorting by updated_at
CREATE INDEX IF NOT EXISTS idx_decks_updated_at ON decks(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own decks
CREATE POLICY "Users can view own decks"
  ON decks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own decks
CREATE POLICY "Users can create own decks"
  ON decks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own decks
CREATE POLICY "Users can update own decks"
  ON decks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own decks
CREATE POLICY "Users can delete own decks"
  ON decks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
DROP TRIGGER IF EXISTS update_decks_updated_at ON decks;
CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- To apply this migration:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this entire file and run it
-- =====================================================
