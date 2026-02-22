"use client";

import { useState, useRef, useEffect, memo } from "react";
import { ClientMDXRenderer } from "./ClientMDXRenderer";
import { useSplitView, type PaneData } from "@/components/context/SplitViewContext";
import { PaneSearchParamsProvider } from "@/components/context/PaneSearchParamsContext";
import { TagPills } from "@/components/blocks/TagPills";
import { scrollElementIntoContainer } from "@/components/navigation";
import { TocDropdown } from "./TocDropdown";
import { BacklinksDropdown } from "./BacklinksDropdown";
import { usePaneData } from "./usePaneData";
import { CloseIcon, TocIcon, DuplicateIcon, BacklinksIcon, OpenFullIcon, EditIcon } from "@/components/icons";

interface SplitPaneProps {
  pane: PaneData;
  index: number;
}

function SplitPaneInner({ pane, index }: SplitPaneProps) {
  const { entry, manifest, backlinks, loading } = usePaneData(pane.slug, pane.id);
  const [contentReady, setContentReady] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showBacklinks, setShowBacklinks] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef<string | null>(null);
  const { closePane, openPane } = useSplitView();

  useAnchorScrollEffect(pane.anchor, pane.slug, loading, contentReady, contentRef, scrolledRef);

  const handleClose = () => closePane(index);
  const handleOpenFull = () => { window.location.href = `/${pane.slug}`; };
  const handleDuplicate = () => openPane(pane.slug, pane.searchParams, true);

  const hasHeadings = entry?.headings && entry.headings.filter((h) => h.depth >= 2 && h.depth <= 4).length > 0;

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
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
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Not Found</span>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close"
          >
            <CloseIcon />
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
    <div ref={paneRef} data-pane-index={index} className="h-full flex flex-col bg-white dark:bg-gray-900">
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
                className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${showToc ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                aria-label="Table of contents"
                title="Table of contents"
              >
                <TocIcon />
              </button>
              <TocDropdown
                headings={entry.headings || []}
                paneRef={paneRef}
                isOpen={showToc}
                onClose={() => setShowToc(false)}
              />
            </>
          )}
          <button
            onClick={handleDuplicate}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Duplicate pane"
            title="Duplicate pane"
          >
            <DuplicateIcon />
          </button>
          {backlinks.length > 0 && manifest && (
            <>
              <button
                onClick={() => setShowBacklinks(!showBacklinks)}
                className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${showBacklinks ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                aria-label="Backlinks"
                title="Backlinks"
              >
                <BacklinksIcon />
              </button>
              <BacklinksDropdown
                backlinks={backlinks}
                manifest={manifest}
                isOpen={showBacklinks}
                onClose={() => setShowBacklinks(false)}
                onOpenPane={(slug: string) => openPane(slug, undefined, true)}
              />
            </>
          )}
          <button
            onClick={handleOpenFull}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Open full page"
            title="Open full page"
          >
            <OpenFullIcon />
          </button>
          <a
            href={`/editor?note=${encodeURIComponent(entry.sourcePath)}`}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Open in editor"
            title="Open in editor"
          >
            <EditIcon />
          </a>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 dark:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close"
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div ref={contentRef} data-pane-content className="flex-1 overflow-auto overscroll-contain">
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

export const SplitPane = memo(SplitPaneInner);

function useAnchorScrollEffect(
  anchor: string | undefined,
  slug: string,
  loading: boolean,
  contentReady: boolean,
  contentRef: React.RefObject<HTMLDivElement | null>,
  scrolledRef: React.MutableRefObject<string | null>
) {
  useEffect(() => {
    if (loading || !anchor || !contentReady) return;

    const scrollKey = `${slug}#${anchor}`;
    if (scrolledRef.current === scrollKey) return;

    const container = contentRef.current;
    if (!container) return;

    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    const tryScroll = (attempts: number) => {
      if (attempts <= 0 || scrolledRef.current === scrollKey) return;

      const element = container.querySelector(`#${CSS.escape(anchor)}`);
      if (element) {
        scrollElementIntoContainer(container, element);
        scrolledRef.current = scrollKey;
      } else if (attempts > 1) {
        const timeoutId = setTimeout(() => tryScroll(attempts - 1), 150);
        timeoutIds.push(timeoutId);
      }
    };

    const initialTimeoutId = setTimeout(() => tryScroll(10), 50);
    timeoutIds.push(initialTimeoutId);

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [loading, anchor, slug, contentReady, contentRef, scrolledRef]);
}
