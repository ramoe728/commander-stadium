"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, ViewMode, CategoryMode, SortMode, validateDeckLegality } from "./types";
import { DeckBuilderToolbar } from "./DeckBuilderToolbar";
import { CardStackView } from "./CardStackView";
import { CardTextView } from "./CardTextView";
import { CardSearch } from "./CardSearch";
import { ArtSelectorModal } from "./ArtSelectorModal";

interface ArtSelectorState {
  cardId: string;
  cardName: string;
}

interface DeckBuilderProps {
  deckId: string | null;
  initialDeckName: string;
  initialCards: Card[];
}

/**
 * Main deck builder component.
 * Supports both stack view (Archidekt-style) and text view (Moxfield-style).
 */
export function DeckBuilder({
  deckId,
  initialDeckName,
  initialCards,
}: DeckBuilderProps) {
  const [deckName, setDeckName] = useState(initialDeckName);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [viewMode, setViewMode] = useState<ViewMode>("stacks");
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("mana-value");
  const [sortMode, setSortMode] = useState<SortMode>("mana-value");
  const [searchQuery, setSearchQuery] = useState("");
  const [artSelector, setArtSelector] = useState<ArtSelectorState | null>(null);

  const cardCount = cards.reduce((sum, card) => sum + card.quantity, 0);
  const isComplete = cardCount >= 100;
  const deckLegality = validateDeckLegality(cards);

  /**
   * Adds a card to the deck. If the card already exists, increments quantity.
   */
  function handleAddCard(newCard: Card) {
    setCards((prevCards) => {
      const existingCard = prevCards.find((c) => c.id === newCard.id);

      if (existingCard) {
        // Increment quantity of existing card
        return prevCards.map((c) =>
          c.id === newCard.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }

      // Add new card to the deck
      return [...prevCards, newCard];
    });
  }

  /**
   * Increments the quantity of a card.
   */
  function handleIncrementCard(cardId: string) {
    setCards((prevCards) =>
      prevCards.map((c) =>
        c.id === cardId ? { ...c, quantity: c.quantity + 1 } : c
      )
    );
  }

  /**
   * Decrements the quantity of a card.
   * If quantity reaches 0, removes the card entirely.
   */
  function handleDecrementCard(cardId: string) {
    setCards((prevCards) =>
      prevCards.flatMap((c) => {
        if (c.id === cardId) {
          if (c.quantity > 1) {
            return { ...c, quantity: c.quantity - 1 };
          }
          // Remove card if quantity would go to 0
          return [];
        }
        return c;
      })
    );
  }

  /**
   * Removes a card from the deck entirely (all copies).
   */
  function handleRemoveCard(cardId: string) {
    setCards((prevCards) => prevCards.filter((c) => c.id !== cardId));
  }

  /**
   * Opens the art selector modal for a card.
   */
  function handleChangeArt(cardId: string, cardName: string) {
    setArtSelector({ cardId, cardName });
  }

  /**
   * Updates the art for a card.
   */
  function handleArtSelected(cardId: string, newImageUrl: string) {
    setCards((prevCards) =>
      prevCards.map((c) =>
        c.id === cardId ? { ...c, imageUrl: newImageUrl } : c
      )
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/decks"
            className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)] transition-colors"
            title="Back to decks"
          >
            <BackIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
          </Link>

          <div>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Deck Name"
              className="bg-transparent font-[family-name:var(--font-cinzel)] text-2xl md:text-3xl font-bold text-[var(--foreground)] border-b border-transparent hover:border-[var(--border)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors"
            />
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`text-sm ${
                  isComplete ? "text-green-400" : "text-amber-400"
                }`}
              >
                {cardCount}/100 cards
              </span>
              {/* Deck legality indicator */}
              {deckLegality.isLegal ? (
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <CheckIcon className="w-4 h-4" />
                  Legal
                </span>
              ) : (
                <span className="text-sm text-red-400 flex items-center gap-1" title={deckLegality.illegalCards.map(c => `${c.cardName}: ${c.reason}`).join('\n')}>
                  <WarningIcon className="w-4 h-4" />
                  {deckLegality.illegalCards.length} violation{deckLegality.illegalCards.length !== 1 ? 's' : ''}
                </span>
              )}
              {deckId && (
                <span className="text-sm text-[var(--foreground-subtle)]">
                  ID: {deckId}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CardSearch onCardAdd={handleAddCard} />
          <button className="btn-secondary px-4 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            <SaveIcon className="w-4 h-4 inline-block mr-2" />
            Save
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <DeckBuilderToolbar
        viewMode={viewMode}
        categoryMode={categoryMode}
        sortMode={sortMode}
        searchQuery={searchQuery}
        onViewModeChange={setViewMode}
        onCategoryModeChange={setCategoryMode}
        onSortModeChange={setSortMode}
        onSearchChange={setSearchQuery}
      />

      {/* Card display */}
      {viewMode === "stacks" ? (
        <CardStackView
          cards={cards}
          categoryMode={categoryMode}
          sortMode={sortMode}
          searchQuery={searchQuery}
          onCardIncrement={handleIncrementCard}
          onCardDecrement={handleDecrementCard}
          onCardRemove={handleRemoveCard}
          onChangeArt={handleChangeArt}
        />
      ) : (
        <CardTextView
          cards={cards}
          categoryMode={categoryMode}
          sortMode={sortMode}
          searchQuery={searchQuery}
          onCardIncrement={handleIncrementCard}
          onCardDecrement={handleDecrementCard}
          onCardRemove={handleRemoveCard}
          onChangeArt={handleChangeArt}
        />
      )}

      {/* Art selector modal */}
      {artSelector && (
        <ArtSelectorModal
          cardId={artSelector.cardId}
          cardName={artSelector.cardName}
          onSelect={handleArtSelected}
          onClose={() => setArtSelector(null)}
        />
      )}
    </div>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

function AddCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}
