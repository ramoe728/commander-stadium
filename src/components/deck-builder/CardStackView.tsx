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
}

function CardStackColumn({ groupKey, categoryMode, cards, cardCount, onContextMenu }: CardStackColumnProps) {
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
}

function CardStackItem({
  card,
  index,
  isHovered,
  hoveredIndex,
  onHover,
  onLeave,
  onContextMenu,
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
