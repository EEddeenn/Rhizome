import type { MDXRemoteSerializeResult } from "next-mdx-remote";

const MAX_CACHE_SIZE = 50;

interface CacheEntry {
  result: MDXRemoteSerializeResult;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + "_" + content.length.toString(36);
}

export async function getOrCreateCompiled(
  content: string,
  compile: () => Promise<MDXRemoteSerializeResult>
): Promise<MDXRemoteSerializeResult> {
  const hash = hashContent(content);
  const cached = cache.get(hash);

  if (cached) {
    return cached.result;
  }

  const result = await compile();

  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = [...cache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]?.[0];
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(hash, { result, timestamp: Date.now() });

  return result;
}

export function clearCompileCache(): void {
  cache.clear();
}
