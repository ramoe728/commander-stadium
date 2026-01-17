"use client";

import { useState, useEffect, useRef } from "react";
import {
  fetchCardAutocomplete,
  fetchCardByName,
  getCardImageUrl,
  parseCardType,
  allowsMultipleCopies,
  ScryfallCard,
} from "@/lib/scryfall";
import { Card, CardType } from "./types";

interface CardSearchProps {
  onCardAdd: (card: Card) => void;
}

/**
 * Card search component with Scryfall autocomplete integration.
 * Users can search for cards and add them to the deck.
 */
export function CardSearch({ onCardAdd }: CardSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [previewCard, setPreviewCard] = useState<ScryfallCard | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      const results = await fetchCardAutocomplete(query);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
      setIsLoading(false);
    }, 200); // 200ms debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectCard(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }

  // Fetch card preview on hover
  async function handleSuggestionHover(cardName: string) {
    const card = await fetchCardByName(cardName);
    if (card) {
      setPreviewCard(card);
    }
  }

  // Handle card selection
  async function handleSelectCard(cardName: string) {
    setIsLoading(true);
    const scryfallCard = await fetchCardByName(cardName);

    if (scryfallCard) {
      const newCard: Card = {
        id: scryfallCard.id,
        name: scryfallCard.name,
        imageUrl: getCardImageUrl(scryfallCard), // Uses PNG format for clean corners
        manaValue: Math.floor(scryfallCard.cmc),
        manaCost: scryfallCard.mana_cost || "",
        type: parseCardType(scryfallCard.type_line) as CardType,
        tags: [],
        quantity: 1,
        allowsMultipleCopies: allowsMultipleCopies(scryfallCard),
      };

      onCardAdd(newCard);

      // Reset search
      setQuery("");
      setSuggestions([]);
      setIsOpen(false);
      setPreviewCard(null);
      inputRef.current?.focus();
    }

    setIsLoading(false);
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search cards to add..."
          className="w-64 pl-9 pr-4 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent-primary)]"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner />
          </div>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 w-96 max-h-80 overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl z-50 flex"
        >
          {/* Suggestions list */}
          <div className="flex-grow overflow-y-auto">
            {suggestions.map((cardName, index) => (
              <button
                key={cardName}
                onClick={() => handleSelectCard(cardName)}
                onMouseEnter={() => {
                  setSelectedIndex(index);
                  handleSuggestionHover(cardName);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-[var(--accent-primary)]/20 text-[var(--foreground)]"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--surface)]"
                }`}
              >
                {cardName}
              </button>
            ))}
          </div>

          {/* Card preview */}
          {previewCard && (
            <div className="w-48 flex-shrink-0 p-2 border-l border-[var(--border)] bg-[var(--surface)]">
              <img
                src={getCardImageUrl(previewCard)}
                alt={previewCard.name}
                className="w-full h-auto rounded"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-[var(--foreground-muted)] border-t-transparent rounded-full animate-spin" />
  );
}
