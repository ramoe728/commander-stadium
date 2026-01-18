"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Footer } from "@/components/layout";
import {
  GamesList,
  FriendsList,
  GuestRestricted,
  CreateGameButton,
  CreateGameModal,
  DecklistsButton,
  Game,
  Friend,
} from "@/components/game-finder";
import { getWaitingLobbies, LobbyWithPlayers } from "@/lib/lobbies";

// Mock friends data - will be replaced when friends system is implemented
const MOCK_FRIENDS: Friend[] = [
  {
    id: "1",
    name: "BestFriend42",
    status: "in-game",
    avatarColor: "#7c3aed",
  },
  {
    id: "2",
    name: "CardShark",
    status: "online",
    avatarColor: "#06b6d4",
  },
  {
    id: "3",
    name: "MtgEnthusiast",
    status: "online",
    avatarColor: "#f59e0b",
  },
  {
    id: "4",
    name: "CasualCaster",
    status: "offline",
    avatarColor: "#10b981",
  },
  {
    id: "5",
    name: "ComboKing",
    status: "offline",
    avatarColor: "#ef4444",
  },
];

/**
 * Converts a LobbyWithPlayers to the Game interface used by UI components.
 */
function lobbyToGame(lobby: LobbyWithPlayers): Game {
  // Find the host player to get their display name
  const hostPlayer = lobby.players.find((p) => p.is_host);
  
  return {
    id: lobby.id,
    name: lobby.name,
    hostName: hostPlayer?.display_name || "Unknown",
    currentPlayers: lobby.players.length,
    maxPlayers: lobby.max_players,
    rules: lobby.rules || "No rules specified.",
    hasPassword: !!lobby.password_hash,
  };
}

export default function GameFinderPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [publicGames, setPublicGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch lobbies on mount and set up polling for updates
  useEffect(() => {
    async function fetchLobbies() {
      const lobbies = await getWaitingLobbies();
      setPublicGames(lobbies.map(lobbyToGame));
      setLoading(false);
    }

    fetchLobbies();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchLobbies, 10000);
    return () => clearInterval(interval);
  }, []);

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
    console.log("Adding friend");
    // TODO: Open add friend modal
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
              {/* Friends' Games - Restricted for guests */}
              {/* TODO: Implement friends' games when friends system is ready */}
              {/* <GuestRestricted>
                <GamesList
                  title="Friends' Games"
                  games={[]}
                  emptyMessage="No friends are hosting games right now"
                  onJoinGame={handleJoinGame}
                />
              </GuestRestricted> */}

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
                <FriendsList
                  friends={MOCK_FRIENDS}
                  onAddFriend={handleAddFriend}
                />
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
    </div>
  );
}
