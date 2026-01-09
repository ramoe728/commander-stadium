"use client";

import { GameCard, Game } from "./GameCard";

interface GamesListProps {
  title: string;
  games: Game[];
  emptyMessage: string;
  onJoinGame: (gameId: string) => void;
}

/**
 * List of games with title and empty state.
 * Reusable for both public games and friends' games.
 */
export function GamesList({
  title,
  games,
  emptyMessage,
  onJoinGame,
}: GamesListProps) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold mb-4">
        {title}
      </h2>

      {games.length === 0 ? (
        <div className="feature-card rounded-xl p-8 text-center">
          <p className="text-[var(--foreground-muted)]">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onJoin={onJoinGame} />
          ))}
        </div>
      )}
    </div>
  );
}

