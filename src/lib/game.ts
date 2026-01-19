import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

// ============================================
// Types
// ============================================

export type GameStatus = "active" | "paused" | "finished" | "abandoned";

export type Zone = "library" | "hand" | "battlefield" | "graveyard" | "exile" | "command";

export interface CardPosition {
  x: number;
  y: number;
}

export interface GameCard {
  id: string; // Unique instance ID for this card in this game
  cardId: string; // Original card ID from the deck
  name: string;
  imageUrl: string;
  zone: Zone;
  ownerId: string; // Player who owns this card
  controllerId: string; // Player who currently controls this card
  position?: CardPosition; // Position on battlefield (only for battlefield zone)
  tapped: boolean;
  faceDown: boolean;
  counters: Record<string, number>; // e.g., { "+1/+1": 3, "loyalty": 4 }
  attachedTo?: string; // ID of card this is attached to
  isCommander: boolean;
}

export interface PlayerZones {
  library: GameCard[];
  hand: GameCard[];
  battlefield: GameCard[];
  graveyard: GameCard[];
  exile: GameCard[];
  command: GameCard[];
}

export interface GamePlayer {
  id: string;
  userId: string;
  position: number;
  deckId: string | null;
  deckName: string;
  commanderName: string;
  commanderImageUrl: string | null;
  commander2Name: string | null;
  commander2ImageUrl: string | null;
  lifeTotal: number;
  isEliminated: boolean;
  commanderDamage: Record<string, number>;
  zones: PlayerZones;
}

export interface GameState {
  players: Record<string, GamePlayer>; // Keyed by userId
  turnOrder: string[]; // Array of userIds in turn order
  activePlayerId: string;
  turnNumber: number;
  phase: string;
  lastAction?: {
    playerId: string;
    action: string;
    timestamp: string;
  };
}

export interface Game {
  id: string;
  lobbyId: string | null;
  status: GameStatus;
  gameState: GameState;
  currentTurnPlayerId: string | null;
  turnNumber: number;
  startedAt: string;
  updatedAt: string;
  finishedAt: string | null;
}

export interface GamePlayerRecord {
  id: string;
  game_id: string;
  user_id: string;
  position: number;
  deck_id: string | null;
  deck_name: string;
  commander_name: string;
  commander_image_url: string | null;
  commander2_name: string | null;
  commander2_image_url: string | null;
  life_total: number;
  is_eliminated: boolean;
  commander_damage: Record<string, number>;
}

// ============================================
// Game Operations
// ============================================

/**
 * Starts a game from a lobby.
 */
export async function startGame(lobbyId: string): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("start_game_from_lobby", {
    p_lobby_id: lobbyId,
  });

  if (error) {
    console.error("Error starting game:", error);
    return null;
  }

  return data as string;
}

/**
 * Gets a game by ID with player information.
 */
export async function getGame(gameId: string): Promise<{
  game: Game;
  players: GamePlayerRecord[];
} | null> {
  const supabase = createClient();

  // Get game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    console.error("Error fetching game:", gameError);
    return null;
  }

  // Get players
  const { data: players, error: playersError } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", gameId)
    .order("position");

  if (playersError) {
    console.error("Error fetching game players:", playersError);
    return null;
  }

  return {
    game: {
      id: game.id,
      lobbyId: game.lobby_id,
      status: game.status,
      gameState: game.game_state || {},
      currentTurnPlayerId: game.current_turn_player_id,
      turnNumber: game.turn_number,
      startedAt: game.started_at,
      updatedAt: game.updated_at,
      finishedAt: game.finished_at,
    },
    players: players || [],
  };
}

/**
 * Gets the current user's active game.
 */
export async function getCurrentGame(): Promise<string | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("game_players")
    .select("game_id, games!inner(status)")
    .eq("user_id", user.id)
    .eq("games.status", "active")
    .single();

  if (error || !data) {
    return null;
  }

  return data.game_id;
}

/**
 * Updates the game state.
 */
