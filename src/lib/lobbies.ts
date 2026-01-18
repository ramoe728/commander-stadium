import { createClient } from "@/lib/supabase/client";

// ============================================
// Types
// ============================================

export type LobbyStatus = "waiting" | "in_game" | "completed" | "cancelled";

export interface LobbyRecord {
  id: string;
  name: string;
  host_id: string;
  rules: string | null;
  password_hash: string | null;
  max_players: number;
  status: LobbyStatus;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface LobbyPlayerRecord {
  id: string;
  lobby_id: string;
  user_id: string;
  display_name: string;
  avatar_color: string;
  deck_id: string | null;
  deck_name: string | null;
  commander_name: string | null;
  commander_image_url: string | null;
  slot_position: number;
  is_ready: boolean;
  is_host: boolean;
  joined_at: string;
}

export interface LobbyWithPlayers extends LobbyRecord {
  players: LobbyPlayerRecord[];
}

export interface CreateLobbyInput {
  name: string;
  rules?: string;
  password?: string;
  maxPlayers?: number;
}

export interface JoinLobbyInput {
  lobbyId: string;
  displayName: string;
  avatarColor?: string;
  password?: string;
}

// ============================================
// Lobby CRUD Operations
// ============================================

/**
 * Gets the user's current active lobby (if any).
 * Users can only be in one lobby at a time.
 */
export async function getUserCurrentLobby(): Promise<LobbyWithPlayers | null> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Find any lobby_players record for this user in an active lobby
  const { data: playerRecord, error: playerError } = await supabase
    .from("lobby_players")
    .select("lobby_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (playerError || !playerRecord) {
    return null;
  }

  // Check if that lobby is still active (waiting or in_game)
  const lobby = await getLobby(playerRecord.lobby_id);
  if (!lobby || (lobby.status !== "waiting" && lobby.status !== "in_game")) {
    return null;
  }

  return lobby;
}

/**
 * Result type for lobby operations that may fail with a specific reason.
 */
export interface LobbyOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Creates a new lobby and adds the creator as host.
 */
export async function createLobby(input: CreateLobbyInput): Promise<LobbyOperationResult<LobbyRecord>> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Check if user is already in a lobby
  const currentLobby = await getUserCurrentLobby();
  if (currentLobby) {
    return { 
      success: false, 
      error: `You are already in a lobby: "${currentLobby.name}". Leave it first to create a new one.` 
    };
  }

  // Create the lobby
  const { data: lobby, error: lobbyError } = await supabase
    .from("lobbies")
    .insert({
      name: input.name,
      host_id: user.id,
      rules: input.rules || null,
      password_hash: input.password || null, // In production, hash this!
      max_players: input.maxPlayers || 4,
      status: "waiting",
    })
    .select()
    .single();

  if (lobbyError || !lobby) {
    console.error("Error creating lobby:", lobbyError);
    return { success: false, error: "Failed to create lobby" };
  }

  // Add the creator as the host in slot 1
  const { error: playerError } = await supabase
    .from("lobby_players")
    .insert({
      lobby_id: lobby.id,
      user_id: user.id,
      display_name: user.email?.split("@")[0] || "Host",
      slot_position: 1,
      is_host: true,
      is_ready: false,
    });

  if (playerError) {
    console.error("Error adding host to lobby:", playerError);
    // Clean up the lobby
    await supabase.from("lobbies").delete().eq("id", lobby.id);
    return { success: false, error: "Failed to join lobby as host" };
  }

  return { success: true, data: lobby };
}

/**
 * Gets a lobby by ID with all its players.
 */
export async function getLobby(lobbyId: string): Promise<LobbyWithPlayers | null> {
  const supabase = createClient();

  const { data: lobby, error: lobbyError } = await supabase
    .from("lobbies")
    .select("*")
    .eq("id", lobbyId)
    .single();

  if (lobbyError || !lobby) {
    console.error("Error fetching lobby:", lobbyError);
    return null;
  }

  const { data: players, error: playersError } = await supabase
    .from("lobby_players")
    .select("*")
    .eq("lobby_id", lobbyId)
    .order("slot_position", { ascending: true });

  if (playersError) {
    console.error("Error fetching lobby players:", playersError);
    return null;
  }

  return {
    ...lobby,
    players: players || [],
  };
}

/**
 * Gets all waiting lobbies for the game finder.
 */
