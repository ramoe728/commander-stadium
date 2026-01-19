-- ============================================
-- Games Table
-- Stores active game sessions and their state
-- ============================================

-- Game status enum
CREATE TYPE game_status AS ENUM ('active', 'paused', 'finished', 'abandoned');

-- Games table - stores game metadata
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID REFERENCES lobbies(id) ON DELETE SET NULL,
    status game_status NOT NULL DEFAULT 'active',
    
    -- Game state stored as JSONB for flexibility
    -- Contains: players[], zones, turn info, etc.
    game_state JSONB NOT NULL DEFAULT '{}',
    
    -- Track whose turn it is
    current_turn_player_id UUID REFERENCES auth.users(id),
    turn_number INT NOT NULL DEFAULT 1,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);

-- Index for active games
CREATE INDEX idx_games_status ON games(status) WHERE status = 'active';
CREATE INDEX idx_games_lobby ON games(lobby_id);

-- Game players table - links players to games
CREATE TABLE game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Player position (0-3, determines battlefield position)
    position INT NOT NULL CHECK (position >= 0 AND position <= 3),
    
    -- Player's deck info (copied from lobby selection)
    deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
    deck_name TEXT NOT NULL,
    commander_name TEXT NOT NULL,
    commander_image_url TEXT,
    commander2_name TEXT,
    commander2_image_url TEXT,
    
    -- Player state
    life_total INT NOT NULL DEFAULT 40,
    is_eliminated BOOLEAN NOT NULL DEFAULT false,
    
    -- Track commander damage from each opponent
    -- Format: { "player_id": damage_amount }
    commander_damage JSONB NOT NULL DEFAULT '{}',
    
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(game_id, user_id),
    UNIQUE(game_id, position)
);

-- Index for player lookups
CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Players can view their games"
    ON games FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM game_players 
            WHERE game_players.game_id = games.id 
            AND game_players.user_id = auth.uid()
        )
    );

CREATE POLICY "Players can update their games"
    ON games FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM game_players 
            WHERE game_players.game_id = games.id 
            AND game_players.user_id = auth.uid()
        )
    );

-- System insert (from lobby start)
CREATE POLICY "Authenticated users can create games"
    ON games FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Game players policies
CREATE POLICY "Anyone can view game players"
    ON game_players FOR SELECT
    USING (true);

CREATE POLICY "System can insert game players"
    ON game_players FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Players can update their own record"
    ON game_players FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================
-- Function to start a game from a lobby
-- ============================================

CREATE OR REPLACE FUNCTION start_game_from_lobby(p_lobby_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_game_id UUID;
    v_player RECORD;
    v_position INT := 0;
BEGIN
    -- Create the game
    INSERT INTO games (lobby_id, status, game_state)
    VALUES (p_lobby_id, 'active', '{}'::jsonb)
    RETURNING id INTO v_game_id;
    
    -- Add all players from the lobby
    FOR v_player IN 
        SELECT 
            lp.user_id,
            lp.deck_id,
            lp.deck_name,
            lp.commander_name,
            lp.commander_image_url,
            d.commander2_name,
            d.commander2_image_url
        FROM lobby_players lp
        LEFT JOIN decks d ON d.id = lp.deck_id
        WHERE lp.lobby_id = p_lobby_id
        ORDER BY lp.slot_position
    LOOP
        INSERT INTO game_players (
            game_id, user_id, position, 
            deck_id, deck_name, commander_name, commander_image_url,
            commander2_name, commander2_image_url
        )
        VALUES (
            v_game_id, v_player.user_id, v_position,
            v_player.deck_id, v_player.deck_name, 
            v_player.commander_name, v_player.commander_image_url,
            v_player.commander2_name, v_player.commander2_image_url
        );
        v_position := v_position + 1;
    END LOOP;
    
    -- Set the first player's turn
    UPDATE games 
    SET current_turn_player_id = (
        SELECT user_id FROM game_players 
        WHERE game_id = v_game_id AND position = 0
    )
    WHERE id = v_game_id;
    
    -- Update lobby status
    UPDATE lobbies SET status = 'in_game' WHERE id = p_lobby_id;
    
    RETURN v_game_id;
END;
$$;

-- ============================================
-- Enable Realtime for games table
-- ============================================

-- Note: You need to enable Realtime for the games table in Supabase Dashboard
-- Go to Database > Replication and add the games table
-- Or run: ALTER PUBLICATION supabase_realtime ADD TABLE games;
