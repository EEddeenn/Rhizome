"use client";

import { createContext, useContext, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { useNoteOperations } from "../hooks/useNoteOperations";
import type { VaultAdapter, EditorConfig } from "@/lib/editor";
import type { MergedEntry, BuildManifest, RuntimeManifest } from "@/lib/manifest";
import type { PendingChange } from "@/lib/editor/pending-changes";

interface NoteContextValue {
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

const NoteContext = createContext<NoteContextValue | null>(null);

export function useNote() {
  const ctx = useContext(NoteContext);
  if (!ctx) {
    throw new Error("useNote must be used within NoteProvider");
  }
  return ctx;
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

  const value: NoteContextValue = {
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
    hasPendingChanges: notes.hasPendingChanges,
    pendingChangeForCurrentNote: notes.pendingChangeForCurrentNote,
  };

  return (
    <NoteContext.Provider value={value}>
      {children}
    </NoteContext.Provider>
  );
}
