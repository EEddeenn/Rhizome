"use client";

import { createContext, useContext, useMemo, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { useNoteOperations } from "../hooks/useNoteOperations";
import type { VaultAdapter, EditorConfig } from "@/lib/editor";
import type { MergedEntry, BuildManifest, RuntimeManifest } from "@/lib/manifest";

interface NoteContextValue {
  currentNote: MergedEntry | null;
  currentContent: string;
  currentSha: string | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastSaveUrl: string | null;
  isLoadingNote: boolean;
  openNote: (entry: MergedEntry) => Promise<void>;
  updateContent: (content: string) => void;
  save: () => Promise<void>;
  createNote: (path: string, content: string) => Promise<void>;
  deleteNote: () => Promise<void>;
  reloadRemote: () => Promise<void>;
  clearSaveError: () => void;
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

  const value = useMemo<NoteContextValue>(() => ({
    currentNote: notes.currentNote,
    currentContent: notes.currentContent,
    currentSha: notes.currentSha,
    isDirty: notes.isDirty,
    isSaving: notes.isSaving,
    saveError: notes.saveError,
    lastSaveUrl: notes.lastSaveUrl,
    isLoadingNote: notes.isLoadingNote,
    openNote: notes.openNote,
    updateContent: notes.updateContent,
    save: notes.save,
    createNote: notes.createNote,
    deleteNote: notes.deleteNote,
    reloadRemote: notes.reloadRemote,
    clearSaveError: notes.clearSaveError,
  }), [notes]);

  return (
    <NoteContext.Provider value={value}>
      {children}
    </NoteContext.Provider>
  );
}
