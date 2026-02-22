import { fetchNoteContent } from "@/lib/editor";
import { pendingChanges } from "@/lib/editor/pending-changes";
import {
  reconcile,
  updateRuntimeEntry,
  createEntryFromPath,
  type MergedEntry,
  type BuildManifest,
  type RuntimeManifest,
} from "@/lib/manifest";

export interface OpenNoteResult {
  content: string;
  sha: string | null;
  source: "local" | "github" | "pending";
}

export async function openNoteFromSource(
  entry: MergedEntry,
  adapter: Parameters<typeof fetchNoteContent>[1]
): Promise<OpenNoteResult | null> {
  const result = await fetchNoteContent(entry.path, adapter);
  if (!result) return null;
  return { content: result.content, sha: result.sha ?? null, source: result.source };
}

export async function openPdfNote(
  entry: MergedEntry,
  adapter: { readFileRaw: (path: string) => Promise<{ sha: string }> } | null
): Promise<{ sha: string | null } | null> {
  if (!adapter) return { sha: null };
  try {
    const result = await adapter.readFileRaw(entry.path);
    return { sha: result.sha };
  } catch {
    return { sha: null };
  }
}

export function saveToPendingChanges(
  path: string,
  content: string,
  currentSha: string | null,
  currentSource: "local" | "github" | "pending" | null
): void {
  if (currentSha && currentSource !== "pending") {
    pendingChanges.addUpdate(path, content, currentSha);
  } else {
    const existing = pendingChanges.getChange(path);
    if (existing?.type === "create") {
      pendingChanges.addCreate(path, content);
    } else if (currentSha) {
      pendingChanges.addUpdate(path, content, currentSha);
    } else {
      pendingChanges.addCreate(path, content);
    }
  }
}

export function createNewNote(path: string, content: string): MergedEntry {
  pendingChanges.addCreate(path, content);
  return createEntryFromPath(path);
}

export function uploadNewPdf(path: string, base64Content: string): MergedEntry {
  pendingChanges.addCreate(path, base64Content, true);
  return createEntryFromPath(path);
}

export function deleteFromPendingOrRemote(
  path: string,
  currentSha: string | null,
  adapter: { readFileRaw: (path: string) => Promise<{ sha: string }> } | null
): Promise<void> {
  const pendingChange = pendingChanges.getChange(path);
  
  if (pendingChange?.type === "create") {
    pendingChanges.removeChange(path);
    return Promise.resolve();
  }
  
  if (currentSha) {
    pendingChanges.addDelete(path, currentSha);
    return Promise.resolve();
  }
  
  if (adapter) {
    return adapter.readFileRaw(path).then((result) => {
      pendingChanges.addDelete(path, result.sha);
    }).catch(() => {
      pendingChanges.addDelete(path);
    });
  }
  
  return Promise.resolve();
}

export function getPendingChangeForPath(path: string) {
  return pendingChanges.getChange(path);
}

export function hasPendingChanges(): boolean {
  return pendingChanges.hasPendingChanges;
}

export function getAllPendingChanges() {
  return pendingChanges.getAllChanges();
}

export function discardAllPending(): void {
  pendingChanges.clear();
}

export function updateManifestAfterSync(
  buildManifest: BuildManifest | null,
  runtimeManifest: RuntimeManifest | null,
  path: string,
  sha: string | null,
  updateRuntimeManifest: (manifest: RuntimeManifest) => void,
  updateMergedEntries: (entries: MergedEntry[]) => void
): void {
  if (runtimeManifest && sha) {
    const updated = updateRuntimeEntry(runtimeManifest, path, { sha });
    updateRuntimeManifest(updated);
    const merged = reconcile(buildManifest, updated);
    updateMergedEntries(merged);
  }
}
