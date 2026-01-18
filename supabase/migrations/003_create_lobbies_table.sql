-- ============================================
-- Lobbies Table
-- Stores game lobby information
-- ============================================

-- Create lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Game settings
  rules TEXT,
  password_hash TEXT, -- NULL means public game
  max_players INTEGER NOT NULL DEFAULT 4,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_game', 'completed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Create lobby_players junction table
CREATE TABLE IF NOT EXISTS lobby_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Player info
  display_name TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#7c3aed',
  
  -- Deck selection
  deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
  deck_name TEXT,
  commander_name TEXT,
  commander_image_url TEXT,
  
  -- Player slot position (1-4)
  slot_position INTEGER NOT NULL CHECK (slot_position BETWEEN 1 AND 4),
  
  -- Ready status
  is_ready BOOLEAN DEFAULT FALSE,
  is_host BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (lobby_id, user_id),
  UNIQUE (lobby_id, slot_position)
);

-- Create indexes for faster queries
CREATE INDEX idx_lobbies_status ON lobbies(status);
CREATE INDEX idx_lobbies_host ON lobbies(host_id);
CREATE INDEX idx_lobby_players_lobby ON lobby_players(lobby_id);
CREATE INDEX idx_lobby_players_user ON lobby_players(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_players ENABLE ROW LEVEL SECURITY;

-- Lobbies policies
-- Anyone can view lobbies (for game finder)
CREATE POLICY "Anyone can view lobbies"
  ON lobbies FOR SELECT
  USING (true);

-- Only authenticated users can create lobbies
CREATE POLICY "Authenticated users can create lobbies"
  ON lobbies FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Only host can update their lobby
CREATE POLICY "Hosts can update their lobby"
  ON lobbies FOR UPDATE
  USING (auth.uid() = host_id);

-- Only host can delete their lobby
CREATE POLICY "Hosts can delete their lobby"
  ON lobbies FOR DELETE
  USING (auth.uid() = host_id);

-- Lobby players policies
-- Anyone can view lobby players (for displaying who's in the lobby)
CREATE POLICY "Anyone can view lobby players"
  ON lobby_players FOR SELECT
  USING (true);

-- Authenticated users can join lobbies (insert their own record)
CREATE POLICY "Users can join lobbies"
  ON lobby_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own player record (ready status, deck selection)
CREATE POLICY "Users can update their own player record"
  ON lobby_players FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can leave lobbies (delete their own record)
CREATE POLICY "Users can leave lobbies"
  ON lobby_players FOR DELETE
  USING (auth.uid() = user_id);

-- Hosts can remove players from their lobbies
CREATE POLICY "Hosts can remove players from their lobby"
  ON lobby_players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lobbies 
      WHERE lobbies.id = lobby_players.lobby_id 
      AND lobbies.host_id = auth.uid()
    )
  );

-- ============================================
-- Realtime subscriptions
-- Enable realtime for lobby updates
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE lobby_players;
