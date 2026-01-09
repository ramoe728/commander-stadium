"use client";

import { useEffect, useRef } from "react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  rules: string;
}

/**
 * Modal displaying game rules/description.
 * Closes on backdrop click or escape key.
 */
export function RulesModal({ isOpen, onClose, gameName, rules }: RulesModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold">
            {gameName}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors"
          >
            <CloseIcon className="w-4 h-4 text-[var(--foreground-muted)]" />
          </button>
        </div>

        {/* Rules label */}
        <div className="text-xs text-[var(--accent-primary)] font-medium uppercase tracking-wide mb-2">
          House Rules
        </div>

        {/* Rules content */}
        <div className="text-[var(--foreground-muted)] leading-relaxed whitespace-pre-wrap">
          {rules || "No special rules set for this game."}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-6 w-full btn-secondary py-3 rounded-lg text-[var(--foreground)] font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

