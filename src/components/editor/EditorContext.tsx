"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { MergedEntry } from "@/lib/manifest";
import type { VaultAdapter } from "@/lib/editor";
import {
  useEditorConnection,
  useManifestOperations,
  useNoteOperations,
} from "./hooks";

interface EditorContextValue {
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
  isLoadingNote: boolean;
  config: {
    owner: string;
    repo: string;
    contentRoot: string;
  };
  tokenValidation: {
    ok: boolean;
    reason?: string;
    repoAccess?: boolean;
    writeAccess?: boolean;
  } | null;
  mounted: boolean;
  showMissing: boolean;
  manifestLoadError: string | null;
  adapter: VaultAdapter | null;
  tokenExpired: boolean;
  autoLogin: boolean;
  setConfig: (config: Partial<{ owner: string; repo: string; contentRoot: string }>) => void;
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
  clearTokenExpired: () => void;
  setAutoLogin: (enabled: boolean) => void;
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
  const connection = useEditorConnection();

  const manifest = useManifestOperations({
    adapter: connection.adapter,
    isConnected: connection.isConnected,
    mounted: connection.mounted,
    config: connection.config,
  });

  const notes = useNoteOperations({
    adapter: connection.adapter,
    config: connection.config,
    buildManifest: manifest.buildManifest,
    runtimeManifest: manifest.runtimeManifest,
    setRuntimeManifest: manifest.setRuntimeManifest,
    mergedEntries: manifest.mergedEntries,
    updateMergedEntries: manifest.updateMergedEntries,
    onAuthError: connection.markTokenExpired,
  });

  const value = useMemo<EditorContextValue>(
    () => ({
      isConnected: connection.isConnected,
      isConnecting: connection.isConnecting,
      connectionError: connection.connectionError,
      mergedEntries: manifest.mergedEntries,
      isLoadingManifest: manifest.isLoadingManifest,
      currentNote: notes.currentNote,
      currentContent: notes.currentContent,
      currentSha: notes.currentSha,
      isDirty: notes.isDirty,
      isSaving: notes.isSaving,
      saveError: notes.saveError,
      lastSaveUrl: notes.lastSaveUrl,
      isLoadingNote: notes.isLoadingNote,
      config: connection.config,
      tokenValidation: connection.tokenValidation,
      mounted: connection.mounted,
      showMissing: manifest.showMissing,
      manifestLoadError: manifest.manifestLoadError,
      adapter: connection.adapter,
      tokenExpired: connection.tokenExpired,
      autoLogin: connection.autoLogin,
      setConfig: connection.setConfig,
      setToken: connection.setToken,
      disconnect: connection.disconnect,
      validateAndConnect: connection.validateAndConnect,
      loadManifests: manifest.loadManifests,
      refreshManifest: manifest.refreshManifest,
      openNote: notes.openNote,
      updateContent: notes.updateContent,
      save: notes.save,
      createNote: notes.createNote,
      deleteNote: notes.deleteNote,
      reloadRemote: notes.reloadRemote,
      clearSaveError: notes.clearSaveError,
      toggleShowMissing: manifest.toggleShowMissing,
      clearTokenExpired: connection.clearTokenExpired,
      setAutoLogin: connection.setAutoLogin,
    }),
    [connection, manifest, notes]
  );

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}
