"use client";

import { Navigation, Footer } from "@/components/layout";
import { DecksList, NewDeckButton, Deck } from "@/components/decks";

// Mock data for UI development - will be replaced with real data from Supabase
const MOCK_DECKS: Deck[] = [
  {
    id: "1",
    name: "Atraxa Superfriends",
    commanderName: "Atraxa, Praetors' Voice",
    commanderImageUrl:
      "https://cards.scryfall.io/art_crop/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.jpg",
    colorIdentity: ["W", "U", "B", "G"],
    cardCount: 100,
  },
  {
    id: "2",
    name: "Krenko Goblins",
    commanderName: "Krenko, Mob Boss",
    commanderImageUrl:
      "https://cards.scryfall.io/art_crop/front/c/d/cd9fec9d-23c8-4d35-97c1-9499527198fb.jpg",
    colorIdentity: ["R"],
    cardCount: 98,
  },
  {
    id: "3",
    name: "Yuriko Ninjas",
    commanderName: "Yuriko, the Tiger's Shadow",
    commanderImageUrl:
      "https://cards.scryfall.io/art_crop/front/3/b/3bd81ae6-e628-447a-a36b-597e63ede295.jpg",
    colorIdentity: ["U", "B"],
    cardCount: 85,
  },
  {
    id: "4",
    name: "Omnath Landfall",
    commanderName: "Omnath, Locus of Creation",
    commanderImageUrl:
      "https://cards.scryfall.io/art_crop/front/4/e/4e4fb50c-a81f-44d3-93c5-fa9a0b37f617.jpg",
    colorIdentity: ["W", "U", "R", "G"],
    cardCount: 100,
  },
  {
    id: "5",
    name: "Teysa Aristocrats",
    commanderName: "Teysa Karlov",
    commanderImageUrl:
      "https://cards.scryfall.io/art_crop/front/b/c/bcfaa19e-995e-447d-a0a2-46e5d117d5ec.jpg",
    colorIdentity: ["W", "B"],
    cardCount: 72,
  },
];

export default function DecksPage() {
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

          {/* Decks grid */}
          <DecksList decks={MOCK_DECKS} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
