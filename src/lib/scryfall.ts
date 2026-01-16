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
