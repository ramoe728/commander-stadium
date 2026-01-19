"use client";

import { Navigation, Footer } from "@/components/layout";
import { DeckBuilder } from "@/components/deck-builder";

/**
 * New deck builder page.
 * Creates a blank deck for the user to populate.
 */
export default function NewDeckPage() {
  return (
    <div className="animated-gradient min-h-screen relative">
      {/* Background effects */}
      <div className="particles absolute inset-0 pointer-events-none opacity-30" />

      <Navigation />

      <main className="relative z-10 px-6 py-8 md:px-12 lg:px-20">
        <div className="max-w-[1800px] mx-auto">
          <DeckBuilder
            deckId={null}
            initialDeckName="New Deck"
            initialCards={[]}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
