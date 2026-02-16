"use client";

import { useState, useMemo, useEffect } from "react";
import { useManifest, useNote } from "./contexts";
import { pendingChanges, type PendingChange } from "@/lib/editor/pending-changes";
import { createEntryFromPath, type MergedEntry } from "@/lib/manifest";
import type { PendingChangeType } from "@/lib/editor/pending-changes";
import { RefreshIcon } from "@/components/icons";

function useAllPendingChanges(): PendingChange[] {
  const [changes, setChanges] = useState<PendingChange[]>(() => pendingChanges.getAllChanges());
  
  useEffect(() => {
    return pendingChanges.subscribe(() => {
      setChanges(pendingChanges.getAllChanges());
    });
  }, []);
  
  return changes;
}

export function NoteList() {
  const { 
    mergedEntries, 
    isLoadingManifest, 
    refreshManifest,
    showMissing,
    toggleShowMissing,
  } = useManifest();
  const { currentNote, openNote, hasPendingChanges } = useNote();
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "note" | "article" | "pdf">("all");

  const allPendingChanges = useAllPendingChanges();
  const deletedPaths = useMemo(() => new Set(allPendingChanges.filter(c => c.type === "delete").map(c => c.path)), [allPendingChanges]);

  const filteredEntries = useMemo(() => {
    return mergedEntries.filter((entry) => {
      if (deletedPaths.has(entry.path)) return false;
      
      const matchesSearch =
        !search ||
        entry.title.toLowerCase().includes(search.toLowerCase()) ||
        entry.path.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || entry.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [mergedEntries, search, filter, deletedPaths]);

  const pendingNewEntries = useMemo(() => {
    const newCreates = allPendingChanges.filter(c => c.type === "create" && !mergedEntries.some(e => e.path === c.path));
    return newCreates.map(c => {
      const entry = createEntryFromPath(c.path);
      return {
        ...entry,
        isPending: true,
        pendingType: "create" as PendingChangeType,
      };
    });
  }, [allPendingChanges, mergedEntries]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, (MergedEntry | typeof pendingNewEntries[0])[]> = {};
    
    const allEntries = [...filteredEntries, ...pendingNewEntries];
    
    for (const entry of allEntries) {
      let group: string;
      if (entry.type === "note") {
        group = "Notes";
      } else if (entry.type === "article") {
        group = "Articles";
      } else if (entry.type === "pdf") {
        group = "PDFs";
      } else {
        group = "Other";
      }
      if (!groups[group]) groups[group] = [];
      groups[group].push(entry);
    }
    return groups;
  }, [filteredEntries, pendingNewEntries]);

  const getPendingChange = (path: string) => allPendingChanges.find(c => c.path === path);

  if (isLoadingManifest && mergedEntries.length === 0) {
    const skeletonWidths = ["90%", "85%", "95%", "80%", "88%"];
    return (
      <div className="p-4 h-full">
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
    <div className="flex flex-col h-full">
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
        <div className="flex gap-1 flex-wrap">
          {(["all", "note", "article", "pdf"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filter === f
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {f === "all" ? "All" : f === "note" ? "Notes" : f === "article" ? "Articles" : "PDFs"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={showMissing}
              onChange={toggleShowMissing}
              className="rounded border-border"
            />
            Show missing
          </label>
          {hasPendingChanges && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              {allPendingChanges.length} pending
            </span>
          )}
        </div>
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
                onClick={() => openNote(entry as MergedEntry)}
                pendingType={getPendingChange(entry.path)?.type}
                isPending={"isPending" in entry && entry.isPending}
              />
            ))}
          </div>
        ))}
        {filteredEntries.length === 0 && pendingNewEntries.length === 0 && (
          <div className="p-4 text-center text-sm text-muted">
            {mergedEntries.length === 0 ? "No notes found" : "No matching notes"}
          </div>
        )}
      </div>
    </div>
  );
}

interface EntryListItemProps {
  entry: MergedEntry | { path: string; title: string; slug: string; type: string; syncStatus: string };
  isActive: boolean;
  onClick: () => void;
  pendingType?: PendingChangeType;
  isPending?: boolean;
}

function EntryListItem({ entry, isActive, onClick, pendingType, isPending }: EntryListItemProps) {
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
        {pendingType === "delete" ? (
          <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through">
            Deleted
          </span>
        ) : pendingType === "update" ? (
          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
            Modified
          </span>
        ) : isPending ? (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            New
          </span>
        ) : "syncStatus" in entry && entry.syncStatus !== "indexed" ? (
          <StatusBadge status={entry.syncStatus as "new" | "missing"} />
        ) : null}
      </div>
      <span className="truncate text-xs text-muted">{entry.slug}</span>
    </button>
  );
}

function StatusBadge({ status }: { status: "new" | "missing" }) {
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
