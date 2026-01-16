"use client";

import { useEffect, useRef } from "react";

interface CardContextMenuProps {
  x: number;
  y: number;
  cardId: string;
  cardName: string;
  onDelete: (cardId: string) => void;
  onClose: () => void;
}

/**
 * Context menu for card actions (right-click menu).
 * Positioned at the click coordinates.
 */
export function CardContextMenu({
  x,
  y,
  cardId,
  cardName,
  onDelete,
  onClose,
}: CardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu on screen
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();

      // Adjust if menu goes off right edge
      if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`;
      }

      // Adjust if menu goes off bottom edge
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  function handleDelete() {
    onDelete(cardId);
    onClose();
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden"
      style={{ left: x, top: y }}
    >
      {/* Card name header */}
      <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
        <span className="text-xs text-[var(--foreground-muted)] truncate block max-w-[200px]">
          {cardName}
        </span>
      </div>

      {/* Menu items */}
      <div className="py-1">
        <button
          onClick={handleDelete}
          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}
