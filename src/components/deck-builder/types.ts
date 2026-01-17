/**
 * Types for the deck builder feature.
 */

export interface Card {
  id: string;
  name: string;
  imageUrl: string;
  manaValue: number;
  manaCost: string; // e.g., "{2}{W}{U}"
  type: CardType;
  tags: string[]; // User-defined tags like "card draw", "finisher"
  quantity: number;
  allowsMultipleCopies: boolean; // True for basic lands and cards like Relentless Rats
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

export type CategoryMode = "mana-value" | "card-type" | "custom-tags";

export type SortMode = "mana-value" | "name";

export interface DeckBuilderState {
  deckId: string | null;
  deckName: string;
  cards: Card[];
  viewMode: ViewMode;
  categoryMode: CategoryMode;
  sortMode: SortMode;
  searchQuery: string;
  customTags: string[];
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
      case "custom-tags":
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
 * Validates deck legality for Commander format.
 * Checks for singleton rule violations (only 1 copy unless it's a basic land
 * or a card that explicitly allows multiple copies).
 * 
 * Note: The singleton rule is based on card NAME, not ID. Two different
 * printings of the same card count as duplicates.
 */
export function validateDeckLegality(cards: Card[]): DeckLegalityResult {
  const illegalCards: IllegalCard[] = [];
  const cardCounts = countCardsByName(cards);

  // Track which card names we've already reported as illegal
  const reportedNames = new Set<string>();

  cards.forEach((card) => {
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
    isLegal: illegalCards.length === 0,
    illegalCards,
  };
}

/**
 * Checks if a specific card is violating the singleton rule.
 * Requires the full card list to check for duplicates by name across printings.
 */
export function isCardIllegal(card: Card, allCards: Card[]): boolean {
  if (card.allowsMultipleCopies) {
    return false;
  }

  // Count total copies of this card NAME across all entries (different printings)
  const totalCopies = allCards
    .filter((c) => c.name === card.name)
    .reduce((sum, c) => sum + c.quantity, 0);

  return totalCopies > 1;
}
