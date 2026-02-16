"use client";

import { type Dispatch, type SetStateAction } from "react";
import type { VaultAdapter } from "@/lib/editor";
import type { MergedEntry, BuildManifest, RuntimeManifest } from "@/lib/manifest";
import type { PendingChange } from "@/lib/editor/pending-changes";
import { useNoteState, type NoteState } from "./useNoteState";
import { useNoteMutations } from "./useNoteMutations";
import { useNoteSync } from "./useNoteSync";

export type { NoteState } from "./useNoteState";

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
  const noteState = useNoteState();
  const { state, pendingChangeForCurrentNote, hasPendingChanges } = noteState;

  const mutations = useNoteMutations({
    adapter,
    config,
    buildManifest,
    runtimeManifest,
    setRuntimeManifest,
    updateMergedEntries,
    onAuthError,
    noteState,
  });

  const syncOperations = useNoteSync({
    adapter,
    config,
    buildManifest,
    runtimeManifest,
    setRuntimeManifest,
    updateMergedEntries,
    onAuthError,
    noteState,
    save: mutations.save,
  });

  return {
    ...state,
    ...mutations,
    ...syncOperations,
    hasPendingChanges,
    pendingChangeForCurrentNote,
  };
}

