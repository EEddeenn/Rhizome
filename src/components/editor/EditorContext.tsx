"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  authStore,
  type EditorConfig,
  type NoteInfo,
  type TokenValidationResult,
  GitHubApiError,
} from "@/lib/editor";
import type { VaultAdapter } from "@/lib/editor";

const DEFAULT_CONFIG: EditorConfig = {
  owner: "",
  repo: "",
  contentRoot: "content",
};

interface EditorState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  notes: NoteInfo[];
  isLoadingNotes: boolean;
  currentNote: NoteInfo | null;
  currentContent: string;
  currentSha: string | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastSaveUrl: string | null;
  config: EditorConfig;
  tokenValidation: TokenValidationResult | null;
  mounted: boolean;
}

interface EditorContextValue extends EditorState {
  adapter: VaultAdapter | null;
  setConfig: (config: Partial<EditorConfig>) => void;
  setToken: (token: string, remember: boolean) => void;
  disconnect: () => void;
  validateAndConnect: () => Promise<void>;
  loadNotes: () => Promise<void>;
  openNote: (note: NoteInfo) => Promise<void>;
  updateContent: (content: string) => void;
  save: () => Promise<void>;
  createNote: (path: string, content: string) => Promise<void>;
  reloadRemote: () => Promise<void>;
  clearSaveError: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return ctx;
}

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  const [state, setState] = useState<EditorState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    notes: [],
    isLoadingNotes: false,
    currentNote: null,
    currentContent: "",
    currentSha: null,
    isDirty: false,
    isSaving: false,
    saveError: null,
    lastSaveUrl: null,
    config: DEFAULT_CONFIG,
    tokenValidation: null,
    mounted: false,
  });

  const [adapter, setAdapter] = useState<VaultAdapter | null>(null);

  useEffect(() => {
    const storedConfig = authStore.getConfig();
    setState((prev) => ({
      ...prev,
      config: storedConfig.owner ? storedConfig : DEFAULT_CONFIG,
      mounted: true,
    }));
  }, []);

  const setConfig = useCallback((config: Partial<EditorConfig>) => {
    authStore.setConfig(config);
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  const setToken = useCallback((token: string, remember: boolean) => {
    authStore.setToken(token, remember);
  }, []);

  const disconnect = useCallback(() => {
    authStore.disconnect();
    setAdapter(null);
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionError: null,
      notes: [],
      currentNote: null,
      currentContent: "",
      currentSha: null,
      isDirty: false,
      tokenValidation: null,
    }));
  }, []);

  const validateAndConnect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, connectionError: null }));

    try {
      const result = await authStore.validateTokenAndRepoAccess();
      setState((prev) => ({ ...prev, tokenValidation: result }));

      if (result.ok) {
        const newAdapter = authStore.createAdapter();
        setAdapter(newAdapter);
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          connectionError: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          connectionError: result.reason || "Connection failed",
        }));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Connection failed";
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionError: message,
      }));
    }
  }, []);

  const loadNotes = useCallback(async () => {
    if (!adapter) return;

    setState((prev) => ({ ...prev, isLoadingNotes: true }));

    try {
      const config = authStore.getConfig();
      const notes = await adapter.listNotes({ root: config.contentRoot });
      setState((prev) => ({ ...prev, notes, isLoadingNotes: false }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load notes";
      setState((prev) => ({
        ...prev,
        isLoadingNotes: false,
        connectionError: message,
      }));
    }
  }, [adapter]);

  const openNote = useCallback(
    async (note: NoteInfo) => {
      if (!adapter) return;

      try {
        const { content, sha } = await adapter.readFile(note.path);
        setState((prev) => ({
          ...prev,
          currentNote: note,
          currentContent: content,
          currentSha: sha,
          isDirty: false,
          saveError: null,
        }));
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to open note";
        setState((prev) => ({ ...prev, saveError: message }));
      }
    },
    [adapter]
  );

  const updateContent = useCallback((content: string) => {
    setState((prev) => ({
      ...prev,
      currentContent: content,
      isDirty: content !== prev.currentContent,
    }));
  }, []);

  const save = useCallback(async () => {
    if (!adapter || !state.currentNote || state.currentSha === null) return;

    setState((prev) => ({ ...prev, isSaving: true, saveError: null }));

    try {
      const config = authStore.getConfig();
      const result = await adapter.writeFile({
        path: state.currentNote.path,
        content: state.currentContent,
        message: `Update ${state.currentNote.name}`,
        sha: state.currentSha ?? undefined,
      });

      setState((prev) => ({
        ...prev,
        isSaving: false,
        isDirty: false,
        currentSha: result.newSha || null,
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
      const message =
        error instanceof Error ? error.message : "Failed to save";
      setState((prev) => ({ ...prev, isSaving: false, saveError: message }));
    }
  }, [adapter, state.currentNote, state.currentContent, state.currentSha]);

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

        const newNote: NoteInfo = {
          path,
          name: path.split("/").pop()?.replace(/\.(md|mdx)$/, "") || path,
          type: path.includes("/notes/") ? "note" : "article",
          sha: result.newSha,
        };

        setState((prev) => ({
          ...prev,
          isSaving: false,
          notes: [...prev.notes, newNote],
          currentNote: newNote,
          currentContent: content,
          currentSha: result.newSha || null,
          isDirty: false,
          lastSaveUrl: result.htmlUrl || null,
        }));
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to create note";
        setState((prev) => ({ ...prev, isSaving: false, saveError: message }));
      }
    },
    [adapter]
  );

  const reloadRemote = useCallback(async () => {
    if (!adapter || !state.currentNote) return;

    try {
      const { content, sha } = await adapter.readFile(state.currentNote.path);
      setState((prev) => ({
        ...prev,
        currentContent: content,
        currentSha: sha,
        isDirty: false,
        saveError: null,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to reload";
      setState((prev) => ({ ...prev, saveError: message }));
    }
  }, [adapter, state.currentNote]);

  const clearSaveError = useCallback(() => {
    setState((prev) => ({ ...prev, saveError: null }));
  }, []);

  useEffect(() => {
    if (state.isConnected && adapter) {
      loadNotes();
    }
  }, [state.isConnected, adapter, loadNotes]);

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

  return (
    <EditorContext.Provider
      value={{
        ...state,
        adapter,
        setConfig,
        setToken,
        disconnect,
        validateAndConnect,
        loadNotes,
        openNote,
        updateContent,
        save,
        createNote,
        reloadRemote,
        clearSaveError,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
