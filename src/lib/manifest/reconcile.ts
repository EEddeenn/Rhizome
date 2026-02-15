import type { BuildManifest } from "./buildManifest";
import type { RuntimeManifest } from "./runtimeManifest";

export type MergedEntryStatus = "indexed" | "new" | "missing";

export interface MergedEntry {
  path: string;
  title: string;
  tags: string[];
  slug: string;
  type: "note" | "article" | "book" | "paper";
  readingStatus?: string;
  date?: string;
  summary?: string;
  runtimeSha?: string;
  existsInBuild: boolean;
  existsInRuntime: boolean;
  syncStatus: MergedEntryStatus;
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
      
      newEntries.push({
        path,
        title: derivedTitle,
        tags: [],
        slug: derivedSlug,
        type: derivedType,
        runtimeSha: runtimeEntry.sha,
        existsInBuild: false,
        existsInRuntime: true,
        syncStatus: "new",
        stale: true,
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

function deriveTitleFromPath(path: string): string {
  const filename = path.split("/").pop() || path;
  const nameWithoutExt = filename.replace(/\.(md|mdx)$/, "");
  
  return nameWithoutExt
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function deriveTypeFromPath(path: string): "note" | "article" | "book" | "paper" {
  if (path.includes("/articles/")) return "article";
  if (path.includes("/books/")) return "book";
  if (path.includes("/papers/")) return "paper";
  return "note";
}

function deriveSlugFromPath(path: string): string {
  return path
    .replace(/^content\//, "")
    .replace(/\.(md|mdx)$/, "");
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
