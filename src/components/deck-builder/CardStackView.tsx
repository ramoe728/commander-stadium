"use client";

import { useState } from "react";
import { Card, CategoryMode, SortMode, groupCards, sortCards, filterCards } from "./types";
import { CardContextMenu } from "./CardContextMenu";

interface ContextMenuState {
  x: number;
  y: number;
  cardId: string;
  cardName: string;
}

interface CardStackViewProps {
  cards: Card[];
  categoryMode: CategoryMode;
  sortMode: SortMode;
  searchQuery: string;
  onCardRemove?: (cardId: string) => void;
  onChangeArt?: (cardId: string, cardName: string) => void;
}

/**
 * Archidekt-style stacked card view.
 * Cards are displayed in columns by category, with overlapping images.
 * Hovering over a card pushes cards below it down to reveal the full image.
 */
export function CardStackView({
  cards,
  categoryMode,
  sortMode,
  searchQuery,
  onCardRemove,
  onChangeArt,
}: CardStackViewProps) {
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
      // Sort group keys
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
    });
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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedGroups.map(({ key, cards: groupCards }) => (
          <CardStackColumn
            key={key}
            groupKey={key}
            categoryMode={categoryMode}
            cards={groupCards}
            cardCount={groupCards.reduce((sum, c) => sum + c.quantity, 0)}
            onContextMenu={handleContextMenu}
            onArtClick={handleChangeArt}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <CardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          cardId={contextMenu.cardId}
          cardName={contextMenu.cardName}
          onDelete={handleDelete}
          onChangeArt={handleChangeArt}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

interface CardStackColumnProps {
  groupKey: string;
  categoryMode: CategoryMode;
  cards: Card[];
  cardCount: number;
  onContextMenu: (e: React.MouseEvent, card: Card) => void;
  onArtClick: (cardId: string, cardName: string) => void;
}

function CardStackColumn({ groupKey, categoryMode, cards, cardCount, onContextMenu, onArtClick }: CardStackColumnProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate the height of the stack container
  // Each card shows ~28px when stacked, plus the full height of the last card (~260px for MTG card ratio)
  const baseOffset = 28;
  const cardHeight = 260;
  const baseHeight = (cards.length - 1) * baseOffset + cardHeight;
  // When hovering, we need extra space for the expanded card
  const expandedExtra = hoveredIndex !== null && hoveredIndex < cards.length - 1 ? cardHeight - baseOffset : 0;
  const containerHeight = baseHeight + expandedExtra;

  return (
    <div className="flex-shrink-0 w-48">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <ColumnHeader groupKey={groupKey} categoryMode={categoryMode} />
        <span className="text-xs text-[var(--foreground-muted)] bg-[var(--surface)] px-2 py-0.5 rounded-full">
          {cardCount}
        </span>
      </div>

      {/* Card stack */}
      <div 
        className="relative transition-all duration-200"
        style={{ height: `${containerHeight}px` }}
      >
        {cards.map((card, index) => (
          <CardStackItem
            key={card.id}
            card={card}
            index={index}
            isHovered={hoveredIndex === index}
            hoveredIndex={hoveredIndex}
            totalCards={cards.length}
            onHover={() => setHoveredIndex(index)}
            onLeave={() => setHoveredIndex(null)}
            onContextMenu={(e) => onContextMenu(e, card)}
            onArtClick={() => onArtClick(card.id, card.name)}
          />
        ))}
      </div>
    </div>
  );
}

interface CardStackItemProps {
  card: Card;
  index: number;
  isHovered: boolean;
  hoveredIndex: number | null;
  totalCards: number;
  onHover: () => void;
  onLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onArtClick: () => void;
}

function CardStackItem({
  card,
  index,
  isHovered,
  hoveredIndex,
  onHover,
  onLeave,
  onContextMenu,
  onArtClick,
}: CardStackItemProps) {
  // Calculate the vertical offset for this card
  // Cards stack with ~28px visible per card, but when a card above is hovered,
  // cards below shift down to reveal the hovered card
  const baseOffset = 28;
  const expandedOffset = 140; // Height of card when fully revealed

  let topOffset = index * baseOffset;

  // If a card above this one is hovered, push this card down
  if (hoveredIndex !== null && hoveredIndex < index) {
    topOffset += expandedOffset - baseOffset;
  }

  return (
    <div
      className="absolute w-full transition-all duration-200 ease-out cursor-pointer"
      style={{ top: `${topOffset}px`, zIndex: isHovered ? 100 : index }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onContextMenu={onContextMenu}
    >
      <div
        className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
          isHovered
            ? "border-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/20 scale-105"
            : "border-transparent"
        }`}
      >
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full h-auto"
          draggable={false}
        />

        {/* Quantity badge */}
        {card.quantity > 1 && (
          <div className="absolute top-1 right-1 bg-[var(--accent-primary)] text-white text-xs font-bold px-1.5 py-0.5 rounded">
            ×{card.quantity}
          </div>
        )}

        {/* Art selector button (shown on hover) */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArtClick();
            }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 p-1.5 bg-black/70 hover:bg-black/90 rounded-lg border border-white/20 transition-all hover:scale-110"
            title="Change art"
          >
            <ArtIcon className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
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
        className="w-4 h-4 rounded-full"
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

function ArtIcon({ className }: { className?: string }) {
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
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}
