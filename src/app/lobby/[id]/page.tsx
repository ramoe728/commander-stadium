"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Footer } from "@/components/layout";
import { Lobby } from "@/components/lobby";
import { getLobby, LobbyWithPlayers, joinLobby } from "@/lib/lobbies";
import { useAuth } from "@/hooks";
import Link from "next/link";

interface LobbyPageProps {
  params: Promise<{ id: string }>;
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const { id: lobbyId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [lobby, setLobby] = useState<LobbyWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Load lobby data
  useEffect(() => {
    async function loadLobby() {
      setLoading(true);
      setError(null);

      const lobbyData = await getLobby(lobbyId);
      
      if (!lobbyData) {
        setError("Lobby not found");
        setLoading(false);
        return;
      }

      if (lobbyData.status !== "waiting") {
        if (lobbyData.status === "in_game") {
          router.push(`/game/${lobbyId}`);
          return;
        }
        setError("This lobby is no longer active");
        setLoading(false);
        return;
      }

      setLobby(lobbyData);
      setLoading(false);
    }

    if (!authLoading) {
      loadLobby();
    }
  }, [lobbyId, authLoading, router]);

  // Auto-join lobby if user is not already in it
  useEffect(() => {
    async function autoJoin() {
      if (!lobby || !user || joining) return;

      const isInLobby = lobby.players.some((p) => p.user_id === user.id);
      if (isInLobby) return;

      // Check if lobby is full
      if (lobby.players.length >= lobby.max_players) {
        setError("This lobby is full");
        return;
      }

      setJoining(true);
      const result = await joinLobby({
        lobbyId: lobby.id,
        displayName: user.email?.split("@")[0] || "Player",
      });

      if (result) {
        // Refresh lobby data
        const updatedLobby = await getLobby(lobbyId);
        if (updatedLobby) {
          setLobby(updatedLobby);
        }
      } else {
        setError("Failed to join lobby");
      }
      setJoining(false);
    }

    autoJoin();
  }, [lobby, user, lobbyId, joining]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="animated-gradient min-h-screen relative">
        <div className="particles absolute inset-0 pointer-events-none opacity-30" />
        <Navigation />
        <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner className="w-8 h-8 text-[var(--accent-primary)]" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error || !lobby) {
    return (
      <div className="animated-gradient min-h-screen relative">
        <div className="particles absolute inset-0 pointer-events-none opacity-30" />
        <Navigation />
        <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <ErrorIcon className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold mb-4">
              {error || "Lobby Not Found"}
            </h1>
            <p className="text-[var(--foreground-muted)] mb-8">
              {error === "This lobby is full"
                ? "This lobby has reached its maximum player count."
                : "The lobby you're looking for doesn't exist or is no longer available."}
            </p>
            <Link
              href="/game-finder"
              className="btn-primary px-8 py-3 rounded-xl text-white font-medium inline-block"
            >
              Back to Game Finder
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="animated-gradient min-h-screen relative">
        <div className="particles absolute inset-0 pointer-events-none opacity-30" />
        <Navigation />
        <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
              <LockIcon className="w-8 h-8 text-[var(--accent-primary)]" />
            </div>
            <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold mb-4">
              Sign In Required
            </h1>
            <p className="text-[var(--foreground-muted)] mb-8">
              You need to be signed in to join game lobbies.
            </p>
            <Link
              href="/login"
              className="btn-primary px-8 py-3 rounded-xl text-white font-medium inline-block"
            >
              Sign In
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show joining state
  if (joining) {
    return (
      <div className="animated-gradient min-h-screen relative">
        <div className="particles absolute inset-0 pointer-events-none opacity-30" />
        <Navigation />
        <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <LoadingSpinner className="w-8 h-8 text-[var(--accent-primary)]" />
              <span className="text-[var(--foreground-muted)]">Joining lobby...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="animated-gradient min-h-screen relative">
      {/* Background effects */}
      <div className="particles absolute inset-0 pointer-events-none opacity-30" />

      <Navigation />

      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <Lobby lobbyId={lobbyId} initialLobby={lobby} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
