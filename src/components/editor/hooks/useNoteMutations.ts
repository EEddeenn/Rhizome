"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { VaultAdapter } from "@/lib/editor";
import { fetchNoteContent } from "@/lib/editor";
import { pendingChanges } from "@/lib/editor/pending-changes";
import {
  reconcile,
  updateRuntimeEntry,
  createEntryFromPath,
  type MergedEntry,
  type BuildManifest,
  type RuntimeManifest,
} from "@/lib/manifest";
import { extractErrorMessage, isAuthError } from "../utils/error";
import type { NoteStateHook } from "./useNoteState";

export interface UseNoteMutationsParams {
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
}

export function useNoteMutations({
  adapter,
  buildManifest,
  runtimeManifest,
  setRuntimeManifest,
  updateMergedEntries,
  onAuthError,
  noteState,
}: UseNoteMutationsParams) {
  const { stateRef, setState } = noteState;

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
    [adapter, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries, onAuthError, stateRef, setState]
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
  }, [setState]);

  const save = useCallback(() => {
    const { currentNote, currentContent, currentSha, currentSource } = stateRef.current;
    if (!currentNote || currentNote.type === "pdf") return;

    if (currentSha && currentSource !== "pending") {
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
  }, [stateRef, setState]);

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
    [setState]
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
    [setState]
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
  }, [adapter, onAuthError, stateRef, setState]);

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
  }, [adapter, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries, onAuthError, stateRef, setState]);

  const clearSaveError = useCallback(() => {
    setState((prev) => ({ ...prev, saveError: null }));
  }, [setState]);

  return {
    openNote,
    updateContent,
    save,
    createNote,
    uploadPdf,
    deleteNote,
    reloadRemote,
    clearSaveError,
  };
}
