"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection } from "../connection/ConnectionProvider";
import { useManifest } from "../manifest/ManifestProvider";
import { useNotes } from "../notes/NotesProvider";
import { NoteList } from "../panes/NoteList";
import { CodeEditor } from "../panes/CodeEditor";
import { PreviewPane } from "../panes/PreviewPane";
import { EditorToolbar } from "../panes/EditorToolbar";
import { ConflictModal } from "../modals/ConflictModal";
import { ResizablePanel } from "../ui/ResizablePanel";
import { SplitViewResizer } from "../ui/SplitViewResizer";
import { EyeIcon, EyeSlashIcon } from "@/components/icons";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { NOTE_LIST_WIDTH, loadUIPrefs, saveUIPrefs } from "../constants/storage";
import { ConnectionPanel } from "../panes/ConnectionPanel";

export function EditorLayout() {
  const { isConnected, isConnecting, mounted, tokenExpired } = useConnection();
  const { mergedEntries } = useManifest();
  const { currentNote, openNote } = useNotes();
  const [showPreview, setShowPreview] = useState(true);
  const [noteListWidth, setNoteListWidth] = useState<number>(() => {
    if (typeof window === "undefined") return NOTE_LIST_WIDTH.DEFAULT;
    return loadUIPrefs().noteListWidth;
  });
  const [initialNoteOpened, setInitialNoteOpened] = useState(false);

  const saveNoteListWidth = useCallback((width: number) => {
    setNoteListWidth(width);
    saveUIPrefs({ noteListWidth: width });
  }, []);

  const togglePreview = useCallback(() => {
    setShowPreview((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isConnected || initialNoteOpened || mergedEntries.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const notePath = params.get("note");
    if (!notePath) {
      setInitialNoteOpened(true);
      return;
    }

    const entry = mergedEntries.find((e) => e.path === notePath);
    if (entry && (!currentNote || currentNote.path !== notePath)) {
      openNote(entry);
    }
    setInitialNoteOpened(true);
  }, [isConnected, mergedEntries, currentNote, openNote, initialNoteOpened]);

  useEffect(() => {
    if (!initialNoteOpened) return;

    const url = new URL(window.location.href);
    if (currentNote) {
      url.searchParams.set("note", currentNote.path);
    } else {
      url.searchParams.delete("note");
    }
    window.history.replaceState(null, "", url.toString());
  }, [currentNote, initialNoteOpened]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading editor…</div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full mx-auto mb-4" />
            <p className="text-muted">Connecting to GitHub…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Nav />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-6 sm:py-8 w-full">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Editor</h1>
          {tokenExpired && (
            <div className="mb-6 p-3 sm:p-4 text-sm sm:text-base text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              Your session has expired. Please reconnect to continue.
            </div>
          )}
          {!tokenExpired && (
            <p className="text-muted text-sm sm:text-base mb-6 sm:mb-8">
              Connect to your GitHub repository to edit notes directly from the browser.
            </p>
          )}
          <ConnectionPanel />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorToolbar />
      
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ResizablePanel
          defaultWidth={NOTE_LIST_WIDTH.DEFAULT}
          minWidth={NOTE_LIST_WIDTH.MIN}
          maxWidth={NOTE_LIST_WIDTH.MAX}
          side="left"
          savedWidth={noteListWidth}
          onSaveWidth={saveNoteListWidth}
        >
          <NoteList />
        </ResizablePanel>
        
        {showPreview ? (
          <SplitViewResizer>
            <CodeEditor />
            <PreviewPane />
          </SplitViewResizer>
        ) : (
          <div className="flex-1 min-w-0 h-full">
            <CodeEditor />
          </div>
        )}
      </div>
      
      <button
        onClick={togglePreview}
        className="fixed bottom-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full shadow-lg transition-colors"
        title={showPreview ? "Hide preview" : "Show preview"}
        aria-label={showPreview ? "Hide preview" : "Show preview"}
      >
        {showPreview ? <EyeSlashIcon /> : <EyeIcon />}
      </button>

      <ConflictModal />
    </div>
  );
}
