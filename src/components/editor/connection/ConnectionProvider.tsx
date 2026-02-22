"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useConnection as useConnectionState, type ConnectionState, type ConnectionActions, type UseConnectionReturn } from "./useConnection";

const ConnectionContext = createContext<UseConnectionReturn | null>(null);

export function useConnection(): UseConnectionReturn {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }
  return ctx;
}

export type { ConnectionState, ConnectionActions, UseConnectionReturn };

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const connection = useConnectionState();

  const value = useMemo<UseConnectionReturn>(() => connection, [connection]);

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}
