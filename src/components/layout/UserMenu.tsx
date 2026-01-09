"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { createClient } from "@/lib/supabase/client";

/**
 * User menu component that shows auth status.
 * Displays sign in/up buttons for guests, user menu for authenticated users.
 */
export function UserMenu() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <div className="w-24 h-9 bg-[var(--surface)] rounded-lg animate-pulse" />
        <div className="w-20 h-9 bg-[var(--surface)] rounded-lg animate-pulse" />
      </div>
    );
  }

  // Authenticated user
  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/game-finder"
          className="btn-secondary px-5 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Find Games
        </Link>
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)] transition-colors">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-xs text-white font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <span className="text-sm text-[var(--foreground-muted)] max-w-[120px] truncate">
              {user.email}
            </span>
          </button>

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
            <Link
              href="/decks"
              className="block px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              My Decks
            </Link>
            <Link
              href="/settings"
              className="block px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              Settings
            </Link>
            <hr className="my-2 border-[var(--border)]" />
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[var(--surface)]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Guest user
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/game-finder"
        className="btn-secondary px-5 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      >
        Find Games
      </Link>
      <Link
        href="/login"
        className="btn-primary px-5 py-2 rounded-lg text-white font-medium"
      >
        Sign In
      </Link>
    </div>
  );
}

