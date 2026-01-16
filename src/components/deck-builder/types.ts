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
 * Validates deck legality for Commander format.
 * Checks for singleton rule violations (only 1 copy unless it's a basic land
 * or a card that explicitly allows multiple copies).
 */
export function validateDeckLegality(cards: Card[]): DeckLegalityResult {
  const illegalCards: IllegalCard[] = [];

  cards.forEach((card) => {
    // Cards allowing multiple copies are always legal regardless of quantity
    if (card.allowsMultipleCopies) {
      return;
    }

    // Singleton rule: only 1 copy allowed
    if (card.quantity > 1) {
      illegalCards.push({
        cardId: card.id,
        cardName: card.name,
        quantity: card.quantity,
        reason: `Only 1 copy allowed (has ${card.quantity})`,
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
 */
export function isCardIllegal(card: Card): boolean {
  return !card.allowsMultipleCopies && card.quantity > 1;
}
