import type { BuildManifest } from "./buildManifest";
import type { RuntimeManifest } from "./runtimeManifest";
import type { EntryType } from "@/lib/content/types";
import { deriveSlugFromPath, deriveTitleFromPath } from "@/lib/content/slug";

export type MergedEntryStatus = "indexed" | "new" | "missing";

export interface MergedEntry {
  path: string;
  title: string;
  tags: string[];
  slug: string;
  type: EntryType;
  readingStatus?: string;
  date?: string;
  summary?: string;
  runtimeSha?: string;
  existsInBuild: boolean;
  existsInRuntime: boolean;
  syncStatus: MergedEntryStatus;
  contentSource: "local" | "github";
  stale: boolean;
  orderKey?: number;
}

export function reconcile(
  build: BuildManifest | null,
  runtime: RuntimeManifest | null
): MergedEntry[] {
  const merged: MergedEntry[] = [];
  const runtimePaths = new Set<string>();
  
  if (build) {
    for (const buildEntry of build.list) {
      const runtimeEntry = runtime?.entries[buildEntry.path];
      const existsInRuntime = !!runtimeEntry;
      
      if (runtimeEntry) {
        runtimePaths.add(buildEntry.path);
      }
      
      const derivedTitle = deriveTitleFromPath(buildEntry.path);
      
      merged.push({
        path: buildEntry.path,
        title: buildEntry.title || derivedTitle,
        tags: buildEntry.tags || [],
        slug: buildEntry.slug,
        type: buildEntry.type,
        readingStatus: buildEntry.status,
        date: buildEntry.date,
        summary: buildEntry.summary,
        runtimeSha: runtimeEntry?.sha,
        existsInBuild: true,
        existsInRuntime,
        syncStatus: existsInRuntime ? "indexed" : "missing",
        contentSource: "local",
        stale: !existsInRuntime,
        orderKey: buildEntry.order,
      });
    }
  }
  
  if (runtime) {
    const newEntries: MergedEntry[] = [];
    
    for (const [path, runtimeEntry] of Object.entries(runtime.entries)) {
      if (runtimePaths.has(path)) continue;
      
      const derivedTitle = deriveTitleFromPath(path);
      const derivedType = deriveTypeFromPath(path);
      const derivedSlug = deriveSlugFromPath(path);
      const isPdf = derivedType === "pdf";
      
      newEntries.push({
        path,
        title: derivedTitle,
        tags: [],
        slug: derivedSlug,
        type: derivedType,
        runtimeSha: runtimeEntry.sha,
        existsInBuild: false,
        existsInRuntime: true,
        syncStatus: isPdf ? "indexed" : "new",
        contentSource: "github",
        stale: !isPdf,
      });
    }
    
    newEntries.sort((a, b) => a.title.localeCompare(b.title));
    merged.push(...newEntries);
  }
  
  merged.sort((a, b) => {
    if (a.orderKey !== undefined && b.orderKey !== undefined) {
      return a.orderKey - b.orderKey;
    }
    if (a.orderKey !== undefined) return -1;
    if (b.orderKey !== undefined) return 1;
    return a.title.localeCompare(b.title);
  });
  
  return merged;
}

function deriveTypeFromPath(path: string): EntryType {
  if (path.includes("/articles/")) return "article";
  if (path.includes("/books/")) return "book";
  if (path.includes("/papers/")) return "paper";
  if (path.includes("/assets/pdfs/") || path.toLowerCase().endsWith(".pdf")) return "pdf";
  return "note";
}

export function createEntryFromPath(path: string, sha?: string): MergedEntry {
  const derivedTitle = deriveTitleFromPath(path);
  const derivedType = deriveTypeFromPath(path);
  const derivedSlug = deriveSlugFromPath(path);
  const isPdf = derivedType === "pdf";
  
  return {
    path,
    title: derivedTitle,
    tags: [],
    slug: derivedSlug,
    type: derivedType,
    runtimeSha: sha,
    existsInBuild: false,
    existsInRuntime: true,
    syncStatus: isPdf ? "indexed" : "new",
    contentSource: "github",
    stale: !isPdf,
  };
}

export function filterByStatus(
  entries: MergedEntry[],
  showMissing: boolean
): MergedEntry[] {
  if (showMissing) return entries;
  return entries.filter(e => e.syncStatus !== "missing");
}

export function searchEntries(
  entries: MergedEntry[],
  query: string
): MergedEntry[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return entries;
  
  return entries.filter(e => 
    e.title.toLowerCase().includes(lowerQuery) ||
    e.path.toLowerCase().includes(lowerQuery)
  );
}

export function buildTitleIndex(entries: MergedEntry[]): Map<string, string> {
  const index = new Map<string, string>();
  
  for (const entry of entries) {
    index.set(entry.title.toLowerCase(), entry.path);
    
    const slugTitle = entry.slug.split("/").pop() || "";
    if (slugTitle) {
      index.set(slugTitle.toLowerCase(), entry.path);
    }
  }
  
  return index;
}

export function groupByType(entries: MergedEntry[]): Map<string, MergedEntry[]> {
  const groups = new Map<string, MergedEntry[]>();
  
  for (const entry of entries) {
    const type = entry.type;
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type)!.push(entry);
  }
  
  return groups;
}

export function getEntryByPath(entries: MergedEntry[], path: string): MergedEntry | undefined {
  return entries.find(e => e.path === path);
}

export function updateEntrySha(
  entries: MergedEntry[],
  path: string,
  newSha: string
): MergedEntry[] {
  return entries.map(e => 
    e.path === path 
      ? { ...e, runtimeSha: newSha }
      : e
  );
}
