"use client";

import { useState, useMemo } from "react";
import { useEditor } from "./EditorContext";
import type { NoteInfo } from "@/lib/editor";

export function NoteList() {
  const { notes, isLoadingNotes, currentNote, openNote } = useEditor();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "note" | "article">("all");

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        !search ||
        note.name.toLowerCase().includes(search.toLowerCase()) ||
        note.path.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || note.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [notes, search, filter]);

  const groupedNotes = useMemo(() => {
    const groups: Record<string, NoteInfo[]> = {};
    for (const note of filteredNotes) {
      const group = note.type === "note" ? "Notes" : "Articles";
      if (!groups[group]) groups[group] = [];
      groups[group].push(note);
    }
    return groups;
  }, [filteredNotes]);

  if (isLoadingNotes) {
    return (
      <div className="w-64 border-r border-border p-4">
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ width: `${80 + Math.random() * 20}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border flex flex-col h-full">
      <div className="p-3 border-b border-border space-y-2">
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        <div className="flex gap-1">
          {(["all", "note", "article"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-2 py-1 text-xs rounded-md transition-colors ${
                filter === f
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {f === "all" ? "All" : f === "note" ? "Notes" : "Articles"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedNotes).map(([group, groupNotes]) => (
          <div key={group}>
            <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide">
              {group} ({groupNotes.length})
            </div>
            {groupNotes.map((note) => (
              <NoteListItem
                key={note.path}
                note={note}
                isActive={currentNote?.path === note.path}
                onClick={() => openNote(note)}
              />
            ))}
          </div>
        ))}
        {filteredNotes.length === 0 && (
          <div className="p-4 text-center text-sm text-muted">
            {notes.length === 0 ? "No notes found" : "No matching notes"}
          </div>
        )}
      </div>
    </div>
  );
}

interface NoteListItemProps {
  note: NoteInfo;
  isActive: boolean;
  onClick: () => void;
}

function NoteListItem({ note, isActive, onClick }: NoteListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <div className="truncate font-medium">{note.name}</div>
      <div className="truncate text-xs text-muted">{note.path}</div>
    </button>
  );
}
