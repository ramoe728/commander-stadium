"use client";

import Link from "next/link";

export interface Deck {
  id: string;
  name: string;
  commanderName: string;
  commanderImageUrl: string;
  colorIdentity: ("W" | "U" | "B" | "R" | "G")[];
  cardCount: number;
}

interface DeckCardProps {
  deck: Deck;
}

/**
 * Card displaying a single deck in the decks list.
 * Shows commander image, deck name, color identity, and card count.
 */
export function DeckCard({ deck }: DeckCardProps) {
  const isComplete = deck.cardCount >= 100;

  return (
    <Link
      href={`/decks/${deck.id}`}
      className="feature-card rounded-xl overflow-hidden group cursor-pointer block"
    >
      {/* Commander image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={deck.commanderImageUrl}
          alt={deck.commanderName}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
        
        {/* Card count badge */}
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${
            isComplete
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          }`}
        >
          {deck.cardCount}/100
        </div>
      </div>

      {/* Deck info */}
      <div className="p-4">
        {/* Color identity pips */}
        <div className="flex items-center gap-1.5 mb-2">
          {deck.colorIdentity.length === 0 ? (
            <ColorPip color="C" />
          ) : (
            deck.colorIdentity.map((color) => (
              <ColorPip key={color} color={color} />
            ))
          )}
        </div>

        {/* Deck name */}
        <h3 className="font-[family-name:var(--font-cinzel)] font-semibold text-lg text-[var(--foreground)] truncate mb-1 group-hover:text-[var(--accent-primary)] transition-colors">
          {deck.name}
        </h3>

        {/* Commander name */}
        <p className="text-sm text-[var(--foreground-muted)] truncate">
          {deck.commanderName}
        </p>
      </div>
    </Link>
  );
}

/**
 * Single mana color pip indicator using official mana symbols.
 */
function ColorPip({ color }: { color: "W" | "U" | "B" | "R" | "G" | "C" }) {
  const colorToImage: Record<string, string> = {
    W: "/assets/mana-w.png",
    U: "/assets/mana-u.png",
    B: "/assets/mana-b.png",
    R: "/assets/mana-r.png",
    G: "/assets/mana-g.png",
    C: "/assets/mana-c.png",
  };

  const colorNames: Record<string, string> = {
    W: "White",
    U: "Blue",
    B: "Black",
    R: "Red",
    G: "Green",
    C: "Colorless",
  };

  return (
    <img
      src={colorToImage[color]}
      alt={colorNames[color]}
      title={colorNames[color]}
      className="w-5 h-5 rounded-full shadow-sm"
    />
  );
}
