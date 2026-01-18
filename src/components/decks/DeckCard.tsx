"use client";

import Link from "next/link";

export interface Deck {
  id: string;
  name: string;
  commanderName?: string;
  commanderImageUrl?: string;
  commander2Name?: string;
  commander2ImageUrl?: string;
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
      {/* Commander image(s) */}
      <div className="relative h-48 overflow-hidden">
        {deck.commander2ImageUrl ? (
          // Two commanders - split view (left half of first, right half of second)
          <div className="w-full h-full flex">
            <div className="w-1/2 h-full overflow-hidden relative">
              <img
                src={deck.commanderImageUrl}
                alt={deck.commanderName}
                className="absolute top-0 left-0 w-[200%] h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="w-1/2 h-full overflow-hidden relative">
              <img
                src={deck.commander2ImageUrl}
                alt={deck.commander2Name}
                className="absolute top-0 right-0 w-[200%] h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        ) : deck.commanderImageUrl ? (
          // Single commander
          <img
            src={deck.commanderImageUrl}
            alt={deck.commanderName}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // No commander - placeholder
          <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center">
            <span className="text-[var(--foreground-muted)] text-sm">No Commander</span>
          </div>
        )}
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
        
        {/* Card count badge */}
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${
            isComplete
              ? "bg-black/70 text-green-400 border border-green-500/50"
              : "bg-black/70 text-amber-400 border border-amber-500/50"
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

        {/* Commander name(s) */}
        <p className="text-sm text-[var(--foreground-muted)] truncate">
          {deck.commander2Name
            ? `${deck.commanderName} & ${deck.commander2Name}`
            : deck.commanderName || "No Commander"}
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