export async function updateGameState(
  gameId: string,
  gameState: Partial<GameState>
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("games")
    .update({
      game_state: gameState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);

  if (error) {
    console.error("Error updating game state:", error);
    return false;
  }

  return true;
}

/**
 * Updates a player's life total.
 */
export async function updateLifeTotal(
  gameId: string,
  playerId: string,
  lifeTotal: number
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("game_players")
    .update({ life_total: lifeTotal })
    .eq("game_id", gameId)
    .eq("user_id", playerId);

  if (error) {
    console.error("Error updating life total:", error);
    return false;
  }

  return true;
}

// ============================================
// Real-time Game Channel
// ============================================

export interface GameAction {
  type: string;
  playerId: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

/**
 * Subscribes to real-time game updates using Supabase Broadcast.
 * Returns a channel that can be used to send and receive game actions.
 */
export function subscribeToGame(
  gameId: string,
  onAction: (action: GameAction) => void,
  onPresence?: (players: Record<string, unknown>) => void
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase.channel(`game:${gameId}`, {
    config: {
      broadcast: { self: true },
      presence: { key: gameId },
    },
  });

  // Listen for broadcast messages (game actions)
  channel.on("broadcast", { event: "game_action" }, ({ payload }) => {
    onAction(payload as GameAction);
  });

  // Optionally track presence
  if (onPresence) {
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      onPresence(state);
    });
  }

  channel.subscribe();

  return channel;
}

/**
 * Sends a game action to all players.
 */
export async function sendGameAction(
  channel: RealtimeChannel,
  action: Omit<GameAction, "timestamp">
): Promise<void> {
  await channel.send({
    type: "broadcast",
    event: "game_action",
    payload: {
      ...action,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Tracks player presence in a game.
 */
export async function trackPresence(
  channel: RealtimeChannel,
  playerId: string,
  playerData: Record<string, unknown>
): Promise<void> {
  await channel.track({
    userId: playerId,
    ...playerData,
    online_at: new Date().toISOString(),
  });
}

// ============================================
// Game Action Types
// ============================================

export const GameActionTypes = {
  // Card movement
  MOVE_CARD: "MOVE_CARD",
  TAP_CARD: "TAP_CARD",
  UNTAP_CARD: "UNTAP_CARD",
  FLIP_CARD: "FLIP_CARD",
  
  // Zone changes
  DRAW_CARD: "DRAW_CARD",
  PLAY_CARD: "PLAY_CARD",
  DISCARD_CARD: "DISCARD_CARD",
  EXILE_CARD: "EXILE_CARD",
  RETURN_TO_HAND: "RETURN_TO_HAND",
  RETURN_TO_LIBRARY: "RETURN_TO_LIBRARY",
  CAST_COMMANDER: "CAST_COMMANDER",
  RETURN_COMMANDER: "RETURN_COMMANDER",
  
  // Counters
  ADD_COUNTER: "ADD_COUNTER",
  REMOVE_COUNTER: "REMOVE_COUNTER",
  
  // Life
  UPDATE_LIFE: "UPDATE_LIFE",
  DEAL_COMMANDER_DAMAGE: "DEAL_COMMANDER_DAMAGE",
  
  // Turn management
  PASS_TURN: "PASS_TURN",
  
  // Game state
  SHUFFLE_LIBRARY: "SHUFFLE_LIBRARY",
  REVEAL_CARD: "REVEAL_CARD",
  CONCEDE: "CONCEDE",
} as const;

// ============================================
// Helper to initialize game state from players
// ============================================

export function initializeGameState(
  players: GamePlayerRecord[],
  deckCards: Record<string, GameCard[]> // Keyed by userId
): GameState {
  const gameState: GameState = {
    players: {},
    turnOrder: players.map((p) => p.user_id),
    activePlayerId: players[0]?.user_id || "",
    turnNumber: 1,
    phase: "main",
  };

  for (const player of players) {
    const cards = deckCards[player.user_id] || [];
    
    // Separate commanders from library
    const commanders = cards.filter((c) => c.isCommander);
    const library = cards.filter((c) => !c.isCommander);

    gameState.players[player.user_id] = {
      id: player.id,
      userId: player.user_id,
      position: player.position,
      deckId: player.deck_id,
      deckName: player.deck_name,
      commanderName: player.commander_name,
      commanderImageUrl: player.commander_image_url,
      commander2Name: player.commander2_name,
      commander2ImageUrl: player.commander2_image_url,
      lifeTotal: player.life_total,
      isEliminated: player.is_eliminated,
      commanderDamage: player.commander_damage || {},
      zones: {
        library: shuffleArray(library),
        hand: [],
        battlefield: [],
        graveyard: [],
        exile: [],
        command: commanders,
      },
    };
  }

  return gameState;
}

/**
 * Fisher-Yates shuffle algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
