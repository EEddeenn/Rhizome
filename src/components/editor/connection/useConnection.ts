"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  tokenExpired: boolean;
  autoLogin: boolean;
}

export interface ConnectionActions {
  setConfig: (config: Partial<ConnectionState["config"]>) => void;
  setToken: (token: string, remember: boolean) => void;
  disconnect: () => void;
  validateAndConnect: () => Promise<void>;
  clearTokenExpired: () => void;
  markTokenExpired: () => void;
  setAutoLogin: (enabled: boolean) => void;
}

export type UseConnectionReturn = ConnectionState & ConnectionActions;

const DEFAULT_CONFIG = {
  owner: "",
  repo: "",
  contentRoot: "content",
};

export function useConnection(): UseConnectionReturn {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    adapter: null,
    config: DEFAULT_CONFIG,
    tokenValidation: null,
    mounted: false,
    tokenExpired: false,
    autoLogin: false,
  });

  const autoConnectAttempted = useRef(false);

  const validateAndConnect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, connectionError: null, tokenExpired: false }));

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

  useEffect(() => {
    const storedConfig = authStore.getConfig();
    const hasToken = authStore.getToken() !== null;
    const hasValidConfig = Boolean(storedConfig.owner && storedConfig.repo);
    const autoLoginEnabled = authStore.getAutoLogin();

    setState((prev) => ({
      ...prev,
      config: storedConfig.owner ? storedConfig : DEFAULT_CONFIG,
      autoLogin: autoLoginEnabled,
      mounted: true,
    }));

    const unsubscribe = authStore.subscribe((authState) => {
      setState((prev) => ({
        ...prev,
        config: authState.config,
        autoLogin: authState.autoLogin,
      }));
    });

    if (autoLoginEnabled && hasToken && hasValidConfig && !autoConnectAttempted.current) {
      autoConnectAttempted.current = true;
      validateAndConnect();
    }

    return unsubscribe;
  }, [validateAndConnect]);

  const setConfig = useCallback((config: Partial<ConnectionState["config"]>) => {
    authStore.setConfig(config);
  }, []);

  const setAutoLogin = useCallback((enabled: boolean) => {
    authStore.setAutoLogin(enabled);
  }, []);

  const setToken = useCallback((token: string, remember: boolean) => {
    authStore.setToken(token, remember);
    setState((prev) => ({ ...prev, tokenExpired: false }));
  }, []);

  const disconnect = useCallback(() => {
    authStore.disconnect();
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionError: null,
      adapter: null,
      tokenValidation: null,
      tokenExpired: false,
    }));
  }, []);

  const clearTokenExpired = useCallback(() => {
    setState((prev) => ({ ...prev, tokenExpired: false }));
  }, []);

  const markTokenExpired = useCallback(() => {
    authStore.disconnect();
    setState((prev) => ({
      ...prev,
      tokenExpired: true,
      isConnected: false,
      adapter: null,
      connectionError: "Your session has expired. Please reconnect.",
    }));
  }, []);

  return {
    ...state,
    setConfig,
    setToken,
    disconnect,
    validateAndConnect,
    clearTokenExpired,
    markTokenExpired,
    setAutoLogin,
  };
}
