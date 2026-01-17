"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Footer } from "@/components/layout";
import { DeckBuilder } from "@/components/deck-builder";
import { Card } from "@/components/deck-builder/types";
import { getDeck, deckRecordToCards, DeckRecord } from "@/lib/decks";
import { useAuth } from "@/hooks";
import Link from "next/link";

interface DeckBuilderPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Deck builder page for editing an existing deck.
 * Loads the deck data based on the ID from the URL.
 */
export default function DeckBuilderPage({ params }: DeckBuilderPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [deck, setDeck] = useState<DeckRecord | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadDeck() {
      if (!user) {
        setLoading(false);
        return;
      }

      const deckRecord = await getDeck(id);

      if (!deckRecord) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setDeck(deckRecord);
      setCards(deckRecordToCards(deckRecord));
      setLoading(false);
    }

    if (!authLoading) {
      loadDeck();
    }
  }, [id, user, authLoading]);

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
              You need to be signed in to edit decks.
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

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="animated-gradient min-h-screen relative">
        <div className="particles absolute inset-0 pointer-events-none opacity-30" />
        <Navigation />

        <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
          <div className="max-w-7xl mx-auto flex items-center justify-center py-16">
            <LoadingSpinner className="w-8 h-8 text-[var(--accent-primary)]" />
            <span className="ml-3 text-[var(--foreground-muted)]">
              Loading deck...
            </span>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Not found state
  if (notFound) {
    return (
      <div className="animated-gradient min-h-screen relative">
        <div className="particles absolute inset-0 pointer-events-none opacity-30" />
        <Navigation />

        <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <WarningIcon className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="font-[family-name:var(--font-cinzel)] text-3xl md:text-4xl font-bold mb-4">
              Deck Not Found
            </h1>
            <p className="text-[var(--foreground-muted)] mb-8">
              This deck doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Link
              href="/decks"
              className="btn-secondary px-8 py-3 rounded-xl font-medium inline-block"
            >
              Back to My Decks
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
        <div className="max-w-[1800px] mx-auto">
          <DeckBuilder
            deckId={id}
            initialDeckName={deck?.name || ""}
            initialCards={cards}
          />
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

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}
