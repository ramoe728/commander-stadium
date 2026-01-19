"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPendingRequests,
  getPendingRequestsCount,
  acceptFriendRequest,
  declineFriendRequest,
  FriendRequest,
} from "@/lib/friends";

/**
 * Inbox button showing pending friend requests.
 * Displays a badge with the count and a dropdown list of requests.
 */
export function FriendRequestsInbox() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch pending requests
  const fetchRequests = useCallback(async () => {
    try {
      const [requestsList, requestsCount] = await Promise.all([
        getPendingRequests(),
        getPendingRequestsCount(),
      ]);
      setRequests(requestsList);
      setCount(requestsCount);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchRequests();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Handle accept
  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        // Remove from list
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        setCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error accepting request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle decline
  const handleDecline = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const result = await declineFriendRequest(requestId);
      if (result.success) {
        // Remove from list
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        setCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error declining request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-lg bg-[var(--surface)] animate-pulse" />
    );
  }

  return (
    <div className="relative">
      {/* Inbox button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-primary)] flex items-center justify-center transition-colors"
        title="Friend requests"
      >
        <InboxIcon className="w-5 h-5 text-[var(--foreground-muted)]" />
        
        {/* Badge */}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-[#1a1a2e] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                Friend Requests
              </h3>
              <p className="text-xs text-[var(--foreground-muted)]">
                {count === 0
                  ? "No pending requests"
                  : `${count} pending request${count !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Request list */}
            <div className="max-h-80 overflow-y-auto">
              {requests.length === 0 ? (
                <div className="py-8 text-center text-[var(--foreground-muted)] text-sm">
                  <InboxIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No pending friend requests</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {requests.map((request) => (
                    <div key={request.id} className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Sender avatar */}
                        {request.sender?.avatar_url ? (
                          <img
                            src={request.sender.avatar_url}
                            alt={request.sender.username}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{ backgroundColor: request.sender?.avatar_color || "#7c3aed" }}
                          >
                            {(request.sender?.display_name || request.sender?.username || "?")[0].toUpperCase()}
                          </div>
                        )}

                        {/* Request info */}
                        <div className="flex-grow min-w-0">
                          <p className="font-medium text-[var(--foreground)] truncate">
                            {request.sender?.display_name || request.sender?.username}
                          </p>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            @{request.sender?.username} • {formatTimeAgo(request.created_at)}
                          </p>
                          {request.message && (
                            <p className="mt-1 text-sm text-[var(--foreground-muted)] italic">
                              &ldquo;{request.message}&rdquo;
                            </p>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleAccept(request.id)}
                              disabled={processingId === request.id}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              {processingId === request.id ? "..." : "Accept"}
                            </button>
                            <button
                              onClick={() => handleDecline(request.id)}
                              disabled={processingId === request.id}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)] text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}
