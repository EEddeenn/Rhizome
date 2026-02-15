"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
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
import {
  loadBuildManifest,
  loadRuntimeManifestCache,
  saveRuntimeManifestCache,
  fetchRuntimeManifestFromGitHub,
  updateRuntimeEntry,
  reconcile,
  filterByStatus,
  updateEntrySha,
  type BuildManifest,
  type RuntimeManifest,
  type MergedEntry,
} from "@/lib/manifest";

const DEFAULT_CONFIG: EditorConfig = {
  owner: "",
  repo: "",
  contentRoot: "content",
};

interface EditorState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  mergedEntries: MergedEntry[];
  isLoadingManifest: boolean;
  currentNote: MergedEntry | null;
  currentContent: string;
  currentSha: string | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  lastSaveUrl: string | null;
  config: EditorConfig;
  tokenValidation: TokenValidationResult | null;
  mounted: boolean;
  showMissing: boolean;
  manifestLoadError: string | null;
}

interface EditorContextValue extends EditorState {
  adapter: VaultAdapter | null;
  setConfig: (config: Partial<EditorConfig>) => void;
  setToken: (token: string, remember: boolean) => void;
  disconnect: () => void;
  validateAndConnect: () => Promise<void>;
  loadManifests: () => Promise<void>;
  refreshManifest: () => Promise<MergedEntry[]>;
  openNote: (entry: MergedEntry) => Promise<void>;
  updateContent: (content: string) => void;
  save: () => Promise<void>;
  createNote: (path: string, content: string) => Promise<void>;
  deleteNote: () => Promise<void>;
  reloadRemote: () => Promise<void>;
  clearSaveError: () => void;
  toggleShowMissing: () => void;
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
    mergedEntries: [],
    isLoadingManifest: false,
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
    showMissing: false,
    manifestLoadError: null,
  });

  const [adapter, setAdapter] = useState<VaultAdapter | null>(null);
  const [buildManifest, setBuildManifest] = useState<BuildManifest | null>(null);
  const [runtimeManifest, setRuntimeManifest] = useState<RuntimeManifest | null>(null);

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
    setBuildManifest(null);
    setRuntimeManifest(null);
    setState((prev) => ({
      ...prev,
      isConnected: false,
      connectionError: null,
      mergedEntries: [],
      currentNote: null,
      currentContent: "",
      currentSha: null,
      isDirty: false,
      tokenValidation: null,
      manifestLoadError: null,
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

  const loadManifests = useCallback(async () => {
    if (!adapter) return;

    setState((prev) => ({ ...prev, isLoadingManifest: true, manifestLoadError: null }));

    try {
      const config = authStore.getConfig();
      const repoInfo = await adapter.getRepoInfo();

      // Step 1: Load build manifest (fast boot)
      const build = await loadBuildManifest();
      setBuildManifest(build);

      // Step 2: Load cached runtime manifest and reconcile immediately
      const cachedRuntime = loadRuntimeManifestCache(
        config.owner,
        config.repo,
        repoInfo.defaultBranch,
        config.contentRoot
      );

      if (cachedRuntime) {
        setRuntimeManifest(cachedRuntime);
        const merged = reconcile(build, cachedRuntime);
        setState((prev) => ({
          ...prev,
          mergedEntries: filterByStatus(merged, prev.showMissing),
        }));
      } else {
        // No cache, show build manifest entries initially
        const merged = reconcile(build, null);
        setState((prev) => ({
          ...prev,
          mergedEntries: filterByStatus(merged, prev.showMissing),
        }));
      }

      // Step 3: Fetch fresh runtime manifest from GitHub
      const freshRuntime = await fetchRuntimeManifestFromGitHub(adapter, {
        root: config.contentRoot,
        ref: repoInfo.defaultBranch,
      });

      setRuntimeManifest(freshRuntime);

      // Save to cache
      saveRuntimeManifestCache(
        config.owner,
        config.repo,
        repoInfo.defaultBranch,
        config.contentRoot,
        freshRuntime
      );

      // Reconcile with fresh data
      const merged = reconcile(build, freshRuntime);
      setState((prev) => ({
        ...prev,
        mergedEntries: filterByStatus(merged, prev.showMissing),
        isLoadingManifest: false,
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load manifest";
      setState((prev) => ({
        ...prev,
        isLoadingManifest: false,
        manifestLoadError: message,
      }));
    }
  }, [adapter]);

  const refreshManifest = useCallback(async () => {
    if (!adapter) return [];

    setState((prev) => ({ ...prev, isLoadingManifest: true }));

    try {
      const config = authStore.getConfig();
      const repoInfo = await adapter.getRepoInfo();

      const freshRuntime = await fetchRuntimeManifestFromGitHub(adapter, {
        root: config.contentRoot,
        ref: repoInfo.defaultBranch,
      });

      setRuntimeManifest(freshRuntime);

      saveRuntimeManifestCache(
        config.owner,
        config.repo,
        repoInfo.defaultBranch,
        config.contentRoot,
        freshRuntime
      );

      const merged = reconcile(buildManifest, freshRuntime);
      const filteredMerged = filterByStatus(merged, state.showMissing);
      
      setState((prev) => ({
        ...prev,
        mergedEntries: filterByStatus(merged, prev.showMissing),
        isLoadingManifest: false,
      }));
      
      return filteredMerged;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to refresh manifest";
      setState((prev) => ({
        ...prev,
        isLoadingManifest: false,
        manifestLoadError: message,
      }));
      return [];
    }
  }, [adapter, buildManifest, state.showMissing]);

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
          setState((prev) => ({
            ...prev,
            mergedEntries: filterByStatus(merged, prev.showMissing),
          }));
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to open note";
        setState((prev) => ({ ...prev, saveError: message }));
      }
    },
    [adapter, buildManifest, runtimeManifest]
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
      const result = await adapter.writeFile({
        path: state.currentNote.path,
        content: state.currentContent,
        message: `Update ${state.currentNote.title}`,
        sha: state.currentSha ?? undefined,
      });

      const newSha = result.newSha || null;

      if (runtimeManifest && newSha) {
        const updatedRuntime = updateRuntimeEntry(runtimeManifest, state.currentNote.path, { sha: newSha });
        setRuntimeManifest(updatedRuntime);

        const config = authStore.getConfig();
        const repoInfo = await adapter.getRepoInfo();
        saveRuntimeManifestCache(
          config.owner,
          config.repo,
          repoInfo.defaultBranch,
          config.contentRoot,
          updatedRuntime
        );

        const updatedMerged = updateEntrySha(state.mergedEntries, state.currentNote.path, newSha);
        setState((prev) => ({
          ...prev,
          mergedEntries: updatedMerged,
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
      const message =
        error instanceof Error ? error.message : "Failed to save";
      setState((prev) => ({ ...prev, isSaving: false, saveError: message }));
    }
  }, [adapter, state.currentNote, state.currentContent, state.currentSha, state.mergedEntries, runtimeManifest]);

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

        const updatedEntries = await refreshManifest();
        const newEntry = updatedEntries.find(e => e.path === path);

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
        const message =
          error instanceof Error ? error.message : "Failed to create note";
        setState((prev) => ({ ...prev, isSaving: false, saveError: message }));
      }
    },
    [adapter, refreshManifest]
  );

  const deleteNote = useCallback(async () => {
    if (!adapter || !state.currentNote || state.currentSha === null) return;

    setState((prev) => ({ ...prev, isSaving: true, saveError: null }));

    try {
      await adapter.deleteFile({
        path: state.currentNote!.path,
        sha: state.currentSha!,
        message: `Delete ${state.currentNote!.title}`,
      });

      await refreshManifest();

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
      const message =
        error instanceof Error ? error.message : "Failed to delete note";
      setState((prev) => ({ ...prev, isSaving: false, saveError: message }));
    }
  }, [adapter, state.currentNote, state.currentSha, refreshManifest]);

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

      if (runtimeManifest && sha !== state.currentNote.runtimeSha) {
        const updated = updateRuntimeEntry(runtimeManifest, state.currentNote.path, { sha });
        setRuntimeManifest(updated);
        
        const merged = reconcile(buildManifest, updated);
        setState((prev) => ({
          ...prev,
          mergedEntries: filterByStatus(merged, prev.showMissing),
          currentNote: prev.currentNote ? { ...prev.currentNote, runtimeSha: sha } : null,
        }));
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to reload";
      setState((prev) => ({ ...prev, saveError: message }));
    }
  }, [adapter, state.currentNote, buildManifest, runtimeManifest]);

  const clearSaveError = useCallback(() => {
    setState((prev) => ({ ...prev, saveError: null }));
  }, []);

  const toggleShowMissing = useCallback(() => {
    setState((prev) => {
      const newShowMissing = !prev.showMissing;
      return {
        ...prev,
        showMissing: newShowMissing,
        mergedEntries: filterByStatus(
          reconcile(buildManifest, runtimeManifest),
          newShowMissing
        ),
      };
    });
  }, [buildManifest, runtimeManifest]);

  useEffect(() => {
    if (state.isConnected && adapter) {
      loadManifests();
    }
  }, [state.isConnected, adapter, loadManifests]);

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

  const value = useMemo(
    () => ({
      ...state,
      adapter,
      setConfig,
      setToken,
      disconnect,
      validateAndConnect,
      loadManifests,
      refreshManifest,
      openNote,
      updateContent,
      save,
      createNote,
      deleteNote,
      reloadRemote,
      clearSaveError,
      toggleShowMissing,
    }),
    [
      state,
      adapter,
      setConfig,
      setToken,
      disconnect,
      validateAndConnect,
      loadManifests,
      refreshManifest,
      openNote,
      updateContent,
      save,
      createNote,
      deleteNote,
      reloadRemote,
      clearSaveError,
      toggleShowMissing,
    ]
  );

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}
