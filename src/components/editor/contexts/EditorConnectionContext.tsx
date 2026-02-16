"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useEditorConnection } from "../hooks/useEditorConnection";
import type { VaultAdapter, TokenValidationResult, EditorConfig } from "@/lib/editor";

interface ConnectionContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  adapter: VaultAdapter | null;
  config: EditorConfig;
  tokenValidation: TokenValidationResult | null;
  mounted: boolean;
  tokenExpired: boolean;
  autoLogin: boolean;
  setConfig: (config: Partial<EditorConfig>) => void;
  setToken: (token: string, remember: boolean) => void;
  disconnect: () => void;
  validateAndConnect: () => Promise<void>;
  clearTokenExpired: () => void;
  markTokenExpired: () => void;
  setAutoLogin: (enabled: boolean) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }
  return ctx;
}

interface ConnectionProviderProps {
  children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const connection = useEditorConnection();

  const value = useMemo<ConnectionContextValue>(() => ({
    isConnected: connection.isConnected,
    isConnecting: connection.isConnecting,
    connectionError: connection.connectionError,
    adapter: connection.adapter,
    config: connection.config,
    tokenValidation: connection.tokenValidation,
    mounted: connection.mounted,
    tokenExpired: connection.tokenExpired,
    autoLogin: connection.autoLogin,
    setConfig: connection.setConfig,
    setToken: connection.setToken,
    disconnect: connection.disconnect,
    validateAndConnect: connection.validateAndConnect,
    clearTokenExpired: connection.clearTokenExpired,
    markTokenExpired: connection.markTokenExpired,
    setAutoLogin: connection.setAutoLogin,
  }), [connection]);

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}
