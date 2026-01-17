/**
 * Types for the deck builder feature.
 */

export interface Card {
  id: string;
  name: string;
  imageUrl: string;
  manaValue: number;
  manaCost: string; // e.g., "{2}{W}{U}"
  colorIdentity: string[]; // Array of colors: W, U, B, R, G (empty for colorless)
  type: CardType;
  tags: string[]; // User-defined tags like "card draw", "finisher"
  quantity: number;
  allowsMultipleCopies: boolean; // True for basic lands and cards like Relentless Rats
  isCommander?: boolean; // True if this card is the deck's commander
}

export type CardType =
  | "Commander"
  | "Creature"
  | "Instant"
  | "Sorcery"
  | "Artifact"
  | "Enchantment"
  | "Planeswalker"
  | "Land"
  | "Battle";

export type ViewMode = "stacks" | "text";

export type CategoryMode = "mana-value" | "card-type" | "categories";

export type SortMode = "mana-value" | "name";

export interface DeckBuilderState {
  deckId: string | null;
  deckName: string;
  cards: Card[];
  viewMode: ViewMode;
  categoryMode: CategoryMode;
  sortMode: SortMode;
  searchQuery: string;
  categories: string[];
}

/**
 * Groups cards by the specified category mode.
 */
export function groupCards(
  cards: Card[],
  categoryMode: CategoryMode
): Map<string, Card[]> {
  const groups = new Map<string, Card[]>();

  cards.forEach((card) => {
    let keys: string[];

    switch (categoryMode) {
      case "mana-value":
        keys = [card.manaValue.toString()];
        break;
      case "card-type":
        keys = [card.type];
        break;
      case "categories":
        keys = card.tags.length > 0 ? card.tags : ["Uncategorized"];
        break;
      default:
        keys = ["Other"];
    }

    keys.forEach((key) => {
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(card);
    });
  });

  return groups;
}

/**
 * Sorts cards by the specified sort mode.
 */
export function sortCards(cards: Card[], sortMode: SortMode): Card[] {
  return [...cards].sort((a, b) => {
    switch (sortMode) {
      case "mana-value":
        return a.manaValue - b.manaValue || a.name.localeCompare(b.name);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

/**
 * Filters cards by search query (case-insensitive name match).
 */
export function filterCards(cards: Card[], query: string): Card[] {
  if (!query.trim()) return cards;
  const lowerQuery = query.toLowerCase();
  return cards.filter((card) => card.name.toLowerCase().includes(lowerQuery));
}

/**
 * Represents a card that violates Commander singleton rules.
 */
export interface IllegalCard {
  cardId: string;
  cardName: string;
  quantity: number;
  reason: string;
}

/**
 * Result of deck legality validation.
 */
export interface DeckLegalityResult {
  isLegal: boolean;
  illegalCards: IllegalCard[];
  deckErrors: string[]; // Deck-level errors (e.g., wrong card count)
}

/**
 * Counts total copies of each card by NAME across all entries.
 * This handles the case where the same card exists with different printings (IDs).
 */
function countCardsByName(cards: Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  cards.forEach((card) => {
    const current = counts.get(card.name) || 0;
    counts.set(card.name, current + card.quantity);
  });
  return counts;
}

/**
 * Gets the combined color identity of all commanders.
 */
function getCommanderColorIdentity(cards: Card[]): Set<string> {
  const commanders = cards.filter((c) => c.isCommander);
  const colorIdentity = new Set<string>();
  
  commanders.forEach((commander) => {
    commander.colorIdentity.forEach((color) => colorIdentity.add(color));
  });
  
  return colorIdentity;
}

/**
 * Checks if a card's color identity is within the commander's color identity.
 * Colorless cards (empty color identity) are always legal.
 */
function isColorIdentityLegal(cardColors: string[], commanderColors: Set<string>): boolean {
  // Colorless cards are always legal
  if (cardColors.length === 0) {
    return true;
  }
  
  // If no commanders set, we can't check color identity
  if (commanderColors.size === 0) {
    return true;
  }
  
  // Check if all card colors are within commander's color identity
  return cardColors.every((color) => commanderColors.has(color));
}

/**
 * Validates deck legality for Commander format.
 * Checks for:
 * - Exactly 100 cards (including commander)
 * - Singleton rule violations (only 1 copy unless it's a basic land
 *   or a card that explicitly allows multiple copies)
 * - Color identity violations (cards must match commander's color identity)
 * 
 * Note: The singleton rule is based on card NAME, not ID. Two different
 * printings of the same card count as duplicates.
 */
export function validateDeckLegality(cards: Card[]): DeckLegalityResult {
  const illegalCards: IllegalCard[] = [];
  const deckErrors: string[] = [];
  const cardCounts = countCardsByName(cards);
  const commanderColorIdentity = getCommanderColorIdentity(cards);

  // Check for exactly 100 cards
  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
  if (totalCards !== 100) {
    deckErrors.push(
      totalCards < 100
        ? `Deck has ${totalCards} cards (need ${100 - totalCards} more)`
        : `Deck has ${totalCards} cards (remove ${totalCards - 100})`
    );
  }

  // Track which card names we've already reported as illegal
  const reportedNames = new Set<string>();

  cards.forEach((card) => {
    // Skip commanders for these checks
    if (card.isCommander) {
      return;
    }

    // Check color identity violation
    if (!isColorIdentityLegal(card.colorIdentity, commanderColorIdentity)) {
      if (!reportedNames.has(card.name)) {
        reportedNames.add(card.name);
        illegalCards.push({
          cardId: card.id,
          cardName: card.name,
          quantity: card.quantity,
          reason: `Color identity outside commander's (has ${card.colorIdentity.join(", ") || "C"})`,
        });
      }
      return; // Don't double-report for singleton
    }

    // Cards allowing multiple copies are always legal regardless of quantity
    if (card.allowsMultipleCopies) {
      return;
    }

    // Skip if we've already reported this card name
    if (reportedNames.has(card.name)) {
      return;
    }

    // Singleton rule: only 1 copy allowed (by name, across all printings)
    const totalCopies = cardCounts.get(card.name) || 0;
    if (totalCopies > 1) {
      reportedNames.add(card.name);
      illegalCards.push({
        cardId: card.id,
        cardName: card.name,
        quantity: totalCopies,
        reason: `Only 1 copy allowed (has ${totalCopies})`,
      });
    }
  });

  return {
    isLegal: illegalCards.length === 0 && deckErrors.length === 0,
    illegalCards,
    deckErrors,
  };
}

/**
 * Checks if a specific card is violating Commander rules.
 * Checks for:
 * - Singleton rule (by name across printings)
 * - Color identity (must match commander's color identity)
 */
export function isCardIllegal(card: Card, allCards: Card[]): boolean {
  // Commanders are never marked as illegal themselves
  if (card.isCommander) {
    return false;
  }

  // Check color identity
  const commanderColorIdentity = getCommanderColorIdentity(allCards);
  if (!isColorIdentityLegal(card.colorIdentity, commanderColorIdentity)) {
    return true;
  }

  // Cards allowing multiple copies skip singleton check
  if (card.allowsMultipleCopies) {
    return false;
  }

  // Count total copies of this card NAME across all entries (different printings)
  const totalCopies = allCards
    .filter((c) => c.name === card.name)
    .reduce((sum, c) => sum + c.quantity, 0);

  return totalCopies > 1;
}
