"use client";

import { useState } from "react";
import { EditorProvider, useEditor } from "./EditorContext";
import { ConnectionPanel } from "./ConnectionPanel";
import { NoteList } from "./NoteList";
import { CodeEditor } from "./CodeEditor";
import { PreviewPane } from "./PreviewPane";
import { EditorToolbar } from "./EditorToolbar";
import { ConflictModal } from "./ConflictModal";
import { EyeIcon, EyeSlashIcon } from "@/components/icons";

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

export function Editor() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
