"use client";

import { createContext, useContext, useMemo, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { useManifestOperations } from "../hooks/useManifestOperations";
import type { VaultAdapter, EditorConfig } from "@/lib/editor";
import type { MergedEntry, RuntimeManifest } from "@/lib/manifest";

interface ManifestContextValue {
  mergedEntries: MergedEntry[];
  isLoadingManifest: boolean;
  manifestLoadError: string | null;
  showMissing: boolean;
  buildManifest: ReturnType<typeof useManifestOperations>["buildManifest"];
  runtimeManifest: RuntimeManifest | null;
  setRuntimeManifest: Dispatch<SetStateAction<RuntimeManifest | null>>;
  loadManifests: () => Promise<void>;
  refreshManifest: () => Promise<MergedEntry[]>;
  toggleShowMissing: () => void;
  updateMergedEntries: (entries: MergedEntry[]) => void;
}

const ManifestContext = createContext<ManifestContextValue | null>(null);

export function useManifest() {
  const ctx = useContext(ManifestContext);
  if (!ctx) {
    throw new Error("useManifest must be used within ManifestProvider");
  }
  return ctx;
}

interface ManifestProviderProps {
  children: ReactNode;
  adapter: VaultAdapter | null;
  isConnected: boolean;
  mounted: boolean;
  config: EditorConfig;
}

export function ManifestProvider({ children, adapter, isConnected, mounted, config }: ManifestProviderProps) {
  const manifest = useManifestOperations({
    adapter,
    isConnected,
    mounted,
    config,
  });

  const value = useMemo<ManifestContextValue>(() => ({
    mergedEntries: manifest.mergedEntries,
    isLoadingManifest: manifest.isLoadingManifest,
    manifestLoadError: manifest.manifestLoadError,
    showMissing: manifest.showMissing,
    buildManifest: manifest.buildManifest,
    runtimeManifest: manifest.runtimeManifest,
    setRuntimeManifest: manifest.setRuntimeManifest,
    loadManifests: manifest.loadManifests,
    refreshManifest: manifest.refreshManifest,
    toggleShowMissing: manifest.toggleShowMissing,
    updateMergedEntries: manifest.updateMergedEntries,
  }), [manifest]);

  return (
    <ManifestContext.Provider value={value}>
      {children}
    </ManifestContext.Provider>
  );
}
