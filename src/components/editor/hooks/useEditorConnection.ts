"use client";

import { useState, useCallback, useEffect } from "react";
import { authStore, type TokenValidationResult } from "@/lib/editor";
import type { VaultAdapter } from "@/lib/editor";

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  adapter: VaultAdapter | null;
  config: {
    owner: string;
    repo: string;
    contentRoot: string;
  };
  tokenValidation: TokenValidationResult | null;
  mounted: boolean;
}

export interface UseEditorConnectionReturn extends ConnectionState {
  setConfig: (config: Partial<ConnectionState["config"]>) => void;
  setToken: (token: string, remember: boolean) => void;
  disconnect: () => void;
  validateAndConnect: () => Promise<void>;
}

const DEFAULT_CONFIG = {
  owner: "",
  repo: "",
  contentRoot: "content",
};

export function useEditorConnection(): UseEditorConnectionReturn {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    adapter: null,
    config: DEFAULT_CONFIG,
    tokenValidation: null,
    mounted: false,
  });

  useEffect(() => {
    const storedConfig = authStore.getConfig();
    setState((prev) => ({
      ...prev,
      config: storedConfig.owner ? storedConfig : DEFAULT_CONFIG,
      mounted: true,
    }));
  }, []);

  const setConfig = useCallback((config: Partial<ConnectionState["config"]>) => {
    authStore.setConfig(config);
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  const setToken = useCallback((token: string, remember: boolean) => {
    authStore.setToken(token, remember);
  }, []);

  const disconnect = useCallback(() => {
    authStore.disconnect();
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionError: null,
      adapter: null,
      tokenValidation: null,
    }));
  }, []);

  const validateAndConnect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, connectionError: null }));

    try {
      const result = await authStore.validateTokenAndRepoAccess();
      setState((prev) => ({ ...prev, tokenValidation: result }));

      if (result.ok) {
        const newAdapter = authStore.createAdapter();
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          adapter: newAdapter,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          connectionError: result.reason || "Connection failed",
        }));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Connection failed";
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionError: message,
      }));
    }
  }, []);

  return {
    ...state,
    setConfig,
    setToken,
    disconnect,
    validateAndConnect,
  };
}
