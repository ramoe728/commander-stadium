"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { setOnline, setOffline, setInLobby } from "@/lib/friends";

/**
 * Hook to manage user presence status.
 * Automatically sets user as online when authenticated and offline when leaving.
 */
export function usePresence(lobbyId?: string | null) {
  const { user } = useAuth();
  const hasSetOnline = useRef(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Only set presence for authenticated users
    if (!user) {
      hasSetOnline.current = false;
      return;
    }

    // Set initial presence
    const initPresence = async () => {
      if (lobbyId) {
        await setInLobby(lobbyId);
      } else {
        await setOnline();
      }
      hasSetOnline.current = true;
    };

    initPresence();

    // Set up periodic presence heartbeat (every 2 minutes)
    const heartbeatInterval = setInterval(async () => {
      if (lobbyId) {
        await setInLobby(lobbyId);
      } else {
        await setOnline();
      }
    }, 120000);

    // Handle page visibility changes
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        if (lobbyId) {
          await setInLobby(lobbyId);
        } else {
          await setOnline();
        }
      }
      // Note: We don't set offline on visibility hidden as user might just be switching tabs
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Try to set offline when unmounting
      if (hasSetOnline.current) {
        setOffline().catch(console.error);
      }
    };
  }, [user, lobbyId]);
}

/**
 * Hook to use presence in the app layout.
 * This should be used once at the app level.
 */
export function useAppPresence() {
  usePresence(null);
}
