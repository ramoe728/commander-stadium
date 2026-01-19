"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlayerSlot } from "./PlayerSlot";
import { DeckSelector } from "./DeckSelector";
import {
  LobbyWithPlayers,
  LobbyPlayerRecord,
  getLobby,
  leaveLobby,
  setPlayerReady,
  selectDeck,
  startGame,
} from "@/lib/lobbies";
import { DeckRecord } from "@/lib/decks";
import { useAuth } from "@/hooks";
import { createClient } from "@/lib/supabase/client";

interface LobbyProps {
  lobbyId: string;
  initialLobby: LobbyWithPlayers;
}

/**
 * Main lobby component that displays player slots and controls.
 */
export function Lobby({ lobbyId, initialLobby }: LobbyProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [lobby, setLobby] = useState<LobbyWithPlayers>(initialLobby);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const currentPlayer = lobby.players.find((p) => p.user_id === user?.id);
  const isHost = lobby.host_id === user?.id;
  const allPlayersReady = lobby.players.every((p) => p.is_ready || p.is_host);
  const canStartGame = isHost && allPlayersReady && lobby.players.length >= 2;

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to lobby changes
    const lobbyChannel = supabase
      .channel(`lobby:${lobbyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobbies",
          filter: `id=eq.${lobbyId}`,
        },
        async () => {
          // Refetch lobby data on any change
          const updatedLobby = await getLobby(lobbyId);
          if (updatedLobby) {
            setLobby(updatedLobby);
            
            // If game started, find the game ID and redirect
            if (updatedLobby.status === "in_game") {
              // Query for the game that was created from this lobby
              const { data: game } = await supabase
                .from("games")
                .select("id")
                .eq("lobby_id", lobbyId)
                .single();
              
              if (game) {
                router.push(`/game/${game.id}`);
              }
            }
            
            // If lobby was cancelled, redirect to game finder
            if (updatedLobby.status === "cancelled") {
              router.push("/game-finder");
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobby_players",
          filter: `lobby_id=eq.${lobbyId}`,
        },
        async () => {
          // Refetch lobby data on player changes
          const updatedLobby = await getLobby(lobbyId);
          if (updatedLobby) {
            setLobby(updatedLobby);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(lobbyChannel);
    };
  }, [lobbyId, router]);

  // Get player for each slot (1-4)
  function getPlayerForSlot(slot: number): LobbyPlayerRecord | null {
    return lobby.players.find((p) => p.slot_position === slot) || null;
  }

  async function handleLeaveLobby() {
    setIsLeaving(true);
    const success = await leaveLobby(lobbyId);
    if (success) {
      router.push("/game-finder");
    }
    setIsLeaving(false);
  }

  async function handleToggleReady() {
    if (!currentPlayer) return;
    await setPlayerReady(lobbyId, !currentPlayer.is_ready);
  }

  async function handleSelectDeck(deck: DeckRecord | null) {
    if (!currentPlayer) return;
    await selectDeck(
      lobbyId,
      deck?.id || "",
      deck?.name || "",
      deck?.commander_name || null,
      deck?.commander_image_url || null
    );
  }

  async function handleStartGame() {
    if (!canStartGame) return;
    setIsStarting(true);
    const gameId = await startGame(lobbyId);
    if (gameId) {
      // Redirect to the game page
      router.push(`/game/${gameId}`);
    } else {
      setIsStarting(false);
    }
  }

  async function handleKickPlayer(playerId: string) {
    // TODO: Implement kick functionality
    console.log("Kicking player:", playerId);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/game-finder"
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)] transition-colors"
            title="Back to Game Finder"
          >
            <BackIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
          </Link>
          <div>
            <h1 className="font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl font-bold text-[var(--foreground)]">
              {lobby.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-[var(--foreground-muted)]">
                {lobby.players.length}/{lobby.max_players} players
              </span>
              <span
                className={`text-sm px-2 py-0.5 rounded ${
                  lobby.status === "waiting"
                    ? "bg-black/70 text-amber-400 border border-amber-500/50"
                    : lobby.status === "in_game"
                    ? "bg-black/70 text-green-400 border border-green-500/50"
                    : "bg-black/70 text-gray-400 border border-gray-500/50"
                }`}
              >
                {lobby.status === "waiting" ? "Waiting" : lobby.status === "in_game" ? "In Game" : lobby.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLeaveLobby}
            disabled={isLeaving}
            className="btn-secondary px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer disabled:opacity-50"
          >
            {isLeaving ? "Leaving..." : "Leave Lobby"}
          </button>
        </div>
      </div>

      {/* Rules section */}
      {lobby.rules && (
        <div className="feature-card rounded-xl p-4">
          <h3 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
            <RulesIcon className="w-4 h-4" />
            Game Rules
          </h3>
          <p className="text-sm text-[var(--foreground-muted)] whitespace-pre-line">
            {lobby.rules}
          </p>
        </div>
      )}

      {/* Player slots grid */}
      <div>
        <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold text-[var(--foreground)] mb-4">
          Players
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((slot) => (
            <PlayerSlot
              key={slot}
              slot={slot}
              player={getPlayerForSlot(slot)}
              isCurrentUser={getPlayerForSlot(slot)?.user_id === user?.id}
              onKickPlayer={isHost ? handleKickPlayer : undefined}
            />
          ))}
        </div>
      </div>

      {/* Your controls */}
      {currentPlayer && (
        <div className="feature-card rounded-xl p-6 space-y-6">
          <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold text-[var(--foreground)]">
            Your Settings
          </h2>

          {/* Deck selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
              Select Your Deck
            </label>
            <DeckSelector
              selectedDeckId={currentPlayer.deck_id}
              onSelectDeck={handleSelectDeck}
            />
          </div>

          {/* Voice chat placeholder */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
              Voice Chat
            </label>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--foreground-muted)] flex items-center gap-2">
              <MicIcon className="w-5 h-5" />
              <span>Voice chat coming soon...</span>
            </div>
          </div>

          {/* Ready / Start buttons */}
          <div className="flex items-center gap-4 pt-2">
            {!isHost && (
              <button
                onClick={handleToggleReady}
                className={`flex-grow py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                  currentPlayer.is_ready
                    ? "bg-black/70 text-green-400 border border-green-500/50 hover:bg-black/80"
                    : "btn-primary text-white"
                }`}
              >
                {currentPlayer.is_ready ? "✓ Ready!" : "Ready Up"}
              </button>
            )}

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStartGame || isStarting}
                className="flex-grow btn-primary py-3 rounded-lg text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStarting ? "Starting..." : canStartGame ? "Start Game" : "Waiting for players..."}
              </button>
            )}
          </div>

          {isHost && !canStartGame && (
            <p className="text-sm text-[var(--foreground-muted)] text-center">
              {lobby.players.length < 2
                ? "Need at least 2 players to start"
                : "Waiting for all players to ready up"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function RulesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}
