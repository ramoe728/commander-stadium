"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, ViewMode, CategoryMode, SortMode, validateDeckLegality } from "./types";
import { DeckBuilderToolbar } from "./DeckBuilderToolbar";
import { CardStackView } from "./CardStackView";
import { CardTextView } from "./CardTextView";
import { CardSearch } from "./CardSearch";
import { ArtSelectorModal } from "./ArtSelectorModal";
import { ImportDecklistModal } from "./ImportDecklistModal";
import { createDeck, updateDeck } from "@/lib/decks";

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
  const router = useRouter();
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(deckId);
  const [deckName, setDeckName] = useState(initialDeckName);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [viewMode, setViewMode] = useState<ViewMode>("stacks");
  const [categoryMode, setCategoryMode] = useState<CategoryMode>("mana-value");
  const [sortMode, setSortMode] = useState<SortMode>("mana-value");
  const [searchQuery, setSearchQuery] = useState("");
  const [artSelector, setArtSelector] = useState<ArtSelectorState | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const cardCount = cards.reduce((sum, card) => sum + card.quantity, 0);
  const isComplete = cardCount === 100;
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

  /**
   * Toggles a card's commander status.
   * Up to two cards can be commanders at a time.
   */
  function handleSetCommander(cardId: string) {
    setCards((prevCards) =>
      prevCards.map((c) =>
        c.id === cardId ? { ...c, isCommander: !c.isCommander } : c
      )
    );
  }

  /**
   * Handles bulk import of cards from a decklist.
   */
  function handleImportCards(importedCards: Card[]) {
    setCards((prevCards) => {
      const newCards = [...prevCards];

      for (const importedCard of importedCards) {
        const existingIndex = newCards.findIndex((c) => c.id === importedCard.id);

        if (existingIndex >= 0) {
          // Increment quantity of existing card
          newCards[existingIndex] = {
            ...newCards[existingIndex],
            quantity: newCards[existingIndex].quantity + importedCard.quantity,
          };
        } else {
          // Add new card
          newCards.push(importedCard);
        }
      }

      return newCards;
    });
  }

  /**
   * Saves the deck to Supabase.
   * Creates a new deck if no ID exists, otherwise updates the existing deck.
   */
  async function handleSave() {
    if (isSaving) return;

    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const deckInput = {
        name: deckName || "Untitled Deck",
        cards,
      };

      let result;
      if (currentDeckId) {
        // Update existing deck
        result = await updateDeck(currentDeckId, deckInput);
      } else {
        // Create new deck
        result = await createDeck(deckInput);
        if (result) {
          // Update URL to include the new deck ID
          setCurrentDeckId(result.id);
          router.replace(`/decks/${result.id}`);
        }
      }

      if (result) {
        setSaveStatus("saved");
        // Reset status after 3 seconds
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving deck:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
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
                <div className="relative group">
                  <span className="text-sm text-red-400 flex items-center gap-1 cursor-help">
                    <WarningIcon className="w-4 h-4" />
                    {deckLegality.deckErrors.length + deckLegality.illegalCards.length} issue{(deckLegality.deckErrors.length + deckLegality.illegalCards.length) !== 1 ? 's' : ''}
                  </span>
                  {/* Hover tooltip */}
                  <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
                      Legality Issues
                    </h4>
                    <ul className="space-y-1.5">
                      {deckLegality.deckErrors.map((error, i) => (
                        <li key={`deck-${i}`} className="text-sm text-[var(--foreground)] flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          {error}
                        </li>
                      ))}
                      {deckLegality.illegalCards.map((card) => (
                        <li key={card.cardId} className="text-sm text-[var(--foreground)] flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>
                            <span className="font-medium">{card.cardName}</span>
                            <span className="text-[var(--foreground-muted)]"> — {card.reason}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
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
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary px-4 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] flex items-center gap-2 cursor-pointer"
            title="Import decklist"
          >
            <ImportIcon className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`btn-secondary px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
              saveStatus === "saved"
                ? "text-green-400 border-green-400/50"
                : saveStatus === "error"
                ? "text-red-400 border-red-400/50"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <>
                <LoadingSpinner className="w-4 h-4" />
                Saving...
              </>
            ) : saveStatus === "saved" ? (
              <>
                <CheckIcon className="w-4 h-4" />
                Saved!
              </>
            ) : saveStatus === "error" ? (
              <>
                <WarningIcon className="w-4 h-4" />
                Error
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" />
                Save
              </>
            )}
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
          onSetCommander={handleSetCommander}
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
          onSetCommander={handleSetCommander}
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

      {/* Import decklist modal */}
      {showImportModal && (
        <ImportDecklistModal
          onImport={handleImportCards}
          onClose={() => setShowImportModal(false)}
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

function ImportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
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
