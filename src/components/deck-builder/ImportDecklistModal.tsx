"use client";

import { useState, useEffect } from "react";
import {
  fetchCardByName,
  fetchCardBySetAndNumber,
  getCardImageUrl,
  parseCardType,
  allowsMultipleCopies,
  ScryfallCard,
} from "@/lib/scryfall";
import { Card, CardType } from "./types";

interface ImportDecklistModalProps {
  onImport: (cards: Card[]) => void;
  onClose: () => void;
}

interface ParsedLine {
  quantity: number;
  cardName: string;
  setCode?: string;
  collectorNumber?: string;
}

interface ImportResult {
  success: Card[];
  failed: string[];
}

/**
 * Modal for bulk importing cards from a text list.
 * Supports multiple formats:
 * - "1 Card Name" or "1x Card Name"
 * - "1 Card Name (SET) 123" for specific prints
 */
export function ImportDecklistModal({ onImport, onClose }: ImportDecklistModalProps) {
  const [input, setInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);

  // Close on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && !isImporting) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, isImporting]);

  /**
   * Parses a single line of the decklist input.
   * Returns null if the line is empty or invalid.
   * 
   * Supported formats:
   * - "1 Card Name" or "1x Card Name"
   * - "1 Card Name (SET) 123" for specific prints
   * - "*F*" suffix for foil (ignored, same art)
   */
  function parseLine(line: string): ParsedLine | null {
    let trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) {
      return null; // Skip empty lines and comments
    }

    // Strip foil marker "*F*" - Scryfall uses the same images for foil/non-foil
    trimmed = trimmed.replace(/\s*\*F\*\s*$/i, "").trim();

    // Format: "1 Card Name (SET) 123" or "1 Card Name (SET) 123p" - with set code and collector number
    const setMatch = trimmed.match(/^(\d+)x?\s+(.+?)\s+\(([A-Z0-9]+)\)\s+(\d+\w*)$/i);
    if (setMatch) {
      return {
        quantity: parseInt(setMatch[1], 10),
        cardName: setMatch[2].trim(),
        setCode: setMatch[3].toUpperCase(),
        collectorNumber: setMatch[4],
      };
    }

    // Format: "1 Card Name" or "1x Card Name" - basic format
    const basicMatch = trimmed.match(/^(\d+)x?\s+(.+)$/i);
    if (basicMatch) {
      return {
        quantity: parseInt(basicMatch[1], 10),
        cardName: basicMatch[2].trim(),
      };
    }

    return null;
  }

  /**
   * Converts a Scryfall card to our Card type.
   */
  function scryfallToCard(scryfallCard: ScryfallCard, quantity: number): Card {
    return {
      id: scryfallCard.id,
      name: scryfallCard.name,
      imageUrl: getCardImageUrl(scryfallCard), // Uses PNG format for clean corners
      manaValue: Math.floor(scryfallCard.cmc),
      manaCost: scryfallCard.mana_cost || "",
      type: parseCardType(scryfallCard.type_line) as CardType,
      tags: [],
      quantity,
      allowsMultipleCopies: allowsMultipleCopies(scryfallCard),
    };
  }

  /**
   * Handles the import process - parses input and fetches all cards.
   */
  async function handleImport() {
    const lines = input.split("\n");
    const parsedLines = lines.map(parseLine).filter((l): l is ParsedLine => l !== null);

    if (parsedLines.length === 0) {
      return;
    }

    setIsImporting(true);
    setProgress({ current: 0, total: parsedLines.length });

    const successCards: Card[] = [];
    const failedCards: string[] = [];

    for (let i = 0; i < parsedLines.length; i++) {
      const parsed = parsedLines[i];
      setProgress({ current: i + 1, total: parsedLines.length });

      let scryfallCard: ScryfallCard | null = null;

      // Try to fetch by set/number first if provided
      if (parsed.setCode && parsed.collectorNumber) {
        scryfallCard = await fetchCardBySetAndNumber(parsed.setCode, parsed.collectorNumber);
      }

      // Fall back to fetching by name
      if (!scryfallCard) {
        scryfallCard = await fetchCardByName(parsed.cardName);
      }

      if (scryfallCard) {
        successCards.push(scryfallToCard(scryfallCard, parsed.quantity));
      } else {
        failedCards.push(`${parsed.quantity}x ${parsed.cardName}`);
      }

      // Small delay to avoid rate limiting (Scryfall asks for 50-100ms between requests)
      await new Promise((resolve) => setTimeout(resolve, 75));
    }

    setResult({ success: successCards, failed: failedCards });
    setIsImporting(false);
  }

  /**
   * Confirms the import and closes the modal.
   */
  function handleConfirmImport() {
    if (result && result.success.length > 0) {
      onImport(result.success);
    }
    onClose();
  }

  const placeholder = `Enter cards in one of these formats:

1 Sol Ring
1x Lightning Bolt
4 Forest

Or with specific art:
1 Sol Ring (ECC) 58
1 Lightning Bolt (2XM) 117`;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2000 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isImporting ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-[var(--foreground)]">
              Import Decklist
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
              Paste your decklist to bulk add cards
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
          >
            <CloseIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {!result ? (
            <>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={isImporting}
                className="w-full h-64 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--foreground-subtle)] font-mono text-sm resize-none focus:outline-none focus:border-[var(--accent-primary)] transition-colors disabled:opacity-50"
              />

              {isImporting && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-[var(--foreground-muted)] mb-2">
                    <span>Importing cards...</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-primary)] transition-all duration-200"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Success summary */}
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <CheckIcon className="w-5 h-5" />
                  <span>
                    {result.success.length} card{result.success.length !== 1 ? "s" : ""} ready to import
                  </span>
                </div>
                {result.success.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto text-sm text-green-300/80">
                    {result.success.map((card) => (
                      <div key={card.id}>
                        {card.quantity}x {card.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Failed cards */}
              {result.failed.length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400 font-medium">
                    <WarningIcon className="w-5 h-5" />
                    <span>
                      {result.failed.length} card{result.failed.length !== 1 ? "s" : ""} could not be found
                    </span>
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto text-sm text-red-300/80">
                    {result.failed.map((card, index) => (
                      <div key={index}>{card}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
          {!result ? (
            <>
              <button
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || !input.trim()}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <LoadingSpinner />
                    Importing...
                  </>
                ) : (
                  <>
                    <ImportIcon className="w-4 h-4" />
                    Import Cards
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={result.success.length === 0}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Add {result.success.length} Card{result.success.length !== 1 ? "s" : ""} to Deck
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function ImportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
