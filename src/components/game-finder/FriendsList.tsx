"use client";

import { useState } from "react";

export interface Friend {
  id: string;
  name: string;
  status: "online" | "in-game" | "offline";
  avatarColor: string;
}

interface FriendsListProps {
  friends: Friend[];
  onAddFriend: () => void;
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
 */
export function FriendsList({ friends, onAddFriend }: FriendsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

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
            {onlineCount} online
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
        {sortedFriends.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
            {searchQuery ? "No friends found" : "No friends yet"}
          </p>
        ) : (
          sortedFriends.map((friend) => (
            <FriendItem key={friend.id} friend={friend} />
          ))
        )}
      </div>
    </div>
  );
}

function FriendItem({ friend }: { friend: Friend }) {
  const status = statusConfig[friend.status];

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface)] transition-colors cursor-pointer group">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm"
          style={{ backgroundColor: friend.avatarColor }}
        >
          {friend.name[0].toUpperCase()}
        </div>
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

      {/* Action button (visible on hover) */}
      <button
        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md bg-[var(--surface-hover)] flex items-center justify-center transition-opacity"
        title="Message"
      >
        <MessageIcon className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
      </button>
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

function MessageIcon({ className }: { className?: string }) {
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
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

