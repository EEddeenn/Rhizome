"use client";

import type { ReactNode } from "react";
import { ConnectionProvider, useConnection } from "./contexts/EditorConnectionContext";
import { ManifestProvider, useManifest } from "./contexts/EditorManifestContext";
import { NoteProvider } from "./contexts/EditorNoteContext";

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  return (
    <ConnectionProvider>
      <ConnectionAdapter>
        {(connection) => (
          <ManifestProvider
            adapter={connection.adapter}
            isConnected={connection.isConnected}
            mounted={connection.mounted}
            config={connection.config}
          >
            <ManifestAdapter>
              {(manifest) => (
                <NoteProvider
                  adapter={connection.adapter}
                  config={connection.config}
                  buildManifest={manifest.buildManifest}
                  runtimeManifest={manifest.runtimeManifest}
                  setRuntimeManifest={manifest.setRuntimeManifest}
                  mergedEntries={manifest.mergedEntries}
                  updateMergedEntries={manifest.updateMergedEntries}
                  onAuthError={connection.markTokenExpired}
                >
                  {children}
                </NoteProvider>
              )}
            </ManifestAdapter>
          </ManifestProvider>
        )}
      </ConnectionAdapter>
    </ConnectionProvider>
  );
}

function ConnectionAdapter({ children }: { children: (value: ReturnType<typeof useConnection>) => ReactNode }) {
  return children(useConnection());
}

function ManifestAdapter({ children }: { children: (value: ReturnType<typeof useManifest>) => ReactNode }) {
  return children(useManifest());
}