export async function getWaitingLobbies(): Promise<LobbyWithPlayers[]> {
  const supabase = createClient();

  const { data: lobbies, error: lobbyError } = await supabase
    .from("lobbies")
    .select("*")
    .eq("status", "waiting")
    .order("created_at", { ascending: false });

  if (lobbyError || !lobbies) {
    console.error("Error fetching lobbies:", lobbyError);
    return [];
  }

  // Fetch players for all lobbies
  const lobbyIds = lobbies.map((l) => l.id);
  const { data: allPlayers, error: playersError } = await supabase
    .from("lobby_players")
    .select("*")
    .in("lobby_id", lobbyIds);

  if (playersError) {
    console.error("Error fetching lobby players:", playersError);
  }

  // Group players by lobby
  const playersByLobby = new Map<string, LobbyPlayerRecord[]>();
  (allPlayers || []).forEach((player) => {
    const existing = playersByLobby.get(player.lobby_id) || [];
    existing.push(player);
    playersByLobby.set(player.lobby_id, existing);
  });

  return lobbies.map((lobby) => ({
    ...lobby,
    players: playersByLobby.get(lobby.id) || [],
  }));
}

/**
 * Joins a lobby in the next available slot.
 */
export async function joinLobby(input: JoinLobbyInput): Promise<LobbyOperationResult<LobbyPlayerRecord>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Get the lobby to check status and find next available slot
  const lobby = await getLobby(input.lobbyId);
  if (!lobby) {
    return { success: false, error: "Lobby not found" };
  }

  if (lobby.status !== "waiting") {
    return { success: false, error: "Lobby is not accepting players" };
  }

  // Check password if required
  if (lobby.password_hash && lobby.password_hash !== input.password) {
    return { success: false, error: "Invalid password" };
  }

  // Check if already in this lobby
  if (lobby.players.some((p) => p.user_id === user.id)) {
    // Already in this lobby - that's fine, just return success
    const existingPlayer = lobby.players.find((p) => p.user_id === user.id)!;
    return { success: true, data: existingPlayer };
  }

  // Check if user is in a different lobby
  const currentLobby = await getUserCurrentLobby();
  if (currentLobby && currentLobby.id !== input.lobbyId) {
    return { 
      success: false, 
      error: `You are already in a lobby: "${currentLobby.name}". Leave it first to join another.` 
    };
  }

  // Find next available slot
  const takenSlots = new Set(lobby.players.map((p) => p.slot_position));
  let nextSlot = 1;
  for (let i = 1; i <= lobby.max_players; i++) {
    if (!takenSlots.has(i)) {
      nextSlot = i;
      break;
    }
  }

  if (takenSlots.size >= lobby.max_players) {
    return { success: false, error: "Lobby is full" };
  }

  // Join the lobby
  const { data: player, error } = await supabase
    .from("lobby_players")
    .insert({
      lobby_id: input.lobbyId,
      user_id: user.id,
      display_name: input.displayName,
      avatar_color: input.avatarColor || "#7c3aed",
      slot_position: nextSlot,
      is_host: false,
      is_ready: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error joining lobby:", error);
    return { success: false, error: "Failed to join lobby" };
  }

  return { success: true, data: player };
}

/**
 * Leaves a lobby.
 */
export async function leaveLobby(lobbyId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  // Check if user is the host
  const lobby = await getLobby(lobbyId);
  if (!lobby) return false;

  const isHost = lobby.host_id === user.id;

  if (isHost) {
    // If host leaves, cancel the lobby
    await supabase
      .from("lobbies")
      .update({ status: "cancelled" })
      .eq("id", lobbyId);
  }

  // Remove player from lobby
  const { error } = await supabase
    .from("lobby_players")
    .delete()
    .eq("lobby_id", lobbyId)
    .eq("user_id", user.id);

  return !error;
}

/**
 * Updates player's ready status.
 */
export async function setPlayerReady(lobbyId: string, isReady: boolean): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const { error } = await supabase
    .from("lobby_players")
    .update({ is_ready: isReady })
    .eq("lobby_id", lobbyId)
    .eq("user_id", user.id);

  return !error;
}

/**
 * Updates player's selected deck.
 */
export async function selectDeck(
  lobbyId: string,
  deckId: string,
  deckName: string,
  commanderName: string | null,
  commanderImageUrl: string | null
): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const { error } = await supabase
    .from("lobby_players")
    .update({
      deck_id: deckId,
      deck_name: deckName,
      commander_name: commanderName,
      commander_image_url: commanderImageUrl,
    })
    .eq("lobby_id", lobbyId)
    .eq("user_id", user.id);

  return !error;
}

/**
 * Starts the game (host only).
 */
export async function startGame(lobbyId: string): Promise<boolean> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  // Verify user is host
  const lobby = await getLobby(lobbyId);
  if (!lobby || lobby.host_id !== user.id) {
    console.error("Only the host can start the game");
    return false;
  }

  // Check all players are ready
  const allReady = lobby.players.every((p) => p.is_ready || p.is_host);
  if (!allReady) {
    console.error("Not all players are ready");
    return false;
  }

  // Update lobby status
  const { error } = await supabase
    .from("lobbies")
    .update({
      status: "in_game",
      started_at: new Date().toISOString(),
    })
    .eq("id", lobbyId);

  return !error;
}
