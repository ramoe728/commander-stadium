"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { LobbyWithPlayers, getUserCurrentLobby, leaveLobby as leaveLobbyApi } from "@/lib/lobbies";
import { setInLobby, setOnline } from "@/lib/friends";
import { useAuth } from "./useAuth";

interface LobbyContextValue {
  currentLobby: LobbyWithPlayers | null;
  isLoading: boolean;
  isLeaving: boolean;
  refreshLobby: () => Promise<void>;
  leaveLobby: () => Promise<boolean>;
}

const LobbyContext = createContext<LobbyContextValue | null>(null);

interface LobbyProviderProps {
  children: ReactNode;
}

/**
 * Provider that tracks the user's current lobby across the app.
 * Fetches lobby state on mount and provides methods to refresh/leave.
 */
export function LobbyProvider({ children }: LobbyProviderProps) {
  const { user, loading: authLoading } = useAuth();
  const [currentLobby, setCurrentLobby] = useState<LobbyWithPlayers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  // Fetch current lobby on mount and when user changes
  const refreshLobby = useCallback(async () => {
    if (!user) {
      setCurrentLobby(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const lobby = await getUserCurrentLobby();
    setCurrentLobby(lobby);
    setIsLoading(false);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (!authLoading) {
      refreshLobby();
    }
  }, [authLoading, refreshLobby]);

  // Poll for lobby updates every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(refreshLobby, 30000);
    return () => clearInterval(interval);
  }, [user, refreshLobby]);

  // Update presence when lobby changes
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      if (currentLobby) {
        await setInLobby(currentLobby.id);
      } else {
        await setOnline();
      }
    };

    updatePresence();
  }, [user, currentLobby]);

  // Leave lobby function
  const leaveLobby = useCallback(async (): Promise<boolean> => {
    if (!currentLobby) return false;

    setIsLeaving(true);
    const success = await leaveLobbyApi(currentLobby.id);
    
    if (success) {
      setCurrentLobby(null);
    }
    
    setIsLeaving(false);
    return success;
  }, [currentLobby]);

  return (
    <LobbyContext.Provider
      value={{
        currentLobby,
        isLoading,
        isLeaving,
        refreshLobby,
        leaveLobby,
      }}
    >
      {children}
    </LobbyContext.Provider>
  );
}

/**
 * Hook to access the current lobby state.
 * Must be used within a LobbyProvider.
 */
export function useLobby(): LobbyContextValue {
  const context = useContext(LobbyContext);
  
  if (!context) {
    throw new Error("useLobby must be used within a LobbyProvider");
  }
  
  return context;
}
