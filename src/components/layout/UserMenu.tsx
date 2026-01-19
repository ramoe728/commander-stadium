"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { createClient } from "@/lib/supabase/client";
import { Profile, getCurrentProfile } from "@/lib/profiles";
import { FriendRequestsInbox } from "./FriendRequestsInbox";

/**
 * User menu component that shows auth status.
 * Displays sign in/up buttons for guests, user menu for authenticated users.
 */
export function UserMenu() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Fetch profile when user changes
  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const profileData = await getCurrentProfile();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    }
    loadProfile();
  }, [user]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
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
    const displayName = profile?.display_name || profile?.username || user.email?.split("@")[0] || "User";
    const avatarLetter = displayName[0].toUpperCase();

    return (
      <div className="flex items-center gap-4">
        <Link
          href="/game-finder"
          className="btn-secondary px-5 py-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Find Games
        </Link>
        
        {/* Friend Requests Inbox */}
        <FriendRequestsInbox />
        
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                style={{ backgroundColor: profile?.avatar_color || "#7c3aed" }}
              >
                {avatarLetter}
              </div>
            )}
            <span className="text-sm text-[var(--foreground-muted)] max-w-[120px] truncate">
              {displayName}
            </span>
          </button>

          {/* Dropdown menu - pt-2 creates hover bridge, inner div has actual styling */}
          <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="py-2 bg-[#1a1a2e] border border-[var(--border)] rounded-lg shadow-2xl">
              <Link
                href="/decks"
                className="block px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] cursor-pointer"
              >
                My Decks
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] cursor-pointer"
              >
                Settings
              </Link>
              <hr className="my-2 border-[var(--border)]" />
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[var(--surface)] cursor-pointer"
              >
                Sign Out
              </button>
            </div>
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
