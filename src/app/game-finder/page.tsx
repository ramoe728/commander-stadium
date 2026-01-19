"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Footer } from "@/components/layout";
import {
  GamesList,
  FriendsList,
  GuestRestricted,
  CreateGameButton,
  CreateGameModal,
  DecklistsButton,
  AddFriendModal,
  Game,
} from "@/components/game-finder";
import { getWaitingLobbies, LobbyWithPlayers } from "@/lib/lobbies";
import { getFriends } from "@/lib/friends";
import { useAuth } from "@/hooks";

/**
 * Converts a LobbyWithPlayers to the Game interface used by UI components.
 * Includes the host's user ID for friend filtering.
 */
interface GameWithHostId extends Game {
  hostId: string | null;
}

function lobbyToGameWithHostId(lobby: LobbyWithPlayers): GameWithHostId {
  // Find the host player to get their display name and user ID
  const hostPlayer = lobby.players.find((p) => p.is_host);
  
  return {
    id: lobby.id,
    name: lobby.name,
    hostName: hostPlayer?.display_name || "Unknown",
    hostId: hostPlayer?.user_id || null,
    currentPlayers: lobby.players.length,
    maxPlayers: lobby.max_players,
    rules: lobby.rules || "No rules specified.",
    hasPassword: !!lobby.password_hash,
  };
}

export default function GameFinderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendsGames, setFriendsGames] = useState<Game[]>([]);
  const [publicGames, setPublicGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch lobbies and separate friends' games from public games
  const fetchLobbies = useCallback(async () => {
    const lobbies = await getWaitingLobbies();
    const gamesWithHostId = lobbies.map(lobbyToGameWithHostId);

    // If user is logged in, fetch friends and filter games
    if (user) {
      const friends = await getFriends();
      const friendIds = new Set(friends.map((f) => f.id));

      // Separate friends' games from public games
      const friendGames: Game[] = [];
      const otherGames: Game[] = [];

      for (const game of gamesWithHostId) {
        if (game.hostId && friendIds.has(game.hostId)) {
          friendGames.push(game);
        } else {
          otherGames.push(game);
        }
      }

      setFriendsGames(friendGames);
      setPublicGames(otherGames);
    } else {
      // Not logged in - all games are public
      setFriendsGames([]);
      setPublicGames(gamesWithHostId);
    }

    setLoading(false);
  }, [user]);

  // Fetch lobbies on mount and set up polling for updates
  useEffect(() => {
    fetchLobbies();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchLobbies, 10000);
    return () => clearInterval(interval);
  }, [fetchLobbies]);

  // Navigate to lobby when joining a game
  const handleJoinGame = (gameId: string) => {
    router.push(`/lobby/${gameId}`);
  };

  // Open the create game modal
  const handleCreateGame = () => {
    setShowCreateModal(true);
  };

  // Called when a game is successfully created
  const handleGameCreated = (lobbyId: string) => {
    setShowCreateModal(false);
    router.push(`/lobby/${lobbyId}`);
  };

  const handleAddFriend = () => {
    setShowAddFriendModal(true);
  };

  return (
    <div className="animated-gradient min-h-screen relative">
      {/* Background effects */}
      <div className="particles absolute inset-0 pointer-events-none opacity-30" />

      <Navigation />

      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold mb-2">
              Game Finder
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Find a game to join or create your own
            </p>
          </div>

          {/* Main layout: Games + Sidebar */}
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Left column: Games */}
            <div className="flex-grow space-y-8">
              {/* Friends' Games - Only shown when logged in and has friends' games */}
              {user && (friendsGames.length > 0 || loading) && (
                <GamesList
                  title="Friends' Games"
                  games={friendsGames}
                  emptyMessage={loading ? "Loading..." : "No friends are hosting games right now"}
                  onJoinGame={handleJoinGame}
                />
              )}

              {/* Public Games - Available to everyone */}
              <GamesList
                title="Public Games"
                games={publicGames}
                emptyMessage={loading ? "Loading games..." : "No public games available. Why not create one?"}
                onJoinGame={handleJoinGame}
              />
            </div>

            {/* Right column: Sidebar */}
            <div className="lg:w-80 flex-shrink-0 space-y-4">
              {/* Create Game Button */}
              <CreateGameButton onClick={handleCreateGame} />

              {/* Decklists Button - Restricted for guests */}
              <GuestRestricted>
                <DecklistsButton />
              </GuestRestricted>

              {/* Friends List - Restricted for guests */}
              <GuestRestricted className="h-[400px]">
                <FriendsList onAddFriend={handleAddFriend} />
              </GuestRestricted>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Create game modal */}
      {showCreateModal && (
        <CreateGameModal
          onGameCreated={handleGameCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Add friend modal */}
      {showAddFriendModal && (
        <AddFriendModal onClose={() => setShowAddFriendModal(false)} />
      )}
    </div>
  );
}
