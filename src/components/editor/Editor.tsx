"use client";

import { useState } from "react";
import { EditorProvider, useEditor } from "./EditorContext";
import { ConnectionPanel } from "./ConnectionPanel";
import { NoteList } from "./NoteList";
import { CodeEditor } from "./CodeEditor";
import { PreviewPane } from "./PreviewPane";
import { EditorToolbar } from "./EditorToolbar";
import { ConflictModal } from "./ConflictModal";

function EditorLayout() {
  const { isConnected, mounted } = useEditor();
  const [showPreview, setShowPreview] = useState(true);

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
        <NoteList />
        
        <div className="flex flex-1 min-h-0">
          <CodeEditor />
          
          {showPreview && <PreviewPane />}
        </div>
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

function EyeIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

export function Editor() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
