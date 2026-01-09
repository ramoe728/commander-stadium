"use client";

interface CreateGameButtonProps {
  onClick: () => void;
}

/**
 * Prominent button for creating a new game.
 */
export function CreateGameButton({ onClick }: CreateGameButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full btn-primary py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-2"
    >
      <PlusIcon className="w-5 h-5" />
      Create Game
    </button>
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

