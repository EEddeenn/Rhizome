"use client";

import { useState, useEffect, useCallback } from "react";
import { useNote } from "./contexts/EditorNoteContext";
import { useConnection } from "./contexts/EditorConnectionContext";
import { SettingsIcon, SyncIcon } from "@/components/icons";
import { NewItemModal } from "./NewItemModal";
import { SettingsModal } from "./SettingsModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export function EditorToolbar() {
  const {
    currentNote,
    isDirty,
    saveError,
    lastSaveUrl,
    save,
    createNote,
    uploadPdf,
    deleteNote,
    isSyncing,
    syncError,
    syncProgress,
    sync,
    discardAllPending,
    hasPendingChanges,
    clearSyncError,
  } = useNote();
  const { config, setConfig, disconnect } = useConnection();

  const [showNewItem, setShowNewItem] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleDiscardConfirm = useCallback(() => {
    discardAllPending();
    setShowDiscardConfirm(false);
  }, [discardAllPending]);

  useEffect(() => {
    if (!showDiscardConfirm) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDiscardConfirm(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDiscardConfirm]);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewItem(true)}
            className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            New
          </button>

          {currentNote && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-lg transition-colors"
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
            disabled={!currentNote || currentNote.type === "pdf" || !isDirty}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              currentNote?.type === "pdf" 
                ? "bg-gray-400 cursor-not-allowed text-white"
                : isDirty 
                  ? "text-white bg-blue-600 hover:bg-blue-700"
                  : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
            }`}
          >
            {currentNote?.type === "pdf" ? "PDF" : isDirty ? "Save" : "Saved"}
          </button>

          <button
            onClick={() => {
              clearSyncError();
              sync();
            }}
            disabled={isSyncing || !hasPendingChanges}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            aria-label="Sync changes"
          >
            <SyncIcon className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} aria-hidden="true" />
            {isSyncing && syncProgress 
              ? `Syncing ${syncProgress.current}/${syncProgress.total}…` 
              : "Sync"}
          </button>

          {hasPendingChanges && (
            <button
              onClick={() => setShowDiscardConfirm(true)}
              disabled={isSyncing}
              className="px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Discard
            </button>
          )}

          {syncError && (
            <div 
              className="absolute top-12 right-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg shadow-lg max-w-sm z-50"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-line">{syncError}</p>
              <button 
                onClick={clearSyncError}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon aria-hidden="true" />
          </button>
        </div>
      </div>

      <NewItemModal
        isOpen={showNewItem}
        onClose={() => setShowNewItem(false)}
        onCreateNote={createNote}
        onUploadPdf={uploadPdf}
        config={config}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        onConfigChange={setConfig}
        onDisconnect={disconnect}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteNote}
        currentNote={currentNote}
        isDeleting={false}
      />

      {showDiscardConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDiscardConfirm(false);
          }}
        >
          <div className="bg-background rounded-lg shadow-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Discard Pending Changes?</h3>
            <p className="text-sm text-muted mb-4">
              This will permanently discard all pending changes. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscardConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                Discard All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
