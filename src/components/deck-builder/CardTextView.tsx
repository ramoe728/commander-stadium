"use client";

import { useState } from "react";
import { Card, CategoryMode, SortMode, groupCards, sortCards, filterCards } from "./types";

interface CardTextViewProps {
  cards: Card[];
  categoryMode: CategoryMode;
  sortMode: SortMode;
  searchQuery: string;
}

/**
 * Moxfield-style text list view with card preview.
 * Cards are displayed as a text list with a large preview image on hover.
 */
export function CardTextView({
  cards,
  categoryMode,
  sortMode,
  searchQuery,
}: CardTextViewProps) {
  const [previewCard, setPreviewCard] = useState<Card | null>(
    cards.length > 0 ? cards[0] : null
  );

  const filteredCards = filterCards(cards, searchQuery);
  const groupedCards = groupCards(filteredCards, categoryMode);

  // Sort the groups
  const sortedGroups = Array.from(groupedCards.entries())
    .map(([key, groupCards]) => ({
      key,
      cards: sortCards(groupCards, sortMode),
    }))
    .sort((a, b) => {
      if (categoryMode === "mana-value") {
        return parseInt(a.key) - parseInt(b.key);
      }
      return a.key.localeCompare(b.key);
    });

  if (filteredCards.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--foreground-muted)]">
        {searchQuery ? "No cards match your search." : "No cards in this deck yet."}
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Card preview panel (sticky) */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          {previewCard ? (
            <div className="rounded-xl overflow-hidden border border-[var(--border)] shadow-xl">
              <img
                src={previewCard.imageUrl}
                alt={previewCard.name}
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="aspect-[488/680] bg-[var(--surface)] rounded-xl border border-[var(--border)] flex items-center justify-center">
              <span className="text-[var(--foreground-muted)] text-sm">
                Hover over a card
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Text list columns */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {sortedGroups.map(({ key, cards: groupCards }) => (
          <CardTextColumn
            key={key}
            groupKey={key}
            categoryMode={categoryMode}
            cards={groupCards}
            cardCount={groupCards.reduce((sum, c) => sum + c.quantity, 0)}
            onCardHover={setPreviewCard}
          />
        ))}
      </div>
    </div>
  );
}

interface CardTextColumnProps {
  groupKey: string;
  categoryMode: CategoryMode;
  cards: Card[];
  cardCount: number;
  onCardHover: (card: Card) => void;
}

function CardTextColumn({ groupKey, categoryMode, cards, cardCount, onCardHover }: CardTextColumnProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--background-secondary)]">
        <ColumnHeader groupKey={groupKey} categoryMode={categoryMode} />
        <span className="text-xs text-[var(--foreground-muted)] bg-[var(--surface)] px-2 py-0.5 rounded-full">
          {cardCount}
        </span>
      </div>

      {/* Card list */}
      <div className="divide-y divide-[var(--border)]">
        {cards.map((card) => (
          <CardTextItem key={card.id} card={card} onHover={() => onCardHover(card)} />
        ))}
      </div>
    </div>
  );
}

interface CardTextItemProps {
  card: Card;
  onHover: () => void;
}

function CardTextItem({ card, onHover }: CardTextItemProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
      onMouseEnter={onHover}
    >
      {/* Quantity */}
      <span className="text-sm text-[var(--foreground-muted)] w-4 text-right">
        {card.quantity}
      </span>

      {/* Card name */}
      <span className="flex-grow text-sm text-[var(--foreground)] truncate">
        {card.name}
      </span>

      {/* Mana cost */}
      <ManaCost manaCost={card.manaCost} />
    </div>
  );
}

interface ManaCostProps {
  manaCost: string;
}

/**
 * Renders mana cost symbols from a string like "{2}{W}{U}".
 */
function ManaCost({ manaCost }: ManaCostProps) {
  if (!manaCost) return null;

  // Parse mana symbols from the cost string
  const symbols = manaCost.match(/\{[^}]+\}/g) || [];

  return (
    <div className="flex items-center gap-0.5">
      {symbols.map((symbol, index) => (
        <ManaSymbol key={index} symbol={symbol} />
      ))}
    </div>
  );
}

function ManaSymbol({ symbol }: { symbol: string }) {
  // Extract the symbol content (e.g., "W" from "{W}")
  const content = symbol.slice(1, -1);

  // Map symbols to image paths
  const symbolMap: Record<string, string> = {
    W: "/assets/mana-w.png",
    U: "/assets/mana-u.png",
    B: "/assets/mana-b.png",
    R: "/assets/mana-r.png",
    G: "/assets/mana-g.png",
    C: "/assets/mana-c.png",
  };

  // Check if it's a colored mana symbol
  if (symbolMap[content]) {
    return (
      <img
        src={symbolMap[content]}
        alt={content}
        className="w-4 h-4 rounded-full"
      />
    );
  }

  // Generic/numeric mana symbol
  return (
    <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-[10px] font-bold text-gray-900">
      {content}
    </div>
  );
}

/**
 * Renders the column header - uses mana value images when grouped by mana value.
 */
function ColumnHeader({ groupKey, categoryMode }: { groupKey: string; categoryMode: CategoryMode }) {
  if (categoryMode === "mana-value") {
    // Use mana value image
    return (
      <img
        src={`/assets/mana-${groupKey}.png`}
        alt={`Mana value ${groupKey}`}
        className="w-3 h-3 rounded-full"
      />
    );
  }

  // Text title for other category modes
  return (
    <h3 className="font-[family-name:var(--font-cinzel)] text-sm font-semibold text-[var(--foreground)]">
      {groupKey}
    </h3>
  );
}
