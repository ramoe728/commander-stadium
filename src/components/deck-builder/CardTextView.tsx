"use client";

import { useState } from "react";
import { Card, CategoryMode, SortMode, groupCards, sortCards, filterCards, isCardIllegal } from "./types";
import { CardContextMenu } from "./CardContextMenu";

interface ContextMenuState {
  x: number;
  y: number;
  cardId: string;
  cardName: string;
  quantity: number;
}

interface CardTextViewProps {
  cards: Card[];
  categoryMode: CategoryMode;
  sortMode: SortMode;
  searchQuery: string;
  onCardIncrement?: (cardId: string) => void;
  onCardDecrement?: (cardId: string) => void;
  onCardRemove?: (cardId: string) => void;
  onChangeArt?: (cardId: string, cardName: string) => void;
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
  onCardIncrement,
  onCardDecrement,
  onCardRemove,
  onChangeArt,
}: CardTextViewProps) {
  const [previewCard, setPreviewCard] = useState<Card | null>(
    cards.length > 0 ? cards[0] : null
  );
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

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

  function handleContextMenu(e: React.MouseEvent, card: Card) {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      cardId: card.id,
      cardName: card.name,
      quantity: card.quantity,
    });
  }

  function handleIncrement(cardId: string) {
    onCardIncrement?.(cardId);
  }

  function handleDecrement(cardId: string) {
    onCardDecrement?.(cardId);
  }

  function handleDelete(cardId: string) {
    onCardRemove?.(cardId);
  }

  function handleChangeArt(cardId: string, cardName: string) {
    onChangeArt?.(cardId, cardName);
  }

  if (filteredCards.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--foreground-muted)]">
        {searchQuery ? "No cards match your search." : "No cards in this deck yet."}
      </div>
    );
  }

  return (
    <>
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
              onContextMenu={handleContextMenu}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          ))}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <CardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          cardId={contextMenu.cardId}
          cardName={contextMenu.cardName}
          quantity={contextMenu.quantity}
          onDelete={handleDelete}
          onChangeArt={handleChangeArt}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

interface CardTextColumnProps {
  groupKey: string;
  categoryMode: CategoryMode;
  cards: Card[];
  cardCount: number;
  onCardHover: (card: Card) => void;
  onContextMenu: (e: React.MouseEvent, card: Card) => void;
  onIncrement: (cardId: string) => void;
  onDecrement: (cardId: string) => void;
}

function CardTextColumn({ groupKey, categoryMode, cards, cardCount, onCardHover, onContextMenu, onIncrement, onDecrement }: CardTextColumnProps) {
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
          <CardTextItem 
            key={card.id} 
            card={card}
            isIllegal={isCardIllegal(card)}
            showQuantityControls={card.allowsMultipleCopies || card.quantity > 1}
            onHover={() => onCardHover(card)} 
            onContextMenu={(e) => onContextMenu(e, card)}
            onIncrement={() => onIncrement(card.id)}
            onDecrement={() => onDecrement(card.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface CardTextItemProps {
  card: Card;
  isIllegal: boolean;
  showQuantityControls: boolean;
  onHover: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

function CardTextItem({ card, isIllegal, showQuantityControls, onHover, onContextMenu, onIncrement, onDecrement }: CardTextItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
        isIllegal
          ? "bg-red-500/10 hover:bg-red-500/20 border-l-2 border-red-500"
          : "hover:bg-[var(--surface-hover)]"
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={onContextMenu}
    >
      {/* Quantity with +/- controls */}
      <div className="flex items-center gap-1">
        {showQuantityControls && isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDecrement();
            }}
            disabled={card.quantity <= 1}
            className={`w-5 h-5 flex items-center justify-center rounded text-xs transition-colors ${
              card.quantity <= 1
                ? "text-[var(--foreground-subtle)] cursor-not-allowed"
                : "text-red-400 hover:bg-red-500/20 hover:text-red-300"
            }`}
            title="Remove copy"
          >
            <MinusIcon className="w-3 h-3" />
          </button>
        )}
        <span className={`text-sm w-4 text-center ${isIllegal ? "text-red-400 font-bold" : "text-[var(--foreground-muted)]"}`}>
          {card.quantity}
        </span>
        {showQuantityControls && isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIncrement();
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-xs text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-colors"
            title="Add copy"
          >
            <PlusIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Card name */}
      <span className={`flex-grow text-sm truncate ${isIllegal ? "text-red-400" : "text-[var(--foreground)]"}`}>
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  );
}
