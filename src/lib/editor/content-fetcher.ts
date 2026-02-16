import type { VaultAdapter } from "./types";

export interface ContentFetchResult {
  content: string;
  sha?: string;
  source: "local" | "github";
}

export interface PdfFetchResult {
  blobUrl: string;
  source: "local" | "github";
}

export interface ContentFetchError {
  error: string;
  localAttempted: boolean;
  githubAttempted: boolean;
}

let contentCache: Record<string, string> | null = null;

async function loadLocalContentCache(): Promise<Record<string, string> | null> {
  if (contentCache) return contentCache;
  
  try {
    const response = await fetch("/generated/content/content.json");
    if (!response.ok) return null;
    
    contentCache = await response.json();
    return contentCache;
  } catch {
    return null;
  }
}

function pathToSlug(path: string): string {
  return path
    .replace(/^content\//, "")
    .replace(/\.(md|mdx)$/, "");
}

export async function fetchNoteContent(
  path: string,
  adapter: VaultAdapter | null
): Promise<ContentFetchResult | null> {
  const slug = pathToSlug(path);
  
  const cache = await loadLocalContentCache();
  if (cache && cache[slug]) {
    return {
      content: cache[slug],
      source: "local",
    };
  }
  
  if (!adapter) return null;
  
  try {
    const { content, sha } = await adapter.readFile(path);
    return {
      content,
      sha,
      source: "github",
    };
  } catch {
    return null;
  }
}

export async function fetchPdfContent(
  path: string,
  adapter: VaultAdapter | null
): Promise<PdfFetchResult | ContentFetchError> {
  const rawPath = path.replace(/^content\/assets\/pdfs\//, "");
  const encodedPath = rawPath.split("/").map(encodeURIComponent).join("/");
  const localUrl = `/assets/pdfs/${encodedPath}`;
  
  try {
    const response = await fetch(localUrl, { method: "HEAD" });
    if (response.ok) {
      return {
        blobUrl: localUrl,
        source: "local",
      };
    }
  } catch {
    // Local fetch failed, try GitHub
  }
  
  if (!adapter) {
    return {
      error: "PDF not found locally and not connected to GitHub",
      localAttempted: true,
      githubAttempted: false,
    };
  }
  
  try {
    const { contentBase64 } = await adapter.readFileRaw(path);
    
    const binaryString = atob(contentBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    
    return {
      blobUrl,
      source: "github",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch from GitHub";
    return {
      error: message,
      localAttempted: true,
      githubAttempted: true,
    };
  }
}

export function clearContentCache(): void {
  contentCache = null;
}
