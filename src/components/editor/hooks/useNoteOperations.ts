"use client";

import { useState, useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { VaultAdapter } from "@/lib/editor";
import { fetchNoteContent, clearContentCache } from "@/lib/editor";
import { pendingChanges, type PendingChange } from "@/lib/editor/pending-changes";
import {
  reconcile,
  updateRuntimeEntry,
  createEntryFromPath,
  refreshRuntimeManifestAndReconcile,
  saveRuntimeManifestCache,
  removeRuntimeEntry,
  type MergedEntry,
  type BuildManifest,
  type RuntimeManifest,
} from "@/lib/manifest";
import { extractErrorMessage, isAuthError, isConflictError } from "../utils/error";

export interface NoteState {
  currentNote: MergedEntry | null;
  currentContent: string;
  currentSha: string | null;
  currentSource: "local" | "github" | "pending" | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastSaveUrl: string | null;
  isLoadingNote: boolean;
  isSyncing: boolean;
  syncError: string | null;
  syncProgress: { current: number; total: number } | null;
}

export interface UseNoteOperationsParams {
  adapter: VaultAdapter | null;
  config: {
    owner: string;
    repo: string;
    contentRoot: string;
  };
  buildManifest: BuildManifest | null;
  runtimeManifest: RuntimeManifest | null;
  setRuntimeManifest: Dispatch<SetStateAction<RuntimeManifest | null>>;
  mergedEntries: MergedEntry[];
  updateMergedEntries: (entries: MergedEntry[]) => void;
  onAuthError?: () => void;
}

export interface UseNoteOperationsReturn extends NoteState {
  openNote: (entry: MergedEntry) => Promise<void>;
  updateContent: (content: string) => void;
  save: () => void;
  createNote: (path: string, content: string) => Promise<void>;
  uploadPdf: (path: string, base64Content: string) => Promise<void>;
  deleteNote: () => Promise<void>;
  reloadRemote: () => Promise<void>;
  clearSaveError: () => void;
  clearSyncError: () => void;
  sync: () => Promise<void>;
  discardAllPending: () => void;
  hasPendingChanges: boolean;
  pendingChangeForCurrentNote: PendingChange | null;
}

export function useNoteOperations({
  adapter,
  config,
  buildManifest,
  runtimeManifest,
  setRuntimeManifest,
  updateMergedEntries,
  onAuthError,
}: UseNoteOperationsParams): UseNoteOperationsReturn {
  const [state, setState] = useState<NoteState>({
    currentNote: null,
    currentContent: "",
    currentSha: null,
    currentSource: null,
    isDirty: false,
    isSaving: false,
    saveError: null,
    lastSaveUrl: null,
    isLoadingNote: false,
    isSyncing: false,
    syncError: null,
    syncProgress: null,
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    return pendingChanges.subscribe(() => forceUpdate((n) => n + 1));
  }, []);

  const openNote = useCallback(
    async (entry: MergedEntry) => {
      const pendingChange = pendingChanges.getChange(entry.path);
      
      if (pendingChange) {
        if (pendingChange.type === "delete") {
          return;
        }
        setState((prev) => ({
          ...prev,
          currentNote: entry,
          currentContent: pendingChange.content || "",
          currentSha: pendingChange.originalSha || null,
          currentSource: "pending",
          isDirty: false,
          saveError: null,
          isLoadingNote: false,
        }));
        return;
      }

      if (stateRef.current.currentNote?.path === entry.path && stateRef.current.currentContent) {
        return;
      }

      setState((prev) => ({ ...prev, isLoadingNote: true }));

      if (entry.type === "pdf") {
        try {
          let sha: string | null = null;
          if (adapter) {
            const result = await adapter.readFileRaw(entry.path);
            sha = result.sha;
          }
          setState((prev) => ({
            ...prev,
            currentNote: entry,
            currentContent: "",
            currentSha: sha,
            currentSource: null,
            isDirty: false,
            saveError: null,
            isLoadingNote: false,
          }));
        } catch (error: unknown) {
          if (isAuthError(error)) {
            setState((prev) => ({ ...prev, isLoadingNote: false }));
            onAuthError?.();
            return;
          }
          setState((prev) => ({
            ...prev,
            currentNote: entry,
            currentContent: "",
            currentSha: null,
            currentSource: null,
            isDirty: false,
            saveError: null,
            isLoadingNote: false,
          }));
        }
        return;
      }

      try {
        const result = await fetchNoteContent(entry.path, adapter);
        
        if (!result) {
          setState((prev) => ({ 
            ...prev, 
            isLoadingNote: false, 
            saveError: "Failed to load note content" 
          }));
          return;
        }

        const { content, sha, source } = result;
        setState((prev) => ({
          ...prev,
          currentNote: entry,
          currentContent: content,
          currentSha: sha ?? null,
          currentSource: source,
          isDirty: false,
          saveError: null,
          isLoadingNote: false,
        }));

        if (source === "github" && runtimeManifest && sha && sha !== entry.runtimeSha) {
          const updated = updateRuntimeEntry(runtimeManifest, entry.path, { sha });
          setRuntimeManifest(updated);
          const merged = reconcile(buildManifest, updated);
          updateMergedEntries(merged);
        }
      } catch (error: unknown) {
        if (isAuthError(error)) {
          setState((prev) => ({ ...prev, isLoadingNote: false }));
          onAuthError?.();
          return;
        }
        const message = extractErrorMessage(error, "Failed to open note");
        setState((prev) => ({ ...prev, saveError: message, isLoadingNote: false }));
      }
    },
    [adapter, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries, onAuthError]
  );

  const updateContent = useCallback((content: string) => {
    setState((prev) => {
      if (content === prev.currentContent) return prev;
      return {
        ...prev,
        currentContent: content,
        isDirty: true,
      };
    });
  }, []);

  const save = useCallback(() => {
    const { currentNote, currentContent, currentSha } = stateRef.current;
    if (!currentNote || currentNote.type === "pdf") return;

    if (currentSha && stateRef.current.currentSource !== "pending") {
      pendingChanges.addUpdate(currentNote.path, currentContent, currentSha);
    } else {
      const existing = pendingChanges.getChange(currentNote.path);
      if (existing?.type === "create") {
        pendingChanges.addCreate(currentNote.path, currentContent);
      } else if (currentSha) {
        pendingChanges.addUpdate(currentNote.path, currentContent, currentSha);
      } else {
        pendingChanges.addCreate(currentNote.path, currentContent);
      }
    }

    setState((prev) => ({
      ...prev,
      isDirty: false,
      currentSource: "pending",
    }));
  }, []);

  useEffect(() => {
    const { currentNote, isDirty } = stateRef.current;
    
    if (!currentNote || currentNote.type === "pdf" || !isDirty) return;
    
    const timeoutId = setTimeout(() => {
      save();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state.currentContent, state.isDirty, save]);

  const createNote = useCallback(
    async (path: string, content: string) => {
      const existing = pendingChanges.getChange(path);
      if (existing && existing.type !== "delete") {
        setState((prev) => ({ ...prev, saveError: "A file with this name already exists" }));
        return;
      }

      pendingChanges.addCreate(path, content);
      const newEntry = createEntryFromPath(path);

      setState((prev) => ({
        ...prev,
        currentNote: newEntry,
        currentContent: content,
        currentSha: null,
        currentSource: "pending",
        isDirty: false,
        lastSaveUrl: null,
        saveError: null,
      }));
    },
    []
  );

  const uploadPdf = useCallback(
    async (path: string, base64Content: string) => {
      const existing = pendingChanges.getChange(path);
      if (existing && existing.type !== "delete") {
        setState((prev) => ({ ...prev, saveError: "A file with this name already exists" }));
        return;
      }

      pendingChanges.addCreate(path, base64Content, true);
      const newEntry = createEntryFromPath(path);

      setState((prev) => ({
        ...prev,
        currentNote: newEntry,
        currentContent: "",
        currentSha: null,
        currentSource: "pending",
        isDirty: false,
        lastSaveUrl: null,
        saveError: null,
      }));
    },
    []
  );

  const deleteNote = useCallback(async () => {
    const { currentNote, currentSha } = stateRef.current;
    if (!currentNote) return;

    const pendingChange = pendingChanges.getChange(currentNote.path);
    
    if (pendingChange?.type === "create") {
      pendingChanges.removeChange(currentNote.path);
    } else if (currentNote.type === "pdf") {
      let sha = currentSha;
      if (!sha && adapter) {
        try {
          const result = await adapter.readFileRaw(currentNote.path);
          sha = result.sha;
        } catch (error: unknown) {
          if (isAuthError(error)) {
            onAuthError?.();
            return;
          }
        }
      }
      if (sha) {
        pendingChanges.addDelete(currentNote.path, sha);
      }
    } else if (currentSha) {
      pendingChanges.addDelete(currentNote.path, currentSha);
    }

    setState((prev) => ({
      ...prev,
      currentNote: null,
      currentContent: "",
      currentSha: null,
      currentSource: null,
      isDirty: false,
      lastSaveUrl: null,
    }));
  }, [adapter, onAuthError]);

  const reloadRemote = useCallback(async () => {
    const { currentNote } = stateRef.current;
    if (!adapter || !currentNote) return;

    setState((prev) => ({ ...prev, isLoadingNote: true }));

    try {
      if (currentNote.type === "pdf") {
        const { sha } = await adapter.readFileRaw(currentNote.path);
        setState((prev) => ({
          ...prev,
          currentSha: sha,
          currentSource: "github",
          isDirty: false,
          saveError: null,
          isLoadingNote: false,
        }));
        pendingChanges.removeChange(currentNote.path);
      } else {
        const { content, sha } = await adapter.readFile(currentNote.path);
        setState((prev) => ({
          ...prev,
          currentContent: content,
          currentSha: sha,
          currentSource: "github",
          isDirty: false,
          saveError: null,
          isLoadingNote: false,
        }));
        pendingChanges.removeChange(currentNote.path);

        if (runtimeManifest && sha !== currentNote.runtimeSha) {
          const updated = updateRuntimeEntry(runtimeManifest, currentNote.path, { sha });
          setRuntimeManifest(updated);
          const merged = reconcile(buildManifest, updated);
          updateMergedEntries(merged);
        }
      }
    } catch (error: unknown) {
      if (isAuthError(error)) {
        onAuthError?.();
        setState((prev) => ({ ...prev, isLoadingNote: false }));
        return;
      }
      const message = extractErrorMessage(error, "Failed to reload");
      setState((prev) => ({ ...prev, saveError: message, isLoadingNote: false }));
    }
  }, [adapter, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries, onAuthError]);

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
        const repoInfo = await adapter.getRepoInfo();
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
  }, [adapter, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries, config, onAuthError]);

  const clearSaveError = useCallback(() => {
    setState((prev) => ({ ...prev, saveError: null }));
  }, []);

  const clearSyncError = useCallback(() => {
    setState((prev) => ({ ...prev, syncError: null }));
  }, []);

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
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChanges.hasPendingChanges || stateRef.current.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const pendingChangeForCurrentNote = state.currentNote 
    ? (pendingChanges.getChange(state.currentNote.path) ?? null)
    : null;

  return {
    ...state,
    openNote,
    updateContent,
    save,
    createNote,
    uploadPdf,
    deleteNote,
    reloadRemote,
    clearSaveError,
    clearSyncError,
    sync,
    discardAllPending,
    hasPendingChanges: pendingChanges.hasPendingChanges,
    pendingChangeForCurrentNote,
  };
}
