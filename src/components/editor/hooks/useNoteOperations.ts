"use client";

import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { GitHubApiError } from "@/lib/editor";
import type { VaultAdapter } from "@/lib/editor";
import {
  reconcile,
  filterByStatus,
  updateEntrySha,
  updateRuntimeEntry,
  saveRuntimeManifestCache,
  refreshRuntimeManifestAndReconcile,
  type MergedEntry,
  type BuildManifest,
  type RuntimeManifest,
} from "@/lib/manifest";

function extractErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export interface NoteState {
  currentNote: MergedEntry | null;
  currentContent: string;
  currentSha: string | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastSaveUrl: string | null;
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
}

export interface UseNoteOperationsReturn extends NoteState {
  openNote: (entry: MergedEntry) => Promise<void>;
  updateContent: (content: string) => void;
  save: () => Promise<void>;
  createNote: (path: string, content: string) => Promise<void>;
  deleteNote: () => Promise<void>;
  reloadRemote: () => Promise<void>;
  clearSaveError: () => void;
  refreshManifestForCreate: () => Promise<MergedEntry[]>;
}

export function useNoteOperations({
  adapter,
  config,
  buildManifest,
  runtimeManifest,
  setRuntimeManifest,
  mergedEntries,
  updateMergedEntries,
}: UseNoteOperationsParams): UseNoteOperationsReturn {
  const [state, setState] = useState<NoteState>({
    currentNote: null,
    currentContent: "",
    currentSha: null,
    isDirty: false,
    isSaving: false,
    saveError: null,
    lastSaveUrl: null,
  });

  const refreshManifestForCreate = useCallback(async (): Promise<MergedEntry[]> => {
    if (!adapter || !buildManifest) return [];

    try {
      const result = await refreshRuntimeManifestAndReconcile({
        adapter,
        config,
        buildManifest,
      });

      setRuntimeManifest(result.runtimeManifest);
      updateMergedEntries(result.mergedEntries);
      return filterByStatus(result.mergedEntries, true);
    } catch {
      return [];
    }
  }, [adapter, buildManifest, config, setRuntimeManifest, updateMergedEntries]);

  const openNote = useCallback(
    async (entry: MergedEntry) => {
      if (!adapter) return;

      try {
        const { content, sha } = await adapter.readFile(entry.path);
        setState((prev) => ({
          ...prev,
          currentNote: entry,
          currentContent: content,
          currentSha: sha,
          isDirty: false,
          saveError: null,
        }));

        if (runtimeManifest && sha !== entry.runtimeSha) {
          const updated = updateRuntimeEntry(runtimeManifest, entry.path, { sha });
          setRuntimeManifest(updated);

          const merged = reconcile(buildManifest, updated);
          updateMergedEntries(merged);
        }
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "Failed to open note");
        setState((prev) => ({ ...prev, saveError: message }));
      }
    },
    [adapter, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries]
  );

  const updateContent = useCallback((content: string) => {
    setState((prev) => ({
      ...prev,
      currentContent: content,
      isDirty: content !== prev.currentContent,
    }));
  }, []);

  const save = useCallback(async () => {
    const note = state.currentNote;
    const sha = state.currentSha;
    if (!adapter || !note || sha === null) return;

    setState((prev) => ({ ...prev, isSaving: true, saveError: null }));

    try {
      const result = await adapter.writeFile({
        path: note.path,
        content: state.currentContent,
        message: `Update ${note.title}`,
        sha: sha ?? undefined,
      });

      const newSha = result.newSha || null;

      if (runtimeManifest && newSha) {
        const updatedRuntime = updateRuntimeEntry(runtimeManifest, note.path, { sha: newSha });
        setRuntimeManifest(updatedRuntime);

        const repoInfo = await adapter.getRepoInfo();
        saveRuntimeManifestCache(
          config.owner,
          config.repo,
          repoInfo.defaultBranch,
          config.contentRoot,
          updatedRuntime
        );

        const updatedMerged = updateEntrySha(mergedEntries, note.path, newSha);
        updateMergedEntries(updatedMerged);
        setState((prev) => ({
          ...prev,
          currentNote: prev.currentNote ? { ...prev.currentNote, runtimeSha: newSha } : null,
        }));
      }

      setState((prev) => ({
        ...prev,
        isSaving: false,
        isDirty: false,
        currentSha: newSha,
        lastSaveUrl: result.htmlUrl || null,
      }));
    } catch (error: unknown) {
      if (error instanceof GitHubApiError) {
        if (GitHubApiError.isConflict(error) || GitHubApiError.isUnprocessable(error)) {
          setState((prev) => ({
            ...prev,
            isSaving: false,
            saveError: "CONFLICT: Remote has changed",
          }));
          return;
        }
      }
      const message = extractErrorMessage(error, "Failed to save");
      setState((prev) => ({ ...prev, isSaving: false, saveError: message }));
    }
  }, [adapter, state.currentNote, state.currentContent, state.currentSha, mergedEntries, runtimeManifest, config, setRuntimeManifest, updateMergedEntries]);

  const createNote = useCallback(
    async (path: string, content: string) => {
      if (!adapter) return;

      setState((prev) => ({ ...prev, isSaving: true, saveError: null }));

      try {
        const result = await adapter.writeFile({
          path,
          content,
          message: `Create ${path}`,
        });

        const updatedEntries = await refreshManifestForCreate();
        const newEntry = updatedEntries.find((e) => e.path === path);

        setState((prev) => ({
          ...prev,
          isSaving: false,
          currentNote: newEntry || null,
          currentContent: content,
          currentSha: result.newSha || null,
          isDirty: false,
          lastSaveUrl: result.htmlUrl || null,
        }));
      } catch (error: unknown) {
        const message = extractErrorMessage(error, "Failed to create note");
        setState((prev) => ({ ...prev, isSaving: false, saveError: message }));
      }
    },
    [adapter, refreshManifestForCreate]
  );

  const deleteNote = useCallback(async () => {
    const note = state.currentNote;
    const sha = state.currentSha;
    if (!adapter || !note || sha === null) return;

    setState((prev) => ({ ...prev, isSaving: true, saveError: null }));

    try {
      await adapter.deleteFile({
        path: note.path,
        sha: sha,
        message: `Delete ${note.title}`,
      });

      await refreshManifestForCreate();

      setState((prev) => ({
        ...prev,
        isSaving: false,
        currentNote: null,
        currentContent: "",
        currentSha: null,
        isDirty: false,
        lastSaveUrl: null,
      }));
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Failed to delete note");
      setState((prev) => ({ ...prev, isSaving: false, saveError: message }));
    }
  }, [adapter, state.currentNote, state.currentSha, refreshManifestForCreate]);

  const reloadRemote = useCallback(async () => {
    const note = state.currentNote;
    if (!adapter || !note) return;

    try {
      const { content, sha } = await adapter.readFile(note.path);
      setState((prev) => ({
        ...prev,
        currentContent: content,
        currentSha: sha,
        isDirty: false,
        saveError: null,
      }));

      if (runtimeManifest && sha !== note.runtimeSha) {
        const updated = updateRuntimeEntry(runtimeManifest, note.path, { sha });
        setRuntimeManifest(updated);

        const merged = reconcile(buildManifest, updated);
        updateMergedEntries(merged);
        setState((prev) => ({
          ...prev,
          currentNote: prev.currentNote ? { ...prev.currentNote, runtimeSha: sha } : null,
        }));
      }
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Failed to reload");
      setState((prev) => ({ ...prev, saveError: message }));
    }
  }, [adapter, state.currentNote, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries]);

  const clearSaveError = useCallback(() => {
    setState((prev) => ({ ...prev, saveError: null }));
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.isDirty]);

  return {
    ...state,
    openNote,
    updateContent,
    save,
    createNote,
    deleteNote,
    reloadRemote,
    clearSaveError,
    refreshManifestForCreate,
  };
}
