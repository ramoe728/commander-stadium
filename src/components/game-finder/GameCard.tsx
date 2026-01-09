"use client";

import { useState } from "react";
import { RulesModal } from "./RulesModal";

export interface Game {
  id: string;
  name: string;
  hostName: string;
  currentPlayers: number;
  maxPlayers: number;
  rules: string;
  hasPassword: boolean;
}

interface GameCardProps {
  game: Game;
  onJoin: (gameId: string) => void;
}

/**
 * Card displaying a single game in the game finder.
 * Shows game info with rules modal and join button.
 */
export function GameCard({ game, onJoin }: GameCardProps) {
  const [showRules, setShowRules] = useState(false);
  const isFull = game.currentPlayers >= game.maxPlayers;

  return (
    <>
      <div className="feature-card rounded-xl p-4 flex items-center gap-4">
        {/* Player count indicator */}
        <div className="flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
              isFull
                ? "bg-red-500/10 text-red-400"
                : "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
            }`}
          >
            <span className="text-lg font-bold">
              {game.currentPlayers}/{game.maxPlayers}
            </span>
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              Players
            </span>
          </div>
        </div>

        {/* Game info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[var(--foreground)] truncate">
              {game.name}
            </h3>
            {game.hasPassword && (
              <LockIcon className="w-4 h-4 text-[var(--foreground-muted)] flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-[var(--foreground-muted)] truncate">
            Hosted by {game.hostName}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Rules button */}
          <button
            onClick={() => setShowRules(true)}
            className="w-10 h-10 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors"
            title="View rules"
          >
            <RulesIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
          </button>

          {/* Join button */}
          <button
            onClick={() => onJoin(game.id)}
            disabled={isFull}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isFull
                ? "bg-[var(--surface)] text-[var(--foreground-subtle)] cursor-not-allowed"
                : "btn-primary text-white"
            }`}
          >
            {isFull ? "Full" : "Join"}
          </button>
        </div>
      </div>

      <RulesModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        gameName={game.name}
        rules={game.rules}
      />
    </>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function RulesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
}

