/**
 * Deck persistence layer for Supabase.
 * Handles saving, loading, and managing user decks.
 */

import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/deck-builder/types";

/**
 * Database representation of a deck.
 */
export interface DeckRecord {
  id: string;
  user_id: string;
  name: string;
  commander_name: string | null;
  commander_image_url: string | null;
  color_identity: string[]; // Array of color codes: W, U, B, R, G
  cards: DeckCardRecord[];
  card_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified card record for database storage.
 * We store minimal data and can re-fetch from Scryfall if needed.
 */
export interface DeckCardRecord {
  id: string; // Scryfall card ID
  name: string;
  image_url: string;
  mana_value: number;
  mana_cost: string;
  type: string;
  tags: string[];
  quantity: number;
  allows_multiple_copies: boolean;
  is_commander?: boolean;
}

/**
 * Input for creating or updating a deck.
 */
export interface DeckInput {
  name: string;
  cards: Card[];
}

/**
 * Converts our Card type to the database format.
 */
function cardToRecord(card: Card): DeckCardRecord {
  return {
    id: card.id,
    name: card.name,
    image_url: card.imageUrl,
    mana_value: card.manaValue,
    mana_cost: card.manaCost,
    type: card.type,
    tags: card.tags,
    quantity: card.quantity,
    allows_multiple_copies: card.allowsMultipleCopies,
    is_commander: card.isCommander,
  };
}

/**
 * Converts a database card record to our Card type.
 */
function recordToCard(record: DeckCardRecord): Card {
  return {
    id: record.id,
    name: record.name,
    imageUrl: record.image_url,
    manaValue: record.mana_value,
    manaCost: record.mana_cost,
    type: record.type as Card["type"],
    tags: record.tags,
    quantity: record.quantity,
    allowsMultipleCopies: record.allows_multiple_copies,
    isCommander: record.is_commander,
  };
}

/**
 * Extracts color identity from a deck's cards.
 * Looks at mana costs to determine colors.
 */
function extractColorIdentity(cards: Card[]): string[] {
  const colors = new Set<string>();
  const colorMap: Record<string, string> = {
    W: "W",
    U: "U",
    B: "B",
    R: "R",
    G: "G",
  };

  cards.forEach((card) => {
    // Parse mana cost for color symbols
    const symbols = card.manaCost.match(/\{([WUBRG])\}/gi) || [];
    symbols.forEach((symbol) => {
      const color = symbol.slice(1, -1).toUpperCase();
      if (colorMap[color]) {
        colors.add(color);
      }
    });
  });

  // Return in WUBRG order
  return ["W", "U", "B", "R", "G"].filter((c) => colors.has(c));
}

/**
 * Finds the commander card in a deck (if any).
 * Looks for cards marked as the commander.
 */
function findCommander(cards: Card[]): Card | null {
  return cards.find((card) => card.isCommander) || null;
}

/**
 * Fetches all decks for the current user.
 */
export async function getUserDecks(): Promise<DeckRecord[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching decks:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetches a single deck by ID.
 * Returns null if not found or user doesn't have access.
 */
export async function getDeck(deckId: string): Promise<DeckRecord | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching deck:", error);
    return null;
  }

  return data;
}

/**
 * Creates a new deck for the current user.
 */
export async function createDeck(input: DeckInput): Promise<DeckRecord | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated");
    return null;
  }

  const commander = findCommander(input.cards);
  const colorIdentity = extractColorIdentity(input.cards);
  const cardRecords = input.cards.map(cardToRecord);
  const cardCount = input.cards.reduce((sum, c) => sum + c.quantity, 0);

  const { data, error } = await supabase
    .from("decks")
    .insert({
      user_id: user.id,
      name: input.name,
      commander_name: commander?.name || null,
      commander_image_url: commander?.imageUrl || null,
      color_identity: colorIdentity,
      cards: cardRecords,
      card_count: cardCount,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating deck:", error);
    return null;
  }

  return data;
}

/**
 * Updates an existing deck.
 */
export async function updateDeck(
  deckId: string,
  input: DeckInput
): Promise<DeckRecord | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated");
    return null;
  }

  const commander = findCommander(input.cards);
  const colorIdentity = extractColorIdentity(input.cards);
  const cardRecords = input.cards.map(cardToRecord);
  const cardCount = input.cards.reduce((sum, c) => sum + c.quantity, 0);

  const { data, error } = await supabase
    .from("decks")
    .update({
      name: input.name,
      commander_name: commander?.name || null,
      commander_image_url: commander?.imageUrl || null,
      color_identity: colorIdentity,
      cards: cardRecords,
      card_count: cardCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deckId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating deck:", error);
    return null;
  }

  return data;
}

/**
 * Deletes a deck.
 */
export async function deleteDeck(deckId: string): Promise<boolean> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not authenticated");
    return false;
  }

  const { error } = await supabase
    .from("decks")
    .delete()
    .eq("id", deckId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting deck:", error);
    return false;
  }

  return true;
}

/**
 * Converts a DeckRecord to an array of Cards for the deck builder.
 */
export function deckRecordToCards(deck: DeckRecord): Card[] {
  return deck.cards.map(recordToCard);
}
