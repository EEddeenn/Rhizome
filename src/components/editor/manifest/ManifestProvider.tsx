"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useManifest as useManifestHook, type ManifestState, type ManifestActions, type UseManifestReturn } from "./useManifest";

const ManifestContext = createContext<UseManifestReturn | null>(null);

export function useManifest(): UseManifestReturn {
  const ctx = useContext(ManifestContext);
  if (!ctx) {
    throw new Error("useManifest must be used within ManifestProvider");
  }
  return ctx;
}

export type { ManifestState, ManifestActions, UseManifestReturn };

interface ManifestProviderProps {
  children: ReactNode;
}

export function ManifestProvider({ children }: ManifestProviderProps) {
  const manifest = useManifestHook();

  const value = useMemo<UseManifestReturn>(() => manifest, [manifest]);

  return (
    <ManifestContext.Provider value={value}>
      {children}
    </ManifestContext.Provider>
  );
}
