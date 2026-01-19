"use client";

import { ReactNode } from "react";
import { LobbyProvider, useAppPresence } from "@/hooks";
import { LobbyBar, LobbyBarSpacer } from "@/components/lobby";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Component that sets up presence tracking for the app.
 */
function PresenceTracker() {
  useAppPresence();
  return null;
}

/**
 * Client-side providers wrapper for the app.
 * Includes lobby state management, presence tracking, and the persistent lobby bar.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <LobbyProvider>
      <PresenceTracker />
      {children}
      <LobbyBarSpacer />
      <LobbyBar />
    </LobbyProvider>
  );
}
