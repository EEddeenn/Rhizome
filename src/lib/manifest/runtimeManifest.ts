import type { VaultAdapter } from "@/lib/editor";
import type { BuildManifest } from "./buildManifest";
import { reconcile, type MergedEntry } from "./reconcile";

export interface RuntimeEntry {
  /** Repo path (e.g., "content/notes/my-note.mdx") */
  path: string;
  /** SHA from GitHub Contents API (usable for PUT concurrency) */
  sha?: string;
  /** Tree SHA (from Trees API, may differ from contents SHA) */
  treeSha?: string;
  /** File size in bytes */
  size?: number;
  /** Last updated timestamp */
  updatedAt?: number;
}

/**
 * Runtime manifest structure
 */
export interface RuntimeManifest {
  /** Git ref (branch name or commit SHA) */
  ref: string;
  /** Content root path */
  root: string;
  /** Entries keyed by path for O(1) lookup */
  entries: Record<string, RuntimeEntry>;
}

/**
 * Cache key generator for localStorage
 */
function getCacheKey(owner: string, repo: string, ref: string, root: string): string {
  return `rhizome_runtime_manifest:${owner}/${repo}@${ref}:${root}`;
}

/**
 * Loads cached RuntimeManifest from localStorage
 */
export function loadRuntimeManifestCache(
  owner: string,
  repo: string,
  ref: string,
  root: string
): RuntimeManifest | null {
  if (typeof window === "undefined") return null;
  
  try {
    const key = getCacheKey(owner, repo, ref, root);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as RuntimeManifest;
    }
  } catch (error) {
    console.warn("RuntimeManifest: Failed to load cache", error);
  }
  
  return null;
}

/**
 * Saves RuntimeManifest to localStorage
 */
export function saveRuntimeManifestCache(
  owner: string,
  repo: string,
  ref: string,
  root: string,
  manifest: RuntimeManifest
): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = getCacheKey(owner, repo, ref, root);
    localStorage.setItem(key, JSON.stringify(manifest));
  } catch (error) {
    console.warn("RuntimeManifest: Failed to save cache", error);
  }
}

/**
 * Clears RuntimeManifest cache
 */
export function clearRuntimeManifestCache(
  owner: string,
  repo: string,
  ref: string,
  root: string
): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = getCacheKey(owner, repo, ref, root);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("RuntimeManifest: Failed to clear cache", error);
  }
}

/**
 * Options for fetching RuntimeManifest from GitHub
 */
export interface FetchRuntimeManifestOptions {
  /** Content root path (e.g., "content") */
  root: string;
  /** Git ref (branch or commit) */
  ref: string;
  /** Signal for aborting the request */
  abortSignal?: AbortSignal;
}

export async function fetchRuntimeManifestFromGitHub(
  adapter: VaultAdapter,
  opts: FetchRuntimeManifestOptions
): Promise<RuntimeManifest> {
  const entries: Record<string, RuntimeEntry> = {};
  const { root, ref } = opts;
  
  const notes = await adapter.listNotes({ root });
  
  for (const note of notes) {
    entries[note.path] = {
      path: note.path,
      sha: note.sha,
      updatedAt: Date.now(),
    };
  }
  
  return {
    ref,
    root,
    entries,
  };
}

/**
 * Updates a single entry in the RuntimeManifest.
 * Returns a new manifest (immutable update).
 */
export function updateRuntimeEntry(
  manifest: RuntimeManifest,
  path: string,
  patch: Partial<RuntimeEntry>
): RuntimeManifest {
  const existing = manifest.entries[path] || { path };
  
  return {
    ...manifest,
    entries: {
      ...manifest.entries,
      [path]: {
        ...existing,
        ...patch,
      },
    },
  };
}

/**
 * Removes an entry from the RuntimeManifest.
 * Returns a new manifest (immutable update).
 */
export function removeRuntimeEntry(
  manifest: RuntimeManifest,
  path: string
): RuntimeManifest {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [path]: _, ...remaining } = manifest.entries;
  
  return {
    ...manifest,
    entries: remaining,
  };
}

/**
 * Creates an empty RuntimeManifest
 */
export function createEmptyRuntimeManifest(ref: string, root: string): RuntimeManifest {
  return {
    ref,
    root,
    entries: {},
  };
}

export interface RefreshRuntimeManifestParams {
  adapter: VaultAdapter;
  config: {
    owner: string;
    repo: string;
    contentRoot: string;
  };
  buildManifest: BuildManifest | null;
}

export interface RefreshRuntimeManifestResult {
  runtimeManifest: RuntimeManifest;
  mergedEntries: MergedEntry[];
}

export async function refreshRuntimeManifestAndReconcile(
  params: RefreshRuntimeManifestParams
): Promise<RefreshRuntimeManifestResult> {
  const { adapter, config, buildManifest } = params;
  
  const repoInfo = await adapter.getRepoInfo();
  
  const runtimeManifest = await fetchRuntimeManifestFromGitHub(adapter, {
    root: config.contentRoot,
    ref: repoInfo.defaultBranch,
  });
  
  saveRuntimeManifestCache(
    config.owner,
    config.repo,
    repoInfo.defaultBranch,
    config.contentRoot,
    runtimeManifest
  );
  
  const mergedEntries = reconcile(buildManifest, runtimeManifest);
  
  return { runtimeManifest, mergedEntries };
}
