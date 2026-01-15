"use client";

import { DeckCard, Deck } from "./DeckCard";

interface DecksListProps {
  decks: Deck[];
}

/**
 * Grid list of deck cards.
 * Shows empty state when no decks exist.
 */
export function DecksList({ decks }: DecksListProps) {
  if (decks.length === 0) {
    return (
      <div className="feature-card rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center">
          <EmptyDeckIcon className="w-8 h-8 text-[var(--accent-primary)]" />
        </div>
        <h3 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold mb-2">
          No Decks Yet
        </h3>
        <p className="text-[var(--foreground-muted)] max-w-sm mx-auto">
          Create your first deck to start building your Commander collection.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} />
      ))}
    </div>
  );
}

function EmptyDeckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122"
      />
    </svg>
  );
}
