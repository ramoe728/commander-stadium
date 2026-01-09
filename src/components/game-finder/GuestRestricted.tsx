"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks";

interface GuestRestrictedProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component that disables content for guests.
 * Shows overlay with account creation prompt on hover/click.
 */
export function GuestRestricted({ children, className = "" }: GuestRestrictedProps) {
  const { user, loading } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  // If loading or user is authenticated, render children normally
  if (loading || user) {
    return <div className={className}>{children}</div>;
  }

  // Guest user - show disabled state with overlay
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(true)}
    >
      {/* Grayed out content */}
      <div className="opacity-40 pointer-events-none select-none filter grayscale">
        {children}
      </div>

      {/* Lock icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-[var(--background)]/80 flex items-center justify-center">
          <LockIcon className="w-6 h-6 text-[var(--foreground-muted)]" />
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-[var(--background-secondary)] border border-[var(--accent-primary)] rounded-lg px-4 py-3 shadow-xl max-w-xs text-center pointer-events-auto">
            <p className="text-sm text-[var(--foreground)] font-medium mb-2">
              Unlock this feature
            </p>
            <p className="text-xs text-[var(--foreground-muted)] mb-3">
              Create a free account to access friends, saved decks, and more.
            </p>
            <a
              href="/register"
              className="inline-block btn-primary px-4 py-2 rounded-lg text-white text-sm font-medium"
            >
              Create Account
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
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
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

