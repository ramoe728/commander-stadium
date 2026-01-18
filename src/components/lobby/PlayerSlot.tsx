"use client";

import { LobbyPlayerRecord } from "@/lib/lobbies";

interface PlayerSlotProps {
  slot: number;
  player: LobbyPlayerRecord | null;
  isCurrentUser: boolean;
  onKickPlayer?: (playerId: string) => void;
}

/**
 * Displays a single player slot in the lobby.
 * Shows player info if occupied, or an empty slot placeholder.
 */
export function PlayerSlot({ slot, player, isCurrentUser, onKickPlayer }: PlayerSlotProps) {
  if (!player) {
    return (
      <div className="feature-card rounded-xl p-6 border-2 border-dashed border-[var(--border)] opacity-60">
        <div className="flex flex-col items-center justify-center h-48 text-[var(--foreground-muted)]">
          <EmptySlotIcon className="w-12 h-12 mb-3 opacity-50" />
          <span className="text-sm">Waiting for player...</span>
          <span className="text-xs mt-1">Slot {slot}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`feature-card rounded-xl overflow-hidden ${
        isCurrentUser ? "ring-2 ring-[var(--accent-primary)]" : ""
      }`}
    >
      {/* Commander Image */}
      <div className="relative h-32 bg-[var(--surface)]">
        {player.commander_image_url ? (
          <img
            src={player.commander_image_url}
            alt={player.commander_name || "Commander"}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]">
            <NoCommanderIcon className="w-10 h-10 opacity-50" />
          </div>
        )}
        
        {/* Ready badge */}
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
            player.is_ready
              ? "bg-black/70 text-green-400 border border-green-500/50"
              : "bg-black/70 text-amber-400 border border-amber-500/50"
          }`}
        >
          {player.is_ready ? "Ready" : "Not Ready"}
        </div>

        {/* Host badge */}
        {player.is_host && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold bg-black/70 text-[var(--accent-primary)] border border-[var(--accent-primary)]/50">
            Host
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
      </div>

      {/* Player Info */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: player.avatar_color }}
            >
              {player.display_name[0].toUpperCase()}
            </div>
          )}
          
          {/* Name */}
          <div className="flex-grow min-w-0">
            <div className="font-semibold text-[var(--foreground)] truncate flex items-center gap-2">
              {player.display_name}
              {isCurrentUser && (
                <span className="text-xs text-[var(--foreground-muted)]">(You)</span>
              )}
            </div>
            <div className="text-sm text-[var(--foreground-muted)] truncate">
              Slot {slot}
            </div>
          </div>
        </div>

        {/* Deck Info */}
        <div className="bg-[var(--background-secondary)] rounded-lg p-3">
          {player.deck_name ? (
            <div>
              <div className="text-sm font-medium text-[var(--foreground)] truncate">
                {player.deck_name}
              </div>
              {player.commander_name && (
                <div className="text-xs text-[var(--foreground-muted)] truncate mt-1">
                  {player.commander_name}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-[var(--foreground-muted)] italic">
              No deck selected
            </div>
          )}
        </div>

        {/* Kick button (for host, on non-host players) */}
        {onKickPlayer && !player.is_host && !isCurrentUser && (
          <button
            onClick={() => onKickPlayer(player.id)}
            className="mt-3 w-full text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Remove Player
          </button>
        )}
      </div>
    </div>
  );
}

function EmptySlotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

function NoCommanderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
