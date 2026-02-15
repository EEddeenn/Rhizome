"use client";

import { useState, useMemo } from "react";
import { useEditor } from "./EditorContext";
import type { MergedEntry } from "@/lib/manifest";
import { RefreshIcon } from "@/components/icons";

export function NoteList() {
  const { 
    mergedEntries, 
    isLoadingManifest, 
    currentNote, 
    openNote, 
    refreshManifest,
    showMissing,
    toggleShowMissing,
  } = useEditor();
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "note" | "article">("all");

  const filteredEntries = useMemo(() => {
    return mergedEntries.filter((entry) => {
      const matchesSearch =
        !search ||
        entry.title.toLowerCase().includes(search.toLowerCase()) ||
        entry.path.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || entry.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [mergedEntries, search, filter]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, MergedEntry[]> = {};
    for (const entry of filteredEntries) {
      const group = entry.type === "note" ? "Notes" : "Articles";
      if (!groups[group]) groups[group] = [];
      groups[group].push(entry);
    }
    return groups;
  }, [filteredEntries]);

  if (isLoadingManifest && mergedEntries.length === 0) {
    const skeletonWidths = ["90%", "85%", "95%", "80%", "88%"];
    return (
      <div className="w-64 min-w-48 shrink-0 border-r border-border p-4">
        <div className="animate-pulse space-y-2">
          {skeletonWidths.map((width, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ width }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 min-w-48 border-r border-border flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
          <button
            onClick={refreshManifest}
            disabled={isLoadingManifest}
            className="shrink-0 px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            title="Refresh from GitHub"
          >
            <RefreshIcon className={`w-4 h-4 ${isLoadingManifest ? "animate-spin" : ""}`} />
          </button>
        </div>
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
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={showMissing}
            onChange={toggleShowMissing}
            className="rounded border-border"
          />
          Show missing
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedEntries).map(([group, groupEntries]) => (
          <div key={group}>
            <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide">
              {group} ({groupEntries.length})
            </div>
            {groupEntries.map((entry) => (
              <EntryListItem
                key={entry.path}
                entry={entry}
                isActive={currentNote?.path === entry.path}
                onClick={() => openNote(entry)}
              />
            ))}
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <div className="p-4 text-center text-sm text-muted">
            {mergedEntries.length === 0 ? "No notes found" : "No matching notes"}
          </div>
        )}
      </div>
    </div>
  );
}

interface EntryListItemProps {
  entry: MergedEntry;
  isActive: boolean;
  onClick: () => void;
}

function EntryListItem({ entry, isActive, onClick }: EntryListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="truncate font-medium">{entry.title}</span>
        <StatusBadge status={entry.syncStatus} />
      </div>
      <span className="truncate text-xs text-muted">{entry.slug}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: "indexed" | "new" | "missing" }) {
  if (status === "indexed") return null;
  
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded ${
        status === "new"
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      }`}
    >
      {status === "new" ? "New" : "Missing"}
    </span>
  );
}
