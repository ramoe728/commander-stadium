"use client";

import { useState, useEffect } from "react";
import { getUserDecks, DeckRecord } from "@/lib/decks";

interface DeckSelectorProps {
  selectedDeckId: string | null;
  onSelectDeck: (deck: DeckRecord | null) => void;
}

/**
 * Dropdown to select a deck for the game.
 */
export function DeckSelector({ selectedDeckId, onSelectDeck }: DeckSelectorProps) {
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadDecks() {
      setLoading(true);
      const userDecks = await getUserDecks();
      setDecks(userDecks);
      setLoading(false);
    }
    loadDecks();
  }, []);

  const selectedDeck = decks.find((d) => d.id === selectedDeckId);

  if (loading) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 animate-pulse">
        <div className="h-5 w-32 bg-[var(--background-secondary)] rounded" />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)] rounded-lg px-4 py-3 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <DeckIcon className="w-5 h-5 text-[var(--foreground-muted)] flex-shrink-0" />
          {selectedDeck ? (
            <div className="min-w-0">
              <div className="font-medium text-[var(--foreground)] truncate">
                {selectedDeck.name}
              </div>
              {selectedDeck.commander_name && (
                <div className="text-xs text-[var(--foreground-muted)] truncate">
                  {selectedDeck.commander_name}
                </div>
              )}
            </div>
          ) : (
            <span className="text-[var(--foreground-muted)]">Select a deck...</span>
          )}
        </div>
        <ChevronIcon className={`w-5 h-5 text-[var(--foreground-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#1a1a2e] border border-[var(--border)] rounded-lg shadow-2xl max-h-80 overflow-y-auto">
          {decks.length === 0 ? (
            <div className="px-4 py-8 text-center text-[var(--foreground-muted)]">
              <p className="mb-2">No decks available</p>
              <p className="text-sm">Create a deck first to use it in games.</p>
            </div>
          ) : (
            <div className="py-1">
              {/* Clear selection option */}
              <button
                onClick={() => {
                  onSelectDeck(null);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-[var(--surface)] transition-colors cursor-pointer text-[var(--foreground-muted)]"
              >
                No deck selected
              </button>
              
              <hr className="border-[var(--border)] my-1" />
              
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => {
                    onSelectDeck(deck);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-[var(--surface)] transition-colors cursor-pointer ${
                    deck.id === selectedDeckId ? "bg-[var(--accent-primary)]/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {deck.commander_image_url ? (
                      <img
                        src={deck.commander_image_url}
                        alt={deck.commander_name || deck.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-[var(--background-secondary)] flex items-center justify-center">
                        <DeckIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-grow">
                      <div className="font-medium text-[var(--foreground)] truncate">
                        {deck.name}
                      </div>
                      <div className="text-xs text-[var(--foreground-muted)] flex items-center gap-2">
                        {deck.commander_name && (
                          <span className="truncate">{deck.commander_name}</span>
                        )}
                        <span className={deck.card_count === 100 ? "text-green-400" : "text-amber-400"}>
                          {deck.card_count}/100
                        </span>
                      </div>
                    </div>
                    {deck.id === selectedDeckId && (
                      <CheckIcon className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

function DeckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
