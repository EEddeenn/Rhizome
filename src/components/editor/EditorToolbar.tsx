"use client";

import { useState } from "react";
import { useEditor } from "./EditorContext";
import { SettingsIcon } from "@/components/icons";
import { NewNoteModal } from "./NewNoteModal";
import { SettingsModal } from "./SettingsModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export function EditorToolbar() {
  const {
    currentNote,
    isDirty,
    isSaving,
    saveError,
    lastSaveUrl,
    save,
    createNote,
    deleteNote,
    config,
    setConfig,
  } = useEditor();

  const [showNewNote, setShowNewNote] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewNote(true)}
            className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            New Note
          </button>

          {currentNote && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Delete
            </button>
          )}

          {currentNote && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm text-muted truncate max-w-[200px]">
                {currentNote.title}
              </span>
              {isDirty && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  (unsaved)
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastSaveUrl && (
            <a
              href={lastSaveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-foreground"
            >
              View commit
            </a>
          )}

          {saveError && !saveError.startsWith("CONFLICT:") && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {saveError}
            </span>
          )}

          <button
            onClick={save}
            disabled={!currentNote || !isDirty || isSaving}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      <NewNoteModal
        isOpen={showNewNote}
        onClose={() => setShowNewNote(false)}
        onCreate={createNote}
        config={config}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        onConfigChange={setConfig}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteNote}
        currentNote={currentNote}
        isDeleting={isSaving}
      />
    </>
  );
}
