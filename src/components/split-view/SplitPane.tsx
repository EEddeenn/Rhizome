"use client";

import { useState, useEffect } from "react";
import { ClientMDXRenderer } from "./ClientMDXRenderer";
import { useSplitView } from "@/lib/context/SplitViewContext";
import { TagPills } from "@/components/blocks/TagPills";
import type { Entry, Manifest } from "@/lib/content/types";

let manifestCache: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;

async function loadManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache;
  if (manifestPromise) return manifestPromise;
  
  manifestPromise = fetch("/generated/manifest/manifest.json")
    .then((res) => res.json())
    .then((data) => {
      manifestCache = data;
      return data;
    });
  
  return manifestPromise;
}

interface SplitPaneProps {
  slug: string;
  index: number;
}

export function SplitPane({ slug, index }: SplitPaneProps) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const { closePane } = useSplitView();

  useEffect(() => {
    setLoading(true);
    loadManifest()
      .then((manifest) => {
        const found = manifest.find((e) => e.slug === slug);
        setEntry(found || null);
        setLoading(false);
      })
      .catch(() => {
        setEntry(null);
        setLoading(false);
      });
  }, [slug]);

  const handleClose = () => {
    closePane(index);
  };

  const handleOpenFull = () => {
    window.location.href = `/${slug}`;
  };

  if (loading) {
    return (
      <div className="h-full w-1/2 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="h-full w-1/2 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Not Found</span>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Content not found: {slug}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-1/2 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase shrink-0">
            {entry.type}
          </span>
          <span className="font-medium truncate text-sm">
            {entry.title}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleOpenFull}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400"
            aria-label="Open full page"
            title="Open full page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400"
            aria-label="Close"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="mb-4">
            {entry.summary && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {entry.summary}
              </p>
            )}
            <TagPills tags={entry.tags} />
            {entry.date && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {entry.date}
                {entry.readingTimeMin && ` · ${entry.readingTimeMin} min read`}
              </p>
            )}
          </div>
          <ClientMDXRenderer slug={slug} />
        </div>
      </div>
    </div>
  );
}
