"use client";

import { useState, useEffect, useRef } from "react";
import type { MergedEntry } from "@/lib/manifest";
import { pendingChanges } from "@/lib/editor/pending-changes";

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

const INITIAL_STATE: NoteState = {
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
};

export function useNoteState() {
  const [state, setState] = useState<NoteState>(INITIAL_STATE);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    return pendingChanges.subscribe(() => forceUpdate((n) => n + 1));
  }, []);

  const pendingChangeForCurrentNote = state.currentNote 
    ? (pendingChanges.getChange(state.currentNote.path) ?? null)
    : null;

  const hasPendingChanges = pendingChanges.hasPendingChanges;

  return {
    state,
    stateRef,
    setState,
    pendingChangeForCurrentNote,
    hasPendingChanges,
  };
}

export type NoteStateHook = ReturnType<typeof useNoteState>;
