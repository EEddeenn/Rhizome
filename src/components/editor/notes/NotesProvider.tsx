"use client";

import { createContext, useContext, useReducer, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { MergedEntry, RuntimeManifest } from "@/lib/manifest";
import type { PendingChange } from "@/lib/editor/pending-changes";

import { notesReducer, initialNotesState, type NotesState, type NotesAction, type NoteSource } from "./notesReducer";
import {
  openNoteFromSource,
  openPdfNote,
  saveToPendingChanges,
  createNewNote,
  uploadNewPdf,
  deleteFromPendingOrRemote,
  getPendingChangeForPath,
  hasPendingChanges,
  getAllPendingChanges,
  discardAllPending,
  updateManifestAfterSync,
} from "./operations";
import { syncPendingChanges, type SyncCallbacks } from "./sync";
import { useConnection } from "../connection/ConnectionProvider";
import { useManifest } from "../manifest/ManifestProvider";
import { pendingChanges } from "@/lib/editor/pending-changes";

export interface NotesActions {
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
}

export interface NotesContextValue extends NotesState {
  hasPendingChanges: boolean;
  pendingChangeForCurrentNote: PendingChange | null;
  allPendingChanges: PendingChange[];
}

export type UseNotesReturn = NotesContextValue & NotesActions;

const NotesContext = createContext<UseNotesReturn | null>(null);

export function useNotes(): UseNotesReturn {
  const ctx = useContext(NotesContext);
  if (!ctx) {
    throw new Error("useNotes must be used within NotesProvider");
  }
  return ctx;
}

export { useNotes as useNote };

export type { NotesState, NotesAction, NoteSource };

interface NotesProviderProps {
  children: ReactNode;
}

export function NotesProvider({ children }: NotesProviderProps) {
  const { adapter, config, markTokenExpired } = useConnection();
  const { buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries } = useManifest();
  
  const [state, dispatch] = useReducer(notesReducer, initialNotesState);
  const stateRef = useRef(state);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  const [pendingChangesVersion, setPendingChangesVersion] = useState(0);
  
  useEffect(() => {
    return pendingChanges.subscribe(() => {
      setPendingChangesVersion((v) => v + 1);
    });
  }, []);

  const openNote = useCallback(async (entry: MergedEntry) => {
    const pendingChange = getPendingChangeForPath(entry.path);
    
    if (pendingChange) {
      if (pendingChange.type === "delete") {
        return;
      }
      dispatch({
        type: "OPEN_NOTE_SUCCESS",
        payload: {
          note: entry,
          content: pendingChange.content || "",
          sha: pendingChange.originalSha || null,
          source: "pending",
        },
      });
      return;
    }

    if (stateRef.current.currentNote?.path === entry.path && stateRef.current.currentContent) {
      return;
    }

    dispatch({ type: "OPEN_NOTE_START" });

    if (entry.type === "pdf") {
      try {
        let sha: string | null = null;
        if (adapter) {
          const result = await openPdfNote(entry, adapter);
          sha = result?.sha ?? null;
        }
        dispatch({
          type: "OPEN_NOTE_SUCCESS",
          payload: {
            note: entry,
            content: "",
            sha,
            source: null,
          },
        });
      } catch {
        dispatch({ type: "OPEN_NOTE_SUCCESS", payload: { note: entry, content: "", sha: null, source: null } });
      }
      return;
    }

    try {
      const result = await openNoteFromSource(entry, adapter);
      
      if (!result) {
        dispatch({ type: "OPEN_NOTE_ERROR", payload: "Failed to load note content" });
        return;
      }

      dispatch({
        type: "OPEN_NOTE_SUCCESS",
        payload: {
          note: entry,
          content: result.content,
          sha: result.sha,
          source: result.source,
        },
      });

      if (result.source === "github" && runtimeManifest && result.sha && result.sha !== entry.runtimeSha) {
        updateManifestAfterSync(
          buildManifest,
          runtimeManifest,
          entry.path,
          result.sha,
          (manifest) => setRuntimeManifest(() => manifest),
          updateMergedEntries
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to open note";
      dispatch({ type: "OPEN_NOTE_ERROR", payload: message });
    }
  }, [adapter, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries]);

  const updateContent = useCallback((content: string) => {
    dispatch({ type: "UPDATE_CONTENT", payload: content });
  }, []);

  const save = useCallback(() => {
    const { currentNote, currentContent, currentSha, currentSource } = stateRef.current;
    if (!currentNote || currentNote.type === "pdf") return;

    saveToPendingChanges(currentNote.path, currentContent, currentSha, currentSource);
    dispatch({ type: "SAVE_TO_PENDING", payload: { source: "pending" } });
  }, []);

  const createNote = useCallback(async (path: string, content: string) => {
    const existing = getPendingChangeForPath(path);
    if (existing && existing.type !== "delete") {
      dispatch({ type: "OPEN_NOTE_ERROR", payload: "A file with this name already exists" });
      return;
    }

    const newEntry = createNewNote(path, content);
    dispatch({
      type: "OPEN_NOTE_SUCCESS",
      payload: {
        note: newEntry,
        content,
        sha: null,
        source: "pending",
      },
    });
  }, []);

  const uploadPdf = useCallback(async (path: string, base64Content: string) => {
    const existing = getPendingChangeForPath(path);
    if (existing && existing.type !== "delete") {
      dispatch({ type: "OPEN_NOTE_ERROR", payload: "A file with this name already exists" });
      return;
    }

    const newEntry = uploadNewPdf(path, base64Content);
    dispatch({
      type: "OPEN_NOTE_SUCCESS",
      payload: {
        note: newEntry,
        content: "",
        sha: null,
        source: "pending",
      },
    });
  }, []);

  const deleteNote = useCallback(async () => {
    const { currentNote, currentSha } = stateRef.current;
    if (!currentNote) return;

    await deleteFromPendingOrRemote(currentNote.path, currentSha, adapter);
    dispatch({ type: "RESET_CURRENT_NOTE" });
  }, [adapter]);

  const reloadRemote = useCallback(async () => {
    const { currentNote } = stateRef.current;
    if (!adapter || !currentNote) return;

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      if (currentNote.type === "pdf") {
        const { sha } = await adapter.readFileRaw(currentNote.path);
        dispatch({ type: "OPEN_NOTE_SUCCESS", payload: { note: currentNote, content: "", sha, source: "github" } });
        pendingChanges.removeChange(currentNote.path);
      } else {
        const { content, sha } = await adapter.readFile(currentNote.path);
        dispatch({ type: "OPEN_NOTE_SUCCESS", payload: { note: currentNote, content, sha, source: "github" } });
        pendingChanges.removeChange(currentNote.path);

        if (runtimeManifest && sha !== currentNote.runtimeSha) {
          updateManifestAfterSync(
            buildManifest,
            runtimeManifest,
            currentNote.path,
            sha,
            (manifest) => setRuntimeManifest(() => manifest),
            updateMergedEntries
          );
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reload";
      dispatch({ type: "OPEN_NOTE_ERROR", payload: message });
    }
  }, [adapter, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries]);

  const clearSaveError = useCallback(() => {
    dispatch({ type: "CLEAR_SAVE_ERROR" });
  }, []);

  const clearSyncError = useCallback(() => {
    dispatch({ type: "CLEAR_SYNC_ERROR" });
  }, []);

  const sync = useCallback(async () => {
    if (!adapter) return;

    const changes = getAllPendingChanges();
    if (changes.length === 0) return;

    const callbacks: SyncCallbacks = {
      onStart: (total) => {
        dispatch({ type: "SYNC_START", payload: { total } });
      },
      onProgress: (current, total) => {
        dispatch({ type: "SYNC_PROGRESS", payload: { current, total } });
      },
      onSuccess: () => {},
      onError: () => {},
      onComplete: () => {
        dispatch({ type: "SYNC_COMPLETE" });
      },
    };

    const syncContext = {
      adapter,
      config,
      buildManifest,
      runtimeManifest,
      updateRuntimeManifest: (manifest: RuntimeManifest) => setRuntimeManifest(() => manifest),
      updateMergedEntries,
      onAuthError: markTokenExpired,
      currentNotePath: stateRef.current.currentNote?.path ?? null,
      onCurrentNoteSynced: (sha: string | null, htmlUrl: string | null) => {
        dispatch({ type: "SYNC_SUCCESS", payload: { sha, source: "github", htmlUrl } });
      },
    };

    await syncPendingChanges(syncContext, callbacks);
  }, [adapter, config, buildManifest, runtimeManifest, setRuntimeManifest, updateMergedEntries, markTokenExpired]);

  const handleDiscardAllPending = useCallback(() => {
    discardAllPending();
    if (stateRef.current.currentSource === "pending") {
      dispatch({ type: "RESET_CURRENT_NOTE" });
    }
  }, []);

  useEffect(() => {
    const { currentNote, isDirty } = stateRef.current;
    
    if (!currentNote || currentNote.type === "pdf" || !isDirty) return;
    
    const timeoutId = setTimeout(() => {
      save();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state.currentContent, state.isDirty, save]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges() || stateRef.current.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const contextValue = useMemo<UseNotesReturn>(() => {
    const pendingChangeForCurrentNote = state.currentNote 
      ? (getPendingChangeForPath(state.currentNote.path) ?? null)
      : null;

    return {
      ...state,
      hasPendingChanges: hasPendingChanges(),
      pendingChangeForCurrentNote,
      allPendingChanges: getAllPendingChanges(),
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
      discardAllPending: handleDiscardAllPending,
    };
  }, [
    state,
    pendingChangesVersion,
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
    handleDiscardAllPending,
  ]);

  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
}
