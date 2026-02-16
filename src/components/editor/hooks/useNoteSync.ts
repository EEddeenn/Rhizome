"use client";

import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import type { VaultAdapter } from "@/lib/editor";
import { clearContentCache } from "@/lib/editor";
import { pendingChanges } from "@/lib/editor/pending-changes";
import {
  reconcile,
  updateRuntimeEntry,
  removeRuntimeEntry,
  refreshRuntimeManifestAndReconcile,
  saveRuntimeManifestCache,
  type MergedEntry,
  type BuildManifest,
  type RuntimeManifest,
} from "@/lib/manifest";
import { extractErrorMessage, isAuthError, isConflictError } from "../utils/error";
import type { NoteStateHook } from "./useNoteState";

export interface UseNoteSyncParams {
  adapter: VaultAdapter | null;
  config: {
    owner: string;
    repo: string;
    contentRoot: string;
  };
  buildManifest: BuildManifest | null;
  runtimeManifest: RuntimeManifest | null;
  setRuntimeManifest: Dispatch<SetStateAction<RuntimeManifest | null>>;
  updateMergedEntries: (entries: MergedEntry[]) => void;
  onAuthError?: () => void;
  noteState: NoteStateHook;
  save: () => void;
}

export function useNoteSync({
  adapter,
  config,
  buildManifest,
  runtimeManifest,
  setRuntimeManifest,
  updateMergedEntries,
  onAuthError,
  noteState,
  save,
}: UseNoteSyncParams) {
  const { stateRef, setState, state } = noteState;

  const sync = useCallback(async () => {
    if (!adapter) return;

    const changes = pendingChanges.getAllChanges();
    if (changes.length === 0) return;

    setState((prev) => ({ 
      ...prev, 
      isSyncing: true, 
      syncError: null,
      syncProgress: { current: 0, total: changes.length },
    }));

    const errors: string[] = [];
    let newRuntimeManifest = runtimeManifest;

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      setState((prev) => ({ 
        ...prev, 
        syncProgress: { current: i + 1, total: changes.length } 
      }));

      try {
        if (change.type === "delete") {
          if (!change.originalSha) {
            errors.push(`${change.path}: No SHA for deletion`);
            continue;
          }
          await adapter.deleteFile({
            path: change.path,
            sha: change.originalSha,
            message: `Delete ${change.path}`,
          });
          if (newRuntimeManifest) {
            newRuntimeManifest = removeRuntimeEntry(newRuntimeManifest, change.path);
          }
        } else if (change.type === "create" || change.type === "update") {
          const result = await adapter.writeFile({
            path: change.path,
            content: change.content || "",
            message: change.type === "create" ? `Create ${change.path}` : `Update ${change.path}`,
            sha: change.type === "update" ? change.originalSha : undefined,
            isBase64: change.isBinary,
          });
          if (newRuntimeManifest && result.newSha) {
            newRuntimeManifest = updateRuntimeEntry(newRuntimeManifest, change.path, { sha: result.newSha });
          }
          
          if (stateRef.current.currentNote?.path === change.path) {
            setState((prev) => ({
              ...prev,
              currentSha: result.newSha || null,
              currentSource: "github",
              lastSaveUrl: result.htmlUrl || null,
            }));
          }
        }
        pendingChanges.removeChange(change.path);
      } catch (error: unknown) {
        if (isAuthError(error)) {
          onAuthError?.();
          errors.push(`${change.path}: Authentication error`);
        } else if (isConflictError(error)) {
          errors.push(`${change.path}: Conflict - remote has changed`);
        } else {
          const message = extractErrorMessage(error, "Failed");
          errors.push(`${change.path}: ${message}`);
        }
      }
    }

    if (newRuntimeManifest) {
      setRuntimeManifest(newRuntimeManifest);
      try {
        const repoInfo = await adapter.getRepoInfo();
        saveRuntimeManifestCache(
          config.owner,
          config.repo,
          repoInfo.defaultBranch,
          config.contentRoot,
          newRuntimeManifest
        );
      } catch {}
      const merged = reconcile(buildManifest, newRuntimeManifest);
      updateMergedEntries(merged);
    } else if (changes.some(c => c.type === "create")) {
      try {
        const result = await refreshRuntimeManifestAndReconcile({
          adapter,
          config,
          buildManifest,
        });
        setRuntimeManifest(result.runtimeManifest);
        updateMergedEntries(result.mergedEntries);
      } catch {}
    }

    clearContentCache();

    setState((prev) => ({
      ...prev,
      isSyncing: false,
      syncError: errors.length > 0 ? errors.join("\n") : null,
      syncProgress: null,
    }));
  }, [adapter, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries, config, onAuthError, stateRef, setState]);

  const clearSyncError = useCallback(() => {
    setState((prev) => ({ ...prev, syncError: null }));
  }, [setState]);

  const discardAllPending = useCallback(() => {
    pendingChanges.clear();
    if (stateRef.current.currentSource === "pending") {
      setState((prev) => ({
        ...prev,
        currentNote: null,
        currentContent: "",
        currentSha: null,
        currentSource: null,
        isDirty: false,
      }));
    }
  }, [stateRef, setState]);

  useEffect(() => {
    const { currentNote, isDirty } = stateRef.current;
    
    if (!currentNote || currentNote.type === "pdf" || !isDirty) return;
    
    const timeoutId = setTimeout(() => {
      save();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state.currentContent, state.isDirty, save, stateRef]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.hasPendingChanges || stateRef.current.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stateRef]);

  return {
    sync,
    clearSyncError,
    discardAllPending,
  };
}
