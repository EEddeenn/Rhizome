"use client";

import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import type { VaultAdapter } from "@/lib/editor";
import {
  loadBuildManifest,
  loadRuntimeManifestCache,
  saveRuntimeManifestCache,
  fetchRuntimeManifestFromGitHub,
  reconcile,
  filterByStatus,
  type BuildManifest,
  type RuntimeManifest,
  type MergedEntry,
} from "@/lib/manifest";

export interface ManifestState {
  mergedEntries: MergedEntry[];
  isLoadingManifest: boolean;
  manifestLoadError: string | null;
  showMissing: boolean;
}

export interface UseManifestOperationsParams {
  adapter: VaultAdapter | null;
  isConnected: boolean;
  mounted: boolean;
  config: {
    owner: string;
    repo: string;
    contentRoot: string;
  };
}

export interface UseManifestOperationsReturn extends ManifestState {
  buildManifest: BuildManifest | null;
  runtimeManifest: RuntimeManifest | null;
  setRuntimeManifest: Dispatch<SetStateAction<RuntimeManifest | null>>;
  loadManifests: () => Promise<void>;
  refreshManifest: () => Promise<MergedEntry[]>;
  toggleShowMissing: () => void;
  updateMergedEntries: (entries: MergedEntry[]) => void;
}

export function useManifestOperations({
  adapter,
  isConnected,
  mounted,
  config,
}: UseManifestOperationsParams): UseManifestOperationsReturn {
  const [state, setState] = useState<ManifestState>({
    mergedEntries: [],
    isLoadingManifest: false,
    manifestLoadError: null,
    showMissing: false,
  });

  const [buildManifest, setBuildManifest] = useState<BuildManifest | null>(null);
  const [runtimeManifest, setRuntimeManifest] = useState<RuntimeManifest | null>(null);

  const updateMergedEntries = useCallback((entries: MergedEntry[]) => {
    setState((prev) => ({
      ...prev,
      mergedEntries: filterByStatus(entries, prev.showMissing),
    }));
  }, []);

  const loadManifests = useCallback(async () => {
    if (!adapter) return;

    setState((prev) => ({ ...prev, isLoadingManifest: true, manifestLoadError: null }));

    try {
      const repoInfo = await adapter.getRepoInfo();

      const build = await loadBuildManifest();
      setBuildManifest(build);

      const cachedRuntime = loadRuntimeManifestCache(
        config.owner,
        config.repo,
        repoInfo.defaultBranch,
        config.contentRoot
      );

      if (cachedRuntime) {
        setRuntimeManifest(cachedRuntime);
        const merged = reconcile(build, cachedRuntime);
        setState((prev) => ({
          ...prev,
          mergedEntries: filterByStatus(merged, prev.showMissing),
        }));
      } else {
        const merged = reconcile(build, null);
        setState((prev) => ({
          ...prev,
          mergedEntries: filterByStatus(merged, prev.showMissing),
        }));
      }

      const freshRuntime = await fetchRuntimeManifestFromGitHub(adapter, {
        root: config.contentRoot,
        ref: repoInfo.defaultBranch,
      });

      setRuntimeManifest(freshRuntime);

      saveRuntimeManifestCache(
        config.owner,
        config.repo,
        repoInfo.defaultBranch,
        config.contentRoot,
        freshRuntime
      );

      const merged = reconcile(build, freshRuntime);
      setState((prev) => ({
        ...prev,
        mergedEntries: filterByStatus(merged, prev.showMissing),
        isLoadingManifest: false,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load manifest";
      setState((prev) => ({
        ...prev,
        isLoadingManifest: false,
        manifestLoadError: message,
      }));
    }
  }, [adapter, config]);

  const refreshManifest = useCallback(async () => {
    if (!adapter) return [];

    setState((prev) => ({ ...prev, isLoadingManifest: true }));

    try {
      const repoInfo = await adapter.getRepoInfo();

      const freshRuntime = await fetchRuntimeManifestFromGitHub(adapter, {
        root: config.contentRoot,
        ref: repoInfo.defaultBranch,
      });

      setRuntimeManifest(freshRuntime);

      saveRuntimeManifestCache(
        config.owner,
        config.repo,
        repoInfo.defaultBranch,
        config.contentRoot,
        freshRuntime
      );

      const merged = reconcile(buildManifest, freshRuntime);
      const filteredMerged = filterByStatus(merged, state.showMissing);

      setState((prev) => ({
        ...prev,
        mergedEntries: filterByStatus(merged, prev.showMissing),
        isLoadingManifest: false,
      }));

      return filteredMerged;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to refresh manifest";
      setState((prev) => ({
        ...prev,
        isLoadingManifest: false,
        manifestLoadError: message,
      }));
      return [];
    }
  }, [adapter, buildManifest, state.showMissing, config]);

  const toggleShowMissing = useCallback(() => {
    setState((prev) => {
      const newShowMissing = !prev.showMissing;
      return {
        ...prev,
        showMissing: newShowMissing,
        mergedEntries: filterByStatus(
          reconcile(buildManifest, runtimeManifest),
          newShowMissing
        ),
      };
    });
  }, [buildManifest, runtimeManifest]);

  useEffect(() => {
    if (isConnected && adapter && mounted) {
      loadManifests();
    }
  }, [isConnected, adapter, loadManifests, mounted]);

  return {
    ...state,
    buildManifest,
    runtimeManifest,
    setRuntimeManifest,
    loadManifests,
    refreshManifest,
    toggleShowMissing,
    updateMergedEntries,
  };
}
