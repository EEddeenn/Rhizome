"use client";

import { createContext, useContext, useMemo, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { useNoteOperations } from "../hooks/useNoteOperations";
import type { VaultAdapter, EditorConfig } from "@/lib/editor";
import type { MergedEntry, BuildManifest, RuntimeManifest } from "@/lib/manifest";
import type { PendingChange } from "@/lib/editor/pending-changes";

interface NoteStateValue {
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
  hasPendingChanges: boolean;
  pendingChangeForCurrentNote: PendingChange | null;
}

interface NoteActionsValue {
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

const NoteStateContext = createContext<NoteStateValue | null>(null);
const NoteActionsContext = createContext<NoteActionsValue | null>(null);

export function useNoteState() {
  const ctx = useContext(NoteStateContext);
  if (!ctx) {
    throw new Error("useNoteState must be used within NoteProvider");
  }
  return ctx;
}

export function useNoteActions() {
  const ctx = useContext(NoteActionsContext);
  if (!ctx) {
    throw new Error("useNoteActions must be used within NoteProvider");
  }
  return ctx;
}

export function useNote() {
  return { ...useNoteState(), ...useNoteActions() };
}

interface NoteProviderProps {
  children: ReactNode;
  adapter: VaultAdapter | null;
  config: EditorConfig;
  buildManifest: BuildManifest | null;
  runtimeManifest: RuntimeManifest | null;
  setRuntimeManifest: Dispatch<SetStateAction<RuntimeManifest | null>>;
  mergedEntries: MergedEntry[];
  updateMergedEntries: (entries: MergedEntry[]) => void;
  onAuthError?: () => void;
}

export function NoteProvider({
  children,
  adapter,
  config,
  buildManifest,
  runtimeManifest,
  setRuntimeManifest,
  mergedEntries,
  updateMergedEntries,
  onAuthError,
}: NoteProviderProps) {
  const notes = useNoteOperations({
    adapter,
    config,
    buildManifest,
    runtimeManifest,
    setRuntimeManifest,
    mergedEntries,
    updateMergedEntries,
    onAuthError,
  });

  const stateValue: NoteStateValue = useMemo(() => ({
    currentNote: notes.currentNote,
    currentContent: notes.currentContent,
    currentSha: notes.currentSha,
    currentSource: notes.currentSource,
    isDirty: notes.isDirty,
    isSaving: notes.isSaving,
    saveError: notes.saveError,
    lastSaveUrl: notes.lastSaveUrl,
    isLoadingNote: notes.isLoadingNote,
    isSyncing: notes.isSyncing,
    syncError: notes.syncError,
    syncProgress: notes.syncProgress,
    hasPendingChanges: notes.hasPendingChanges,
    pendingChangeForCurrentNote: notes.pendingChangeForCurrentNote,
  }), [
    notes.currentNote,
    notes.currentContent,
    notes.currentSha,
    notes.currentSource,
    notes.isDirty,
    notes.isSaving,
    notes.saveError,
    notes.lastSaveUrl,
    notes.isLoadingNote,
    notes.isSyncing,
    notes.syncError,
    notes.syncProgress,
    notes.hasPendingChanges,
    notes.pendingChangeForCurrentNote,
  ]);

  const actionsValue: NoteActionsValue = useMemo(() => ({
    openNote: notes.openNote,
    updateContent: notes.updateContent,
    save: notes.save,
    createNote: notes.createNote,
    uploadPdf: notes.uploadPdf,
    deleteNote: notes.deleteNote,
    reloadRemote: notes.reloadRemote,
    clearSaveError: notes.clearSaveError,
    clearSyncError: notes.clearSyncError,
    sync: notes.sync,
    discardAllPending: notes.discardAllPending,
  }), [
    notes.openNote,
    notes.updateContent,
    notes.save,
    notes.createNote,
    notes.uploadPdf,
    notes.deleteNote,
    notes.reloadRemote,
    notes.clearSaveError,
    notes.clearSyncError,
    notes.sync,
    notes.discardAllPending,
  ]);

  return (
    <NoteStateContext.Provider value={stateValue}>
      <NoteActionsContext.Provider value={actionsValue}>
        {children}
      </NoteActionsContext.Provider>
    </NoteStateContext.Provider>
  );
}

