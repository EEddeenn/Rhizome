import type { MergedEntry } from "@/lib/manifest";

export type NoteSource = "local" | "github" | "pending" | null;

export interface NotesState {
  currentNote: MergedEntry | null;
  currentContent: string;
  currentSha: string | null;
  currentSource: NoteSource;
  isDirty: boolean;
  isLoadingNote: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastSaveUrl: string | null;
  isSyncing: boolean;
  syncError: string | null;
  syncProgress: { current: number; total: number } | null;
}

export const initialNotesState: NotesState = {
  currentNote: null,
  currentContent: "",
  currentSha: null,
  currentSource: null,
  isDirty: false,
  isLoadingNote: false,
  isSaving: false,
  saveError: null,
  lastSaveUrl: null,
  isSyncing: false,
  syncError: null,
  syncProgress: null,
};

export type NotesAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "OPEN_NOTE_START" }
  | { type: "OPEN_NOTE_SUCCESS"; payload: { note: MergedEntry; content: string; sha: string | null; source: NoteSource } }
  | { type: "OPEN_NOTE_ERROR"; payload: string }
  | { type: "UPDATE_CONTENT"; payload: string }
  | { type: "MARK_SAVING" }
  | { type: "SAVE_TO_PENDING"; payload: { source: NoteSource } }
  | { type: "SYNC_START"; payload: { total: number } }
  | { type: "SYNC_PROGRESS"; payload: { current: number; total: number } }
  | { type: "SYNC_SUCCESS"; payload: { sha: string | null; source: NoteSource; htmlUrl: string | null } }
  | { type: "SYNC_ERROR"; payload: string }
  | { type: "SYNC_COMPLETE" }
  | { type: "CLEAR_SAVE_ERROR" }
  | { type: "CLEAR_SYNC_ERROR" }
  | { type: "UPDATE_SHA"; payload: string | null }
  | { type: "CLOSE_NOTE" }
  | { type: "SET_SYNC_PROGRESS"; payload: { current: number; total: number } | null }
  | { type: "RESET_CURRENT_NOTE" };

export function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoadingNote: action.payload };
      
    case "OPEN_NOTE_START":
      return { ...state, isLoadingNote: true, saveError: null };
      
    case "OPEN_NOTE_SUCCESS":
      return {
        ...state,
        currentNote: action.payload.note,
        currentContent: action.payload.content,
        currentSha: action.payload.sha,
        currentSource: action.payload.source,
        isDirty: false,
        isLoadingNote: false,
        saveError: null,
      };
      
    case "OPEN_NOTE_ERROR":
      return { ...state, isLoadingNote: false, saveError: action.payload };
      
    case "UPDATE_CONTENT":
      if (action.payload === state.currentContent) return state;
      return { ...state, currentContent: action.payload, isDirty: true };
      
    case "MARK_SAVING":
      return { ...state, isSaving: true };
      
    case "SAVE_TO_PENDING":
      return {
        ...state,
        isDirty: false,
        currentSource: action.payload.source,
        isSaving: false,
      };
      
    case "SYNC_START":
      return {
        ...state,
        isSyncing: true,
        syncError: null,
        syncProgress: { current: 0, total: action.payload.total },
      };
      
    case "SYNC_PROGRESS":
      return { ...state, syncProgress: action.payload };
      
    case "SYNC_SUCCESS":
      return {
        ...state,
        currentSha: action.payload.sha,
        currentSource: action.payload.source,
        lastSaveUrl: action.payload.htmlUrl,
      };
      
    case "SYNC_ERROR":
      return { ...state, syncError: action.payload };
      
    case "SYNC_COMPLETE":
      return { ...state, isSyncing: false, syncProgress: null };
      
    case "CLEAR_SAVE_ERROR":
      return { ...state, saveError: null };
      
    case "CLEAR_SYNC_ERROR":
      return { ...state, syncError: null };
      
    case "UPDATE_SHA":
      return { ...state, currentSha: action.payload };
      
    case "CLOSE_NOTE":
    case "RESET_CURRENT_NOTE":
      return {
        ...state,
        currentNote: null,
        currentContent: "",
        currentSha: null,
        currentSource: null,
        isDirty: false,
        lastSaveUrl: null,
      };
      
    case "SET_SYNC_PROGRESS":
      return { ...state, syncProgress: action.payload };
      
    default:
      return state;
  }
}
