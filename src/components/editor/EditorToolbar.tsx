"use client";

import { useState } from "react";
import { useEditor } from "./EditorContext";

export function EditorToolbar() {
  const {
    currentNote,
    isDirty,
    isSaving,
    saveError,
    lastSaveUrl,
    save,
    createNote,
    config,
    setConfig,
  } = useEditor();

  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteName, setNewNoteName] = useState("");
  const [newNoteType, setNewNoteType] = useState<"note" | "article">("note");
  const [showSettings, setShowSettings] = useState(false);

  const handleSave = async () => {
    await save();
  };

  const handleCreateNote = async () => {
    if (!newNoteName.trim()) return;

    const slug = newNoteName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const path = `${config.contentRoot}/${newNoteType}s/${slug}.mdx`;
    const defaultContent = `---
title: "${newNoteName}"
date: "${new Date().toISOString().split("T")[0]}"
type: "${newNoteType}"
tags: []
---

Content goes here.
`;

    await createNote(path, defaultContent);
    setShowNewNote(false);
    setNewNoteName("");
  };

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
            onClick={handleSave}
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

      {showNewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Note</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Note title"
                  value={newNoteName}
                  onChange={(e) => setNewNoteName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNote()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <div className="flex gap-2">
                  {(["note", "article"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewNoteType(type)}
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        newNoteType === type
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewNote(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNoteName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Content Root</label>
                <input
                  type="text"
                  value={config.contentRoot}
                  onChange={(e) => setConfig({ contentRoot: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SettingsIcon() {
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
