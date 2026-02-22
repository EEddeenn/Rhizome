"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ContentCache {
  content: Record<string, string> | null;
  manifest: unknown[] | null;
  loading: boolean;
  error: Error | null;
}

const ContentCacheContext = createContext<ContentCache>({
  content: null,
  manifest: null,
  loading: true,
  error: null,
});

export function useContentCache(): ContentCache {
  return useContext(ContentCacheContext);
}

interface ContentCacheProviderProps {
  children: ReactNode;
}

export function ContentCacheProvider({ children }: ContentCacheProviderProps) {
  const [cache, setCache] = useState<ContentCache>({
    content: null,
    manifest: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/generated/content/content.json").then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`);
        return res.json();
      }),
      fetch("/generated/manifest/manifest.json").then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
        return res.json();
      }),
    ])
      .then(([content, manifest]) => {
        if (!cancelled) {
          setCache({ content, manifest, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setCache({ content: null, manifest: null, loading: false, error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ContentCacheContext.Provider value={cache}>
      {children}
    </ContentCacheContext.Provider>
  );
}
