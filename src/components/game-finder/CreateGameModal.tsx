"use client";

import { useState, useRef, useEffect } from "react";
import { createLobby } from "@/lib/lobbies";

interface CreateGameModalProps {
  onGameCreated: (lobbyId: string) => void;
  onClose: () => void;
}

/**
 * Modal for creating a new game lobby.
 */
export function CreateGameModal({ onGameCreated, onClose }: CreateGameModalProps) {
  const [name, setName] = useState("");
  const [rules, setRules] = useState("");
  const [password, setPassword] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isCreating) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isCreating]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Game name is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    const lobby = await createLobby({
      name: name.trim(),
      rules: rules.trim() || undefined,
      password: isPrivate ? password : undefined,
    });

    if (lobby) {
      onGameCreated(lobby.id);
    } else {
      setError("Failed to create game. Please try again.");
      setIsCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isCreating ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-cinzel)] text-xl font-semibold text-[var(--foreground)]">
            Create New Game
          </h2>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* Game name */}
            <div>
              <label htmlFor="game-name" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Game Name *
              </label>
              <input
                ref={nameInputRef}
                id="game-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Casual EDH Night"
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                disabled={isCreating}
              />
            </div>

            {/* Rules */}
            <div>
              <label htmlFor="game-rules" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Game Rules (Optional)
              </label>
              <textarea
                id="game-rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="e.g., Power level 6-7, no infinite combos..."
                rows={3}
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors resize-none"
                disabled={isCreating}
              />
            </div>

            {/* Private game toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[var(--foreground)]">Private Game</span>
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  Require a password to join
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                disabled={isCreating}
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                  isPrivate ? "bg-[var(--accent-primary)]" : "bg-[var(--surface)]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    isPrivate ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Password field */}
            {isPrivate && (
              <div>
                <label htmlFor="game-password" className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Password
                </label>
                <input
                  id="game-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password..."
                  className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                  disabled={isCreating}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="btn-primary px-6 py-2 rounded-lg text-white font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  Create Game
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
