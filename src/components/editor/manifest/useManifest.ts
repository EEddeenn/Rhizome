"use client";

import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";

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
import { useConnection } from "../connection/ConnectionProvider";

export interface ManifestState {
  mergedEntries: MergedEntry[];
  isLoadingManifest: boolean;
  manifestLoadError: string | null;
  showMissing: boolean;
  buildManifest: BuildManifest | null;
  runtimeManifest: RuntimeManifest | null;
}

export interface ManifestActions {
  loadManifests: () => Promise<void>;
  refreshManifest: () => Promise<MergedEntry[]>;
  toggleShowMissing: () => void;
  updateMergedEntries: (entries: MergedEntry[]) => void;
  setRuntimeManifest: Dispatch<SetStateAction<RuntimeManifest | null>>;
}

export type UseManifestReturn = ManifestState & ManifestActions;

export function useManifest(): UseManifestReturn {
  const { adapter, isConnected, mounted, config } = useConnection();

  const [state, setState] = useState<ManifestState>({
    mergedEntries: [],
    isLoadingManifest: false,
    manifestLoadError: null,
    showMissing: false,
    buildManifest: null,
    runtimeManifest: null,
  });

  const updateMergedEntries = useCallback((entries: MergedEntry[]) => {
    setState((prev) => ({
      ...prev,
      mergedEntries: filterByStatus(entries, prev.showMissing),
    }));
  }, []);

  const setRuntimeManifest: Dispatch<SetStateAction<RuntimeManifest | null>> = useCallback((action) => {
    setState((prev) => ({
      ...prev,
      runtimeManifest: typeof action === "function" ? action(prev.runtimeManifest) : action,
    }));
  }, []);

  const loadManifests = useCallback(async () => {
    if (!adapter) return;

    setState((prev) => ({ ...prev, isLoadingManifest: true, manifestLoadError: null }));

    try {
      const repoInfo = await adapter.getRepoInfo();

      const build = await loadBuildManifest();
      setState((prev) => ({ ...prev, buildManifest: build }));

      const cachedRuntime = loadRuntimeManifestCache(
        config.owner,
        config.repo,
        repoInfo.defaultBranch,
        config.contentRoot
      );

      if (cachedRuntime) {
        setState((prev) => ({ ...prev, runtimeManifest: cachedRuntime }));
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

      setState((prev) => ({ ...prev, runtimeManifest: freshRuntime }));

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

      setState((prev) => ({ ...prev, runtimeManifest: freshRuntime }));

      saveRuntimeManifestCache(
        config.owner,
        config.repo,
        repoInfo.defaultBranch,
        config.contentRoot,
        freshRuntime
      );

      const merged = reconcile(state.buildManifest, freshRuntime);
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
  }, [adapter, config, state.buildManifest, state.showMissing]);

  const toggleShowMissing = useCallback(() => {
    setState((prev) => {
      const newShowMissing = !prev.showMissing;
      return {
        ...prev,
        showMissing: newShowMissing,
        mergedEntries: filterByStatus(
          reconcile(prev.buildManifest, prev.runtimeManifest),
          newShowMissing
        ),
      };
    });
  }, []);

  useEffect(() => {
    if (isConnected && adapter && mounted) {
      loadManifests();
    }
  }, [isConnected, adapter, loadManifests, mounted]);

  return {
    ...state,
    setRuntimeManifest,
    loadManifests,
    refreshManifest,
    toggleShowMissing,
    updateMergedEntries,
  };
}
