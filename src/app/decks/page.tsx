"use client";

import { useEffect, useState } from "react";
import { Navigation, Footer } from "@/components/layout";
import { DecksList, NewDeckButton, Deck } from "@/components/decks";
import { getUserDecks, DeckRecord } from "@/lib/decks";
import { useAuth } from "@/hooks";
import Link from "next/link";

/**
 * Converts a DeckRecord from the database to the Deck type for display.
 */
function deckRecordToDisplayDeck(record: DeckRecord): Deck {
  return {
    id: record.id,
    name: record.name,
    commanderName: record.commander_name || undefined,
    commanderImageUrl: record.commander_image_url || undefined,
    commander2Name: record.commander2_name || undefined,
    commander2ImageUrl: record.commander2_image_url || undefined,
    colorIdentity: record.color_identity as Deck["colorIdentity"],
    cardCount: record.card_count,
  };
}

export default function DecksPage() {
  const { user, loading: authLoading } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDecks() {
      if (!user) {
        setLoading(false);
        return;
      }

      const deckRecords = await getUserDecks();
      setDecks(deckRecords.map(deckRecordToDisplayDeck));
      setLoading(false);
    }

    if (!authLoading) {
      loadDecks();
    }
  }, [user, authLoading]);

  // Show sign-in prompt for guests
  if (!authLoading && !user) {
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
              You need to be signed in to view and manage your decks.
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

  return (
    <div className="animated-gradient min-h-screen relative">
      {/* Background effects */}
      <div className="particles absolute inset-0 pointer-events-none opacity-30" />

      <Navigation />

      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold mb-2">
                My Decks
              </h1>
              <p className="text-[var(--foreground-muted)]">
                Manage your Commander deck collection
              </p>
            </div>
            <NewDeckButton />
          </div>

          {/* Loading state */}
          {(loading || authLoading) && (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner className="w-8 h-8 text-[var(--accent-primary)]" />
              <span className="ml-3 text-[var(--foreground-muted)]">
                Loading decks...
              </span>
            </div>
          )}

          {/* Empty state */}
          {!loading && !authLoading && decks.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--surface)] flex items-center justify-center">
                <DeckIcon className="w-8 h-8 text-[var(--foreground-muted)]" />
              </div>
              <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-bold mb-2">
                No Decks Yet
              </h2>
              <p className="text-[var(--foreground-muted)] mb-6">
                Create your first Commander deck to get started.
              </p>
              <NewDeckButton />
            </div>
          )}

          {/* Decks grid */}
          {!loading && !authLoading && decks.length > 0 && (
            <DecksList decks={decks} />
          )}
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

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function DeckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
  );
}
