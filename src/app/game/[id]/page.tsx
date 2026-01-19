"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import {
  getGame,
  subscribeToGame,
  sendGameAction,
  GameAction,
  GameActionTypes,
  GamePlayerRecord,
  Game,
  GameState,
  GameCard,
  initializeGameState,
  updateGameState,
} from "@/lib/game";
import { getDeck } from "@/lib/decks";
import { RealtimeChannel } from "@supabase/supabase-js";

// ============================================
// Player Position Layout
// ============================================
// Position 0 = Bottom (current player)
// Position 1 = Right
// Position 2 = Top
// Position 3 = Left

interface PlayerBattlefieldProps {
  player: GamePlayerRecord;
  gameState: GameState | null;
  isCurrentPlayer: boolean;
  position: "bottom" | "right" | "top" | "left";
  onCardMove?: (cardId: string, x: number, y: number) => void;
}

function PlayerBattlefield({
  player,
  gameState,
  isCurrentPlayer,
  position,
}: PlayerBattlefieldProps) {
  const playerState = gameState?.players[player.user_id];
  const commandZone = playerState?.zones.command || [];
  const battlefield = playerState?.zones.battlefield || [];
  const libraryCount = playerState?.zones.library.length || 0;

  // Position-based styling
  const positionStyles: Record<string, string> = {
    bottom: "flex-row",
    top: "flex-row-reverse rotate-180",
    left: "flex-col-reverse -rotate-90",
    right: "flex-col rotate-90",
  };

  const isRotated = position === "left" || position === "right";

  return (
    <div
      className={`relative flex ${positionStyles[position]} items-end gap-4 p-4 ${
        isCurrentPlayer ? "bg-[var(--accent-primary)]/5" : ""
      }`}
      style={{
        transformOrigin: "center center",
      }}
    >
      {/* Battlefield area */}
      <div
        className={`flex-grow min-h-[120px] ${isRotated ? "min-w-[200px]" : ""} 
          bg-[var(--surface)]/30 rounded-lg border border-[var(--border)]/50 
          relative overflow-hidden`}
      >
        {/* Battlefield cards */}
        {battlefield.map((card) => (
          <div
            key={card.id}
            className="absolute w-16 h-22 cursor-move"
            style={{
              left: card.position?.x || 0,
              top: card.position?.y || 0,
              transform: card.tapped ? "rotate(90deg)" : "none",
            }}
          >
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover rounded-md shadow-lg"
            />
          </div>
        ))}

        {/* Empty battlefield indicator */}
        {battlefield.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground-subtle)] text-sm">
            {isCurrentPlayer ? "Your Battlefield" : `${player.deck_name}`}
          </div>
        )}
      </div>

      {/* Deck and Command Zone area */}
      <div className="flex flex-col gap-2 items-center">
        {/* Commander(s) - Command Zone */}
        <div className="flex gap-1">
          {player.commander_image_url && (
            <div className="relative group">
              <img
                src={player.commander_image_url}
                alt={player.commander_name}
                className="w-14 h-20 object-cover rounded-md shadow-lg border-2 border-amber-500/50"
              />
              {/* Commander indicator */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <CrownIcon className="w-2.5 h-2.5 text-black" />
              </div>
            </div>
          )}
          {player.commander2_image_url && (
            <div className="relative group">
              <img
                src={player.commander2_image_url}
                alt={player.commander2_name || "Commander"}
                className="w-14 h-20 object-cover rounded-md shadow-lg border-2 border-amber-500/50"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <CrownIcon className="w-2.5 h-2.5 text-black" />
              </div>
            </div>
          )}
        </div>

        {/* Library (Deck) */}
        <div className="relative">
          <div className="w-14 h-20 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-md shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">{libraryCount}</span>
          </div>
          <div className="absolute -bottom-1 left-1 w-14 h-20 bg-[var(--surface)] rounded-md -z-10" />
          <div className="absolute -bottom-2 left-2 w-14 h-20 bg-[var(--surface)]/50 rounded-md -z-20" />
        </div>

        {/* Player info */}
        <div className="text-center mt-1">
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {playerState?.lifeTotal || 40}
          </div>
          <div className="text-xs text-[var(--foreground-muted)] truncate max-w-[80px]">
            {player.deck_name}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Game Page
// ============================================

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<GamePlayerRecord[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Determine player positions relative to current user
  const getRelativePosition = useCallback(
    (playerPosition: number): "bottom" | "right" | "top" | "left" => {
      const currentPlayer = players.find((p) => p.user_id === user?.id);
      if (!currentPlayer) return "bottom";

      const currentPos = currentPlayer.position;
      const relativePos = (playerPosition - currentPos + 4) % 4;

      const positions: ("bottom" | "right" | "top" | "left")[] = [
        "bottom",
        "right",
        "top",
        "left",
      ];
      return positions[relativePos];
    },
    [players, user?.id]
  );

  // Handle incoming game actions
  const handleGameAction = useCallback((action: GameAction) => {
    console.log("Received game action:", action);

    setGameState((prevState) => {
      if (!prevState) return prevState;

      // Handle different action types
      switch (action.type) {
        case GameActionTypes.UPDATE_LIFE: {
          const { playerId, lifeTotal } = action.payload as {
            playerId: string;
            lifeTotal: number;
          };
          return {
            ...prevState,
            players: {
              ...prevState.players,
              [playerId]: {
                ...prevState.players[playerId],
                lifeTotal,
              },
            },
          };
        }

        case GameActionTypes.MOVE_CARD: {
          const { playerId, cardId, x, y } = action.payload as {
            playerId: string;
            cardId: string;
            x: number;
            y: number;
          };
          const player = prevState.players[playerId];
          if (!player) return prevState;

          const updatedBattlefield = player.zones.battlefield.map((card) =>
            card.id === cardId ? { ...card, position: { x, y } } : card
          );

          return {
            ...prevState,
            players: {
              ...prevState.players,
              [playerId]: {
                ...player,
                zones: {
                  ...player.zones,
                  battlefield: updatedBattlefield,
                },
              },
            },
          };
        }

        case GameActionTypes.TAP_CARD: {
          const { playerId, cardId, tapped } = action.payload as {
            playerId: string;
            cardId: string;
            tapped: boolean;
          };
          const player = prevState.players[playerId];
          if (!player) return prevState;

          const updatedBattlefield = player.zones.battlefield.map((card) =>
            card.id === cardId ? { ...card, tapped } : card
          );

          return {
            ...prevState,
            players: {
              ...prevState.players,
              [playerId]: {
                ...player,
                zones: {
                  ...player.zones,
                  battlefield: updatedBattlefield,
                },
              },
            },
          };
        }

        default:
          return prevState;
      }
    });
  }, []);

  // Initialize game
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    async function loadGame() {
      setLoading(true);
      setError(null);

      const result = await getGame(gameId);

      if (!result) {
        setError("Game not found");
        setLoading(false);
        return;
      }

      setGame(result.game);
      setPlayers(result.players);

      // Initialize game state if empty
      if (
        !result.game.gameState ||
        Object.keys(result.game.gameState).length === 0
      ) {
        // Load deck cards for each player
        const deckCards: Record<string, GameCard[]> = {};

        for (const player of result.players) {
          if (player.deck_id) {
            const deck = await getDeck(player.deck_id);
            if (deck) {
              deckCards[player.user_id] = deck.cards.map((card, index) => ({
                id: `${player.user_id}-${card.id}-${index}`,
                cardId: card.id,
                name: card.name,
                imageUrl: card.imageUrl,
                zone: card.isCommander ? "command" : "library",
                ownerId: player.user_id,
                controllerId: player.user_id,
                tapped: false,
                faceDown: true,
                counters: {},
                isCommander: card.isCommander || false,
              }));
            }
          }
        }

        const initialState = initializeGameState(result.players, deckCards);
        setGameState(initialState);

        // Save initial state
        await updateGameState(gameId, initialState);
      } else {
        setGameState(result.game.gameState as GameState);
      }

      setLoading(false);
    }

    loadGame();
  }, [gameId, user, authLoading, router]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!gameId || !user) return;

    const channel = subscribeToGame(gameId, handleGameAction);
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [gameId, user, handleGameAction]);

  // Send action helper
  const sendAction = useCallback(
    async (type: string, payload: Record<string, unknown>) => {
      if (!channelRef.current || !user) return;

      await sendGameAction(channelRef.current, {
        type,
        playerId: user.id,
        payload,
      });
    },
    [user]
  );

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--foreground-muted)]">Loading game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/game-finder")}
            className="btn-primary px-6 py-2 rounded-lg"
          >
            Back to Game Finder
          </button>
        </div>
      </div>
    );
  }

  // Sort players by relative position
  const sortedPlayers = [...players].sort((a, b) => {
    const posA = getRelativePosition(a.position);
    const posB = getRelativePosition(b.position);
    const order = { bottom: 0, right: 1, top: 2, left: 3 };
    return order[posA] - order[posB];
  });

  const topPlayer = sortedPlayers.find(
    (p) => getRelativePosition(p.position) === "top"
  );
  const leftPlayer = sortedPlayers.find(
    (p) => getRelativePosition(p.position) === "left"
  );
  const rightPlayer = sortedPlayers.find(
    (p) => getRelativePosition(p.position) === "right"
  );
  const bottomPlayer = sortedPlayers.find(
    (p) => getRelativePosition(p.position) === "bottom"
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Game Header */}
      <div className="h-12 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-4">
        <div className="text-sm text-[var(--foreground-muted)]">
          Turn {game?.turnNumber || 1}
        </div>
        <div className="text-sm font-medium text-[var(--foreground)]">
          Commander Stadium
        </div>
        <button
          onClick={() => router.push("/game-finder")}
          className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Leave Game
        </button>
      </div>

      {/* Battlefield Grid */}
      <div className="flex-grow grid grid-rows-[1fr_2fr_1fr] grid-cols-[1fr_2fr_1fr] gap-2 p-2">
        {/* Top-left corner (empty) */}
        <div />

        {/* Top player */}
        <div className="flex items-start justify-center">
          {topPlayer && (
            <PlayerBattlefield
              player={topPlayer}
              gameState={gameState}
              isCurrentPlayer={topPlayer.user_id === user?.id}
              position="top"
            />
          )}
        </div>

        {/* Top-right corner (empty) */}
        <div />

        {/* Left player */}
        <div className="flex items-center justify-start">
          {leftPlayer && (
            <PlayerBattlefield
              player={leftPlayer}
              gameState={gameState}
              isCurrentPlayer={leftPlayer.user_id === user?.id}
              position="left"
            />
          )}
        </div>

        {/* Center battlefield */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-xl border border-emerald-700/30 flex items-center justify-center">
          <span className="text-emerald-600/50 text-lg font-medium">
            Shared Battlefield
          </span>
        </div>

        {/* Right player */}
        <div className="flex items-center justify-end">
          {rightPlayer && (
            <PlayerBattlefield
              player={rightPlayer}
              gameState={gameState}
              isCurrentPlayer={rightPlayer.user_id === user?.id}
              position="right"
            />
          )}
        </div>

        {/* Bottom-left corner (empty) */}
        <div />

        {/* Bottom player (current player) */}
        <div className="flex items-end justify-center">
          {bottomPlayer && (
            <PlayerBattlefield
              player={bottomPlayer}
              gameState={gameState}
              isCurrentPlayer={bottomPlayer.user_id === user?.id}
              position="bottom"
            />
          )}
        </div>

        {/* Bottom-right corner (empty) */}
        <div />
      </div>
    </div>
  );
}

// ============================================
// Icons
// ============================================

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
    </svg>
  );
}
