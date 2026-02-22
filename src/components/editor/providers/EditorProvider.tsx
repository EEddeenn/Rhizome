"use client";

import type { ReactNode } from "react";
import { ConnectionProvider } from "../connection/ConnectionProvider";
import { ManifestProvider } from "../manifest/ManifestProvider";
import { NotesProvider } from "../notes/NotesProvider";
import { ContentCacheProvider } from "@/components/context/ContentCacheContext";

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps) {
  return (
    <ContentCacheProvider>
      <ConnectionProvider>
        <ManifestProvider>
          <NotesProvider>
            {children}
          </NotesProvider>
        </ManifestProvider>
      </ConnectionProvider>
    </ContentCacheProvider>
  );
}
