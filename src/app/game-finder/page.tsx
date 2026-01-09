"use client";

import { Navigation, Footer } from "@/components/layout";
import {
  GamesList,
  FriendsList,
  GuestRestricted,
  CreateGameButton,
  DecklistsButton,
  Game,
  Friend,
} from "@/components/game-finder";

// Mock data for UI development - will be replaced with real data later
const MOCK_PUBLIC_GAMES: Game[] = [
  {
    id: "1",
    name: "Casual EDH Night",
    hostName: "ManaWizard",
    currentPlayers: 2,
    maxPlayers: 4,
    rules:
      "Casual game, no infinite combos please.\nPower level 6-7.\nWe're here to have fun!",
    hasPassword: false,
  },
  {
    id: "2",
    name: "cEDH Tournament Practice",
    hostName: "SpikeMaster",
    currentPlayers: 3,
    maxPlayers: 4,
    rules:
      "Competitive EDH practice.\nAll legal strategies allowed.\nNo take-backs after priority passes.",
    hasPassword: false,
  },
  {
    id: "3",
    name: "Beginner Friendly",
    hostName: "NewPlayerHelper",
    currentPlayers: 1,
    maxPlayers: 4,
    rules:
      "New players welcome!\nWe'll help explain interactions.\nPrecons and budget decks encouraged.",
    hasPassword: false,
  },
  {
    id: "4",
    name: "Private Group",
    hostName: "SecretGamer",
    currentPlayers: 4,
    maxPlayers: 4,
    rules: "Private game for friends.",
    hasPassword: true,
  },
];

const MOCK_FRIENDS_GAMES: Game[] = [
  {
    id: "5",
    name: "Friday Night Magic",
    hostName: "BestFriend42",
    currentPlayers: 2,
    maxPlayers: 4,
    rules: "Our regular Friday game!\nBring your spiciest brews.",
    hasPassword: true,
  },
];

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

export default function GameFinderPage() {
  // Placeholder handlers - will implement functionality later
  const handleJoinGame = (gameId: string) => {
    console.log("Joining game:", gameId);
    // TODO: Navigate to game lobby
  };

  const handleCreateGame = () => {
    console.log("Creating game");
    // TODO: Open create game modal
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
              <GuestRestricted>
                <GamesList
                  title="Friends' Games"
                  games={MOCK_FRIENDS_GAMES}
                  emptyMessage="No friends are hosting games right now"
                  onJoinGame={handleJoinGame}
                />
              </GuestRestricted>

              {/* Public Games - Available to everyone */}
              <GamesList
                title="Public Games"
                games={MOCK_PUBLIC_GAMES}
                emptyMessage="No public games available. Why not create one?"
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
    </div>
  );
}

