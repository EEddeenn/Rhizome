"use client";

import { useState, useEffect, useRef } from "react";
import { ClientMDXRenderer } from "./ClientMDXRenderer";
import { useSplitView, type PaneData } from "@/lib/context/SplitViewContext";
import { PaneSearchParamsProvider } from "@/lib/context/PaneSearchParamsContext";
import { TagPills } from "@/components/blocks/TagPills";
import { createCachedFetcher } from "@/lib/cache/create-cached-fetcher";
import type { Entry, Manifest, Heading, BacklinksIndex, BacklinkInfo } from "@/lib/content/types";

const loadManifest = createCachedFetcher<Manifest>("/generated/manifest/manifest.json");
const loadBacklinks = createCachedFetcher<BacklinksIndex>("/generated/backlinks/backlinks.json");

interface SplitPaneTocDropdownProps {
  headings: Heading[];
  paneRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

function SplitPaneTocDropdown({ headings, paneRef, isOpen, onClose }: SplitPaneTocDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !headings || headings.length === 0) return null;

  const filteredHeadings = headings.filter((h) => h.depth >= 2 && h.depth <= 4);
  if (filteredHeadings.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const pane = paneRef.current;
    if (!pane) return;
    
    const target = pane.querySelector(`#${CSS.escape(id)}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-1 w-64 max-h-80 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Table of Contents
        </h3>
      </div>
      <ul className="py-1">
        {filteredHeadings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.depth - 2) * 12 + 8}px` }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 block py-1.5 px-2 cursor-pointer"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SplitPaneBacklinksDropdownProps {
  backlinks: BacklinkInfo[];
  manifest: Manifest;
  isOpen: boolean;
  onClose: () => void;
  onOpenPane: (slug: string) => void;
}

function SplitPaneBacklinksDropdown({ backlinks, manifest, isOpen, onClose, onOpenPane }: SplitPaneBacklinksDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !backlinks || backlinks.length === 0) return null;

  const entries = backlinks
    .map((info) => manifest.find((e) => e.slug === info.slug))
    .filter((e): e is Entry => e !== undefined);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-1 w-64 max-h-80 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Backlinks ({entries.length})
        </h3>
      </div>
      <ul className="py-1">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <button
              onClick={() => {
                onOpenPane(entry.slug);
                onClose();
              }}
              className="w-full text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 block py-1.5 px-2"
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase mr-1">
                {entry.type}
              </span>
              {entry.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SplitPaneProps {
  pane: PaneData;
  index: number;
}

export function SplitPane({ pane, index }: SplitPaneProps) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [backlinks, setBacklinks] = useState<BacklinkInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showBacklinks, setShowBacklinks] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef<string | null>(null);
  const { closePane, openPane } = useSplitView();

  useEffect(() => {
    setLoading(true);
    setContentReady(false);
    scrolledRef.current = null;
    Promise.all([loadManifest(), loadBacklinks()])
      .then(([manifestData, backlinksData]) => {
        setManifest(manifestData);
        const found = manifestData.find((e) => e.slug === pane.slug);
        setEntry(found || null);
        setBacklinks(backlinksData[pane.slug] || []);
        setLoading(false);
      })
      .catch(() => {
        setEntry(null);
        setLoading(false);
      });
  }, [pane.slug, pane.id]);

  useEffect(() => {
    if (loading || !pane.anchor || !contentReady) return;
    
    const scrollKey = `${pane.slug}#${pane.anchor}`;
    if (scrolledRef.current === scrollKey) return;

    const container = contentRef.current;
    if (!container) return;

    const tryScroll = (attempts: number) => {
      if (attempts <= 0) return;
      
      const element = container.querySelector(`#${CSS.escape(pane.anchor!)}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        scrolledRef.current = scrollKey;
      } else if (attempts > 1) {
        setTimeout(() => tryScroll(attempts - 1), 150);
      }
    };

    setTimeout(() => tryScroll(20), 50);
  }, [loading, pane.anchor, pane.slug, contentReady]);

  const handleClose = () => {
    closePane(index);
  };

  const handleOpenFull = () => {
    window.location.href = `/${pane.slug}`;
  };

  const handleDuplicate = () => {
    openPane(pane.slug, pane.searchParams, true);
  };

  const hasHeadings = entry?.headings && entry.headings.filter((h) => h.depth >= 2 && h.depth <= 4).length > 0;

  if (loading) {
    return (
      <div className="h-full w-1/2 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
            Content not found: {pane.slug}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={paneRef} className="h-full w-1/2 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase shrink-0">
            {entry.type}
          </span>
          <span className="font-medium truncate text-sm">
            {entry.title}
          </span>
        </div>
        <div className="flex gap-1 shrink-0 relative">
          {hasHeadings && (
            <>
              <button
                onClick={() => setShowToc(!showToc)}
                className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${showToc ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                aria-label="Table of contents"
                title="Table of contents"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <SplitPaneTocDropdown
                headings={entry.headings || []}
                paneRef={paneRef}
                isOpen={showToc}
                onClose={() => setShowToc(false)}
              />
            </>
          )}
          <button
            onClick={handleDuplicate}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400"
            aria-label="Duplicate pane"
            title="Duplicate pane"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {backlinks.length > 0 && manifest && (
            <>
              <button
                onClick={() => setShowBacklinks(!showBacklinks)}
                className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${showBacklinks ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                aria-label="Backlinks"
                title="Backlinks"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <SplitPaneBacklinksDropdown
                backlinks={backlinks}
                manifest={manifest}
                isOpen={showBacklinks}
                onClose={() => setShowBacklinks(false)}
                onOpenPane={(slug) => openPane(slug, undefined, true)}
              />
            </>
          )}
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
      <div ref={contentRef} className="flex-1 overflow-auto">
        <PaneSearchParamsProvider searchParams={pane.searchParams}>
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
            <ClientMDXRenderer slug={pane.slug} onReady={() => setContentReady(true)} />
          </div>
        </PaneSearchParamsProvider>
      </div>
    </div>
  );
}
