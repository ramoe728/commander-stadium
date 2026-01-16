"use client";

import { useState, useEffect } from "react";
import { fetchCardPrints, CardPrint } from "@/lib/scryfall";

interface ArtSelectorModalProps {
  cardId: string;
  cardName: string;
  onSelect: (cardId: string, newImageUrl: string) => void;
  onClose: () => void;
}

/**
 * Modal for selecting alternate card art from Scryfall.
 * Displays all available prints of a card for the user to choose from.
 */
export function ArtSelectorModal({
  cardId,
  cardName,
  onSelect,
  onClose,
}: ArtSelectorModalProps) {
  const [prints, setPrints] = useState<CardPrint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all prints when modal opens
  useEffect(() => {
    async function loadPrints() {
      setIsLoading(true);
      const results = await fetchCardPrints(cardName);
      setPrints(results);
      setIsLoading(false);
    }
    loadPrints();
  }, [cardName]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  /**
   * Applies the selected art and closes the modal.
   */
  function handleArtClick(print: CardPrint) {
    onSelect(cardId, print.imageUrl);
    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2000 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-bold text-[var(--foreground)]">
              Select Art
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
              {cardName} • {prints.length} print{prints.length !== 1 ? "s" : ""} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
              <span className="ml-3 text-[var(--foreground-muted)]">
                Loading art options...
              </span>
            </div>
          ) : prints.length === 0 ? (
            <div className="text-center py-12 text-[var(--foreground-muted)]">
              No alternate art found for this card.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {prints.map((print) => (
                <button
                  key={print.id}
                  onClick={() => handleArtClick(print)}
                  className="group relative rounded-xl overflow-hidden border-2 border-transparent hover:border-[var(--accent-primary)] hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 hover:scale-105 transition-all cursor-pointer"
                >
                  <img
                    src={print.imageUrl}
                    alt={`${print.name} - ${print.set_name}`}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  
                  {/* Set info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-8">
                    <div className="text-xs font-medium text-white truncate">
                      {print.set_name}
                    </div>
                    <div className="text-[10px] text-white/70 truncate">
                      {print.artist} • #{print.collector_number}
                    </div>
                  </div>
                </button>
              ))}
            </div>
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

function LoadingSpinner() {
  return (
    <div className="w-6 h-6 border-2 border-[var(--foreground-muted)] border-t-transparent rounded-full animate-spin" />
  );
}
