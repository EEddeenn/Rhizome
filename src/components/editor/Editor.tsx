"use client";

import { useState, useEffect } from "react";
import { EditorProvider, useEditor } from "./EditorContext";
import { ConnectionPanel } from "./ConnectionPanel";
import { NoteList } from "./NoteList";
import { CodeEditor } from "./CodeEditor";
import { PreviewPane } from "./PreviewPane";
import { EditorToolbar } from "./EditorToolbar";
import { ConflictModal } from "./ConflictModal";
import { ResizablePanel } from "./ResizablePanel";
import { SplitViewResizer } from "./SplitViewResizer";
import { EyeIcon, EyeSlashIcon } from "@/components/icons";

const STORAGE_KEY_NOTE_LIST = "rhizome_editor_note_list_width";
const DEFAULT_NOTE_LIST_WIDTH = 256;
const MIN_NOTE_LIST_WIDTH = 180;
const MAX_NOTE_LIST_WIDTH = 400;

function EditorLayout() {
  const { isConnected, mounted, mergedEntries, currentNote, openNote } = useEditor();
  const [showPreview, setShowPreview] = useState(true);
  const [noteListWidth, setNoteListWidth] = useState(DEFAULT_NOTE_LIST_WIDTH);
  const [initialNoteOpened, setInitialNoteOpened] = useState(false);

  useEffect(() => {
    const savedNoteList = localStorage.getItem(STORAGE_KEY_NOTE_LIST);
    if (savedNoteList) setNoteListWidth(parseInt(savedNoteList, 10));
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

  const saveNoteListWidth = (width: number) => {
    localStorage.setItem(STORAGE_KEY_NOTE_LIST, String(width));
    setNoteListWidth(width);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading editor...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Editor</h1>
          <ConnectionPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorToolbar />
      
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ResizablePanel
          defaultWidth={DEFAULT_NOTE_LIST_WIDTH}
          minWidth={MIN_NOTE_LIST_WIDTH}
          maxWidth={MAX_NOTE_LIST_WIDTH}
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
        onClick={() => setShowPreview(!showPreview)}
        className="fixed bottom-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full shadow-lg transition-colors"
        title={showPreview ? "Hide preview" : "Show preview"}
      >
        {showPreview ? <EyeSlashIcon /> : <EyeIcon />}
      </button>

      <ConflictModal />
    </div>
  );
}

export function Editor() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
