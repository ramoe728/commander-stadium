"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLobby } from "@/hooks/useLobby";

/**
 * Spacer component that adds bottom padding when the lobby bar is visible.
 * Prevents content from being hidden behind the fixed lobby bar.
 */
export function LobbyBarSpacer() {
  const pathname = usePathname();
  const { currentLobby, isLoading } = useLobby();

  // Don't show spacer on lobby pages or when no lobby
  if (pathname?.startsWith("/lobby/") || isLoading || !currentLobby) {
    return null;
  }

  // Height matches the lobby bar height (~60px)
  return <div className="h-16" />;
}

/**
 * Persistent bar at the bottom of the viewport showing current lobby status.
 * Hidden when on the lobby page itself.
 */
export function LobbyBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentLobby, isLoading, leaveLobby, isLeaving } = useLobby();

  // Don't show on lobby pages or while loading
  if (pathname?.startsWith("/lobby/") || isLoading || !currentLobby) {
    return null;
  }

  function handleReturnToLobby() {
    router.push(`/lobby/${currentLobby!.id}`);
  }

  async function handleLeaveLobby() {
    await leaveLobby();
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e] border-t border-[var(--border)] shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Lobby info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-[var(--foreground-muted)]">In Lobby</span>
          </div>
          
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--foreground)] truncate">
              {currentLobby.name}
            </h3>
            <p className="text-xs text-[var(--foreground-muted)]">
              {currentLobby.players.length}/{currentLobby.max_players} players
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleLeaveLobby}
            disabled={isLeaving}
            className="px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLeaving ? "Leaving..." : "Leave"}
          </button>
          <button
            onClick={handleReturnToLobby}
            className="btn-primary px-4 py-1.5 rounded-lg text-sm text-white font-medium cursor-pointer"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
