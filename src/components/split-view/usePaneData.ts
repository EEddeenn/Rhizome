"use client";

import { useState, useEffect } from "react";
import type { Entry, Manifest, BacklinksIndex, BacklinkInfo } from "@/lib/content/types";
import { createCachedFetcher } from "@/lib/cache/create-cached-fetcher";

const loadManifest = createCachedFetcher<Manifest>("/generated/manifest/manifest.json");
const loadBacklinks = createCachedFetcher<BacklinksIndex>("/generated/backlinks/backlinks.json");

export interface PaneDataResult {
  entry: Entry | null;
  manifest: Manifest | null;
  backlinks: BacklinkInfo[];
  loading: boolean;
}

export function usePaneData(slug: string, paneId: string): PaneDataResult {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [backlinks, setBacklinks] = useState<BacklinkInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadManifest(), loadBacklinks()])
      .then(([manifestData, backlinksData]) => {
        setManifest(manifestData);
        const found = manifestData.find((e) => e.slug === slug);
        setEntry(found || null);
        setBacklinks(backlinksData[slug] || []);
        setLoading(false);
      })
      .catch(() => {
        setEntry(null);
        setLoading(false);
      });
  }, [slug, paneId]);

  return { entry, manifest, backlinks, loading };
}
