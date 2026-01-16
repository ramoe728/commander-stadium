"use client";

import { use } from "react";
import { Navigation, Footer } from "@/components/layout";
import { DeckBuilder } from "@/components/deck-builder";
import { MOCK_DECK_CARDS } from "@/components/deck-builder/mockCards";

interface DeckBuilderPageProps {
  params: Promise<{ id: string }>;
}

// Mock deck names - will be replaced with real data from Supabase
const MOCK_DECK_NAMES: Record<string, string> = {
  "1": "Atraxa Superfriends",
  "2": "Krenko Goblins",
  "3": "Yuriko Ninjas",
  "4": "Omnath Landfall",
  "5": "Teysa Aristocrats",
};

/**
 * Deck builder page for editing an existing deck.
 * Loads the deck data based on the ID from the URL.
 */
export default function DeckBuilderPage({ params }: DeckBuilderPageProps) {
  const { id } = use(params);

  // In a real app, we would fetch the deck data from Supabase
  const deckName = MOCK_DECK_NAMES[id] || `Deck ${id}`;

  return (
    <div className="animated-gradient min-h-screen relative">
      {/* Background effects */}
      <div className="particles absolute inset-0 pointer-events-none opacity-30" />

      <Navigation />

      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
        <div className="max-w-[1800px] mx-auto">
          <DeckBuilder
            deckId={id}
            initialDeckName={deckName}
            initialCards={MOCK_DECK_CARDS}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
