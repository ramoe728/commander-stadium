/**
 * Scryfall API integration for card data.
 * API documentation: https://scryfall.com/docs/api
 */

const SCRYFALL_API_BASE = "https://api.scryfall.com";

/**
 * Scryfall card object (simplified - contains the fields we need).
 */
export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost: string;
  cmc: number; // Converted mana cost (mana value)
  type_line: string;
  oracle_text?: string; // Rules text - used to detect "any number of cards" abilities
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    art_crop: string;
  };
  card_faces?: Array<{
    name: string;
    mana_cost: string;
    type_line: string;
    oracle_text?: string;
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      art_crop: string;
    };
  }>;
}

/**
 * Fetches card name suggestions from Scryfall autocomplete API.
 * Returns up to 20 card name suggestions.
 */
export async function fetchCardAutocomplete(query: string): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `${SCRYFALL_API_BASE}/cards/autocomplete?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      console.error("Scryfall autocomplete error:", response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch autocomplete:", error);
    return [];
  }
}

/**
 * Fetches a card by exact name from Scryfall.
 */
export async function fetchCardByName(name: string): Promise<ScryfallCard | null> {
  try {
    const response = await fetch(
      `${SCRYFALL_API_BASE}/cards/named?exact=${encodeURIComponent(name)}`
    );

    if (!response.ok) {
      console.error("Scryfall card fetch error:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch card:", error);
    return null;
  }
}

/**
 * Gets the image URL from a Scryfall card, handling double-faced cards.
 */
export function getCardImageUrl(card: ScryfallCard, size: "small" | "normal" | "large" = "normal"): string {
  // Single-faced cards have image_uris directly
  if (card.image_uris) {
    return card.image_uris[size];
  }

  // Double-faced cards have images in card_faces
  if (card.card_faces && card.card_faces[0]?.image_uris) {
    return card.card_faces[0].image_uris[size];
  }

  // Fallback placeholder
  return "/assets/card-back.png";
}

/**
 * Determines if a card allows multiple copies in a Commander deck.
 * Returns true for:
 * - Basic lands (type_line contains "Basic Land")
 * - Cards with "A deck can have any number of cards named" in oracle_text
 *   (e.g., Relentless Rats, Shadowborn Apostle, Dragon's Approach, etc.)
 */
export function allowsMultipleCopies(card: ScryfallCard): boolean {
  // Check if it's a basic land
  if (card.type_line?.toLowerCase().includes("basic land")) {
    return true;
  }

  // Get oracle text (handle double-faced cards)
  const oracleText = card.oracle_text || 
    card.card_faces?.map(face => face.oracle_text || "").join(" ") || "";

  // Check for "A deck can have any number of cards named" ability
  if (oracleText.toLowerCase().includes("a deck can have any number of cards named")) {
    return true;
  }

  return false;
}

/**
 * Parses card type from Scryfall type_line to our simplified CardType.
 */
export function parseCardType(typeLine: string): string {
  const lowerType = typeLine.toLowerCase();

  if (lowerType.includes("creature")) return "Creature";
  if (lowerType.includes("planeswalker")) return "Planeswalker";
  if (lowerType.includes("instant")) return "Instant";
  if (lowerType.includes("sorcery")) return "Sorcery";
  if (lowerType.includes("artifact")) return "Artifact";
  if (lowerType.includes("enchantment")) return "Enchantment";
  if (lowerType.includes("land")) return "Land";
  if (lowerType.includes("battle")) return "Battle";

  return "Artifact"; // Default fallback
}

/**
 * Represents a card print/art variant from Scryfall.
 */
export interface CardPrint {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  imageUrl: string;
  artist: string;
}

/**
 * Fetches all available prints/arts for a card by name.
 * Returns an array of print variants the user can choose from.
 */
export async function fetchCardPrints(cardName: string): Promise<CardPrint[]> {
  try {
    // Use unique:prints to get all printings of this exact card name
    const response = await fetch(
      `${SCRYFALL_API_BASE}/cards/search?q=!"${encodeURIComponent(cardName)}"+unique:prints&order=released`
    );

    if (!response.ok) {
      console.error("Scryfall prints fetch error:", response.status);
      return [];
    }

    const data = await response.json();
    const cards: ScryfallCard[] = data.data || [];

    return cards
      .filter((card) => {
        // Only include cards that have images
        return card.image_uris || (card.card_faces && card.card_faces[0]?.image_uris);
      })
      .map((card) => ({
        id: card.id,
        name: card.name,
        set: (card as ScryfallCardWithSet).set?.toUpperCase() || "???",
        set_name: (card as ScryfallCardWithSet).set_name || "Unknown Set",
        collector_number: (card as ScryfallCardWithSet).collector_number || "",
        imageUrl: getCardImageUrl(card, "normal"),
        artist: (card as ScryfallCardWithSet).artist || "Unknown",
      }));
  } catch (error) {
    console.error("Failed to fetch card prints:", error);
    return [];
  }
}

/**
 * Extended Scryfall card type with set info for prints.
 */
interface ScryfallCardWithSet extends ScryfallCard {
  set?: string;
  set_name?: string;
  collector_number?: string;
  artist?: string;
}
