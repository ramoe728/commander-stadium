"use client";

import Link from "next/link";

/**
 * Button to create a new deck.
 * Navigates to the deck builder with a blank deck.
 */
export function NewDeckButton() {
  return (
    <Link
      href="/decks/new"
      className="btn-primary px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2"
    >
      <PlusIcon className="w-5 h-5" />
      New Deck
    </Link>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}
