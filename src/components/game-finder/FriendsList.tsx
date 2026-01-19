"use client";

import { useState, useEffect, useCallback } from "react";
import { getFriends, removeFriend, Friend as FriendData, UserActivity } from "@/lib/friends";

// Re-export the Friend type for compatibility with existing imports
export interface Friend {
  id: string;
  name: string;
  status: "online" | "in-game" | "offline";
  avatarColor: string;
  avatarUrl?: string;
  lobbyId?: string | null;
}

interface FriendsListProps {
  onAddFriend: () => void;
}

// Map UserActivity to display status
function mapActivityToStatus(activity: UserActivity): "online" | "in-game" | "offline" {
  switch (activity) {
    case "online":
    case "in_lobby":
      return "online";
    case "in_game":
      return "in-game";
    case "offline":
    default:
      return "offline";
  }
}

// Convert FriendData to Friend display interface
function toDisplayFriend(friend: FriendData): Friend {
  return {
    id: friend.id,
    name: friend.display_name || friend.username,
    status: mapActivityToStatus(friend.status),
    avatarColor: friend.avatar_color,
    avatarUrl: friend.avatar_url || undefined,
    lobbyId: friend.lobby_id,
  };
}

const statusConfig = {
  online: {
    color: "bg-green-500",
    label: "Online",
  },
  "in-game": {
    color: "bg-[var(--accent-primary)]",
    label: "In Game",
  },
  offline: {
    color: "bg-[var(--foreground-subtle)]",
    label: "Offline",
  },
};

/**
 * Sidebar showing friends list with status indicators.
 * Fetches real friend data and displays online status.
 */
export function FriendsList({ onAddFriend }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch friends on mount and poll for updates
  const fetchFriends = useCallback(async () => {
    try {
      const friendsData = await getFriends();
      setFriends(friendsData.map(toDisplayFriend));
    } catch (err) {
      console.error("Error fetching friends:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchFriends, 30000);
    return () => clearInterval(interval);
  }, [fetchFriends]);

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    try {
      const result = await removeFriend(friendId);
      if (result.success) {
        setFriends((prev) => prev.filter((f) => f.id !== friendId));
      }
    } catch (err) {
      console.error("Error removing friend:", err);
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: online first, then in-game, then offline
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    const order = { online: 0, "in-game": 1, offline: 2 };
    return order[a.status] - order[b.status];
  });

  const onlineCount = friends.filter((f) => f.status !== "offline").length;

  return (
    <div className="feature-card rounded-xl p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-[family-name:var(--font-cinzel)] font-semibold">
            Friends
          </h3>
          <p className="text-xs text-[var(--foreground-muted)]">
            {loading ? "Loading..." : `${onlineCount} online`}
          </p>
        </div>
        <button
          onClick={onAddFriend}
          className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 flex items-center justify-center transition-colors"
          title="Add friend"
        >
          <PlusIcon className="w-4 h-4 text-[var(--accent-primary)]" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)]" />
        <input
          type="text"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
        />
      </div>

      {/* Friends list */}
      <div className="flex-grow overflow-y-auto space-y-1 min-h-0">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-9 h-9 rounded-full bg-[var(--surface)] animate-pulse" />
                <div className="flex-grow space-y-1">
                  <div className="h-4 w-24 bg-[var(--surface)] rounded animate-pulse" />
                  <div className="h-3 w-16 bg-[var(--surface)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedFriends.length === 0 ? (
          <div className="text-center py-4">
            {searchQuery ? (
              <p className="text-sm text-[var(--foreground-muted)]">
                No friends found
              </p>
            ) : (
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-2">
                  No friends yet
                </p>
                <button
                  onClick={onAddFriend}
                  className="text-sm text-[var(--accent-primary)] hover:underline"
                >
                  Add your first friend
                </button>
              </div>
            )}
          </div>
        ) : (
          sortedFriends.map((friend) => (
            <FriendItem
              key={friend.id}
              friend={friend}
              onRemove={() => handleRemoveFriend(friend.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface FriendItemProps {
  friend: Friend;
  onRemove: () => void;
}

function FriendItem({ friend, onRemove }: FriendItemProps) {
  const status = statusConfig[friend.status];
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface)] transition-colors group">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {friend.avatarUrl ? (
          <img
            src={friend.avatarUrl}
            alt={friend.name}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: friend.avatarColor }}
          >
            {friend.name[0].toUpperCase()}
          </div>
        )}
        {/* Status indicator */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${status.color} border-2 border-[var(--background-secondary)]`}
        />
      </div>

      {/* Name and status */}
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">
          {friend.name}
        </p>
        <p className="text-xs text-[var(--foreground-muted)]">{status.label}</p>
      </div>

      {/* Action menu button */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md bg-[var(--surface-hover)] flex items-center justify-center transition-opacity"
          title="Options"
        >
          <DotsIcon className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-[#1a1a2e] border border-[var(--border)] rounded-lg shadow-2xl overflow-hidden">
              {friend.lobbyId && (
                <button
                  onClick={() => {
                    // TODO: Navigate to friend's lobby
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] cursor-pointer"
                >
                  Join Lobby
                </button>
              )}
              <button
                onClick={() => {
                  onRemove();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[var(--surface)] cursor-pointer"
              >
                Remove Friend
              </button>
            </div>
          </>
        )}
      </div>
    </div>
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

function SearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function DotsIcon({ className }: { className?: string }) {
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
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    </svg>
  );
}
