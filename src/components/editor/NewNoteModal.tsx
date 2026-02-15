"use client";

import { useState } from "react";
import type { EditorConfig } from "@/lib/editor";

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (path: string, content: string) => Promise<void>;
  config: EditorConfig;
}

export function NewNoteModal({ isOpen, onClose, onCreate, config }: NewNoteModalProps) {
  const [newNoteName, setNewNoteName] = useState("");
  const [newNoteType, setNewNoteType] = useState<"note" | "article">("note");

  if (!isOpen) return null;

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

    await onCreate(path, defaultContent);
    setNewNoteName("");
    onClose();
  };

  return (
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
            onClick={() => {
              setNewNoteName("");
              onClose();
            }}
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
  );
}
