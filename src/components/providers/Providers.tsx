"use client";

import { ReactNode } from "react";
import { LobbyProvider } from "@/hooks";
import { LobbyBar, LobbyBarSpacer } from "@/components/lobby";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers wrapper for the app.
 * Includes lobby state management and the persistent lobby bar.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <LobbyProvider>
      {children}
      <LobbyBarSpacer />
      <LobbyBar />
    </LobbyProvider>
  );
}
