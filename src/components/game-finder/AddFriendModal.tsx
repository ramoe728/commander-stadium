"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { searchUsers, sendFriendRequest } from "@/lib/friends";
import { Profile } from "@/lib/profiles";

interface AddFriendModalProps {
  onClose: () => void;
}

/**
 * Modal for searching and sending friend requests.
 * Users can search by username to find and add friends.
 */
export function AddFriendModal({ onClose }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Debounced search
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSuccess(null);
    setError(null);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce the search
    searchTimeout.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  // Send friend request
  const handleSendRequest = async (profile: Profile) => {
    setSendingTo(profile.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendFriendRequest(profile.username);
      
      if (result.success) {
        setSuccess(`Friend request sent to ${profile.display_name || profile.username}!`);
        // Remove from results
        setSearchResults((prev) => prev.filter((p) => p.id !== profile.id));
      } else {
        setError(result.error || "Failed to send request");
      }
    } catch (err) {
      console.error("Send request error:", err);
      setError("Failed to send friend request");
    } finally {
      setSendingTo(null);
    }
  };

  // Direct send by pressing enter (if valid username typed)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;

    // If there's exactly one result, send to them
    if (searchResults.length === 1) {
      handleSendRequest(searchResults[0]);
      return;
    }

    // Otherwise try to send directly by username
    setSendingTo("direct");
    setError(null);
    setSuccess(null);

    try {
      const result = await sendFriendRequest(searchQuery.trim());
      
      if (result.success) {
        setSuccess(`Friend request sent to ${searchQuery}!`);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        setError(result.error || "Failed to send request");
      }
    } catch (err) {
      console.error("Send request error:", err);
      setError("Failed to send friend request");
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md mx-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold text-[var(--foreground)]">
            Add Friend
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Search form */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-subtle)]" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder="Search by username..."
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <LoadingSpinner className="w-5 h-5" />
                </div>
              )}
            </div>
          </form>

          {/* Error/Success messages */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Search results */}
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
              <p className="text-center text-[var(--foreground-muted)] py-4 text-sm">
                No users found matching &ldquo;{searchQuery}&rdquo;
              </p>
            )}
            
            {searchResults.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-colors"
              >
                {/* Avatar */}
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: profile.avatar_color }}
                  >
                    {(profile.display_name || profile.username)[0].toUpperCase()}
                  </div>
                )}

                {/* User info */}
                <div className="flex-grow min-w-0">
                  <p className="font-medium text-[var(--foreground)] truncate">
                    {profile.display_name || profile.username}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    @{profile.username}
                  </p>
                </div>

                {/* Add button */}
                <button
                  onClick={() => handleSendRequest(profile)}
                  disabled={sendingTo === profile.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingTo === profile.id ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    <PlusIcon className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>
            ))}
          </div>

          {/* Help text */}
          <p className="mt-4 text-xs text-[var(--foreground-subtle)] text-center">
            Search for users by their username to send a friend request.
          </p>
        </div>
      </div>
    </div>
  );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
