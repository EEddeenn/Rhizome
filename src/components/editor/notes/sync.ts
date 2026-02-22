import type { VaultAdapter } from "@/lib/editor";
import { clearContentCache } from "@/lib/editor";
import { pendingChanges, type PendingChange } from "@/lib/editor/pending-changes";
import {
  reconcile,
  updateRuntimeEntry,
  removeRuntimeEntry,
  refreshRuntimeManifestAndReconcile,
  saveRuntimeManifestCache,
  type MergedEntry,
  type BuildManifest,
  type RuntimeManifest,
} from "@/lib/manifest";
import { extractErrorMessage, isAuthError, isConflictError } from "../utils/error";

export interface SyncCallbacks {
  onStart: (total: number) => void;
  onProgress: (current: number, total: number) => void;
  onSuccess: (path: string, sha: string | null, htmlUrl: string | null) => void;
  onError: (path: string, error: string) => void;
  onComplete: () => void;
}

export interface SyncContext {
  adapter: VaultAdapter;
  config: { owner: string; repo: string; contentRoot: string };
  buildManifest: BuildManifest | null;
  runtimeManifest: RuntimeManifest | null;
  updateRuntimeManifest: (manifest: RuntimeManifest) => void;
  updateMergedEntries: (entries: MergedEntry[]) => void;
  onAuthError?: () => void;
  currentNotePath: string | null;
  onCurrentNoteSynced: (sha: string | null, htmlUrl: string | null) => void;
}

export async function syncPendingChanges(
  context: SyncContext,
  callbacks: SyncCallbacks
): Promise<void> {
  const { adapter, config, buildManifest, runtimeManifest, updateRuntimeManifest, updateMergedEntries, onAuthError, currentNotePath, onCurrentNoteSynced } = context;
  
  const changes = pendingChanges.getAllChanges();
  if (changes.length === 0) return;

  callbacks.onStart(changes.length);

  const errors: string[] = [];
  let newRuntimeManifest = runtimeManifest;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    callbacks.onProgress(i + 1, changes.length);

    try {
      if (change.type === "delete") {
        if (!change.originalSha) {
          errors.push(`${change.path}: No SHA for deletion`);
          continue;
        }
        await adapter.deleteFile({
          path: change.path,
          sha: change.originalSha,
          message: `Delete ${change.path}`,
        });
        if (newRuntimeManifest) {
          newRuntimeManifest = removeRuntimeEntry(newRuntimeManifest, change.path);
        }
      } else if (change.type === "create" || change.type === "update") {
        const result = await adapter.writeFile({
          path: change.path,
          content: change.content || "",
          message: change.type === "create" ? `Create ${change.path}` : `Update ${change.path}`,
          sha: change.type === "update" ? change.originalSha : undefined,
          isBase64: change.isBinary,
        });
        if (newRuntimeManifest && result.newSha) {
          newRuntimeManifest = updateRuntimeEntry(newRuntimeManifest, change.path, { sha: result.newSha });
        }
        
        if (currentNotePath === change.path && result.newSha) {
          onCurrentNoteSynced(result.newSha, result.htmlUrl || null);
        }
        
        callbacks.onSuccess(change.path, result.newSha || null, result.htmlUrl || null);
      }
      pendingChanges.removeChange(change.path);
    } catch (error: unknown) {
      if (isAuthError(error)) {
        onAuthError?.();
        errors.push(`${change.path}: Authentication error`);
      } else if (isConflictError(error)) {
        errors.push(`${change.path}: Conflict - remote has changed`);
      } else {
        const message = extractErrorMessage(error, "Failed");
        errors.push(`${change.path}: ${message}`);
      }
      callbacks.onError(change.path, errors[errors.length - 1]);
    }
  }

  if (newRuntimeManifest) {
    updateRuntimeManifest(newRuntimeManifest);
    try {
      const repoInfo = await adapter.getRepoInfo();
      saveRuntimeManifestCache(
        config.owner,
        config.repo,
        repoInfo.defaultBranch,
        config.contentRoot,
        newRuntimeManifest
      );
    } catch {}
    const merged = reconcile(buildManifest, newRuntimeManifest);
    updateMergedEntries(merged);
  } else if (changes.some(c => c.type === "create")) {
    try {
      const result = await refreshRuntimeManifestAndReconcile({
        adapter,
        config,
        buildManifest,
      });
      updateRuntimeManifest(result.runtimeManifest);
      updateMergedEntries(result.mergedEntries);
    } catch {}
  }

  clearContentCache();
  callbacks.onComplete();
}

export async function syncSingleChange(
  change: PendingChange,
  adapter: VaultAdapter,
  onAuthError?: () => void
): Promise<{ success: boolean; newSha?: string; htmlUrl?: string; error?: string }> {
  try {
    if (change.type === "delete") {
      if (!change.originalSha) {
        return { success: false, error: "No SHA for deletion" };
      }
      await adapter.deleteFile({
        path: change.path,
        sha: change.originalSha,
        message: `Delete ${change.path}`,
      });
      pendingChanges.removeChange(change.path);
      return { success: true };
    } else if (change.type === "create" || change.type === "update") {
      const result = await adapter.writeFile({
        path: change.path,
        content: change.content || "",
        message: change.type === "create" ? `Create ${change.path}` : `Update ${change.path}`,
        sha: change.type === "update" ? change.originalSha : undefined,
        isBase64: change.isBinary,
      });
      pendingChanges.removeChange(change.path);
      return { success: true, newSha: result.newSha, htmlUrl: result.htmlUrl };
    }
    return { success: false, error: "Unknown change type" };
  } catch (error: unknown) {
    if (isAuthError(error)) {
      onAuthError?.();
      return { success: false, error: "Authentication error" };
    }
    if (isConflictError(error)) {
      return { success: false, error: "Conflict - remote has changed" };
    }
    const message = extractErrorMessage(error, "Failed");
    return { success: false, error: message };
  }
}
