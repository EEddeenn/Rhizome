"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNotes } from "../notes/NotesProvider";
import { useManifest } from "../manifest/ManifestProvider";
import { useConnection } from "../connection/ConnectionProvider";
import { FrontmatterDisplay } from "../ui/FrontmatterDisplay";
import { EditorPDFViewer } from "../preview/EditorPDFViewer";
import { scrollElementIntoContainer } from "@/components/navigation";
import { parseFrontmatter, stripFrontmatter } from "../preview/frontmatter";
import { compileMdx } from "../preview/mdx/compileMdx";
import { PreviewContent } from "../preview/mdx/PreviewContent";
import { PreviewErrorBoundary } from "../preview/PreviewErrorBoundary";
import { PendingPDFPreview } from "../preview/pdf/PendingPDFPreview";
import { createWikiLinkResolver, createEmbedResolver } from "@/lib/content/wiki-link-resolver";
import { getManifest } from "@/lib/generated/load-manifest";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

export function PreviewPane() {
  const { currentContent, currentNote, openNote, isLoadingNote, pendingChangeForCurrentNote } = useNotes();
  const { mergedEntries } = useManifest();
  const { adapter } = useConnection();
  
  const [compiled, setCompiled] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debouncedContent, setDebouncedContent] = useState(currentContent);
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown> | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingAnchorRef = useRef<string | null>(null);
  const lastNotePathRef = useRef<string | null>(null);

  const resolvers = useMemo(() => {
    const manifest = getManifest();
    return {
      resolve: createWikiLinkResolver(manifest),
      resolveEmbed: createEmbedResolver(manifest),
    };
  }, []);

  const handleInternalLinkClick = useCallback((href: string): boolean => {
    if (!href.startsWith("/notes/") && !href.startsWith("/articles/")) {
      return false;
    }

    const [path, anchor] = href.split("#");
    const slug = path.slice(1);
    const entry = mergedEntries.find((e) => e.slug === slug);

    if (!entry) {
      return false;
    }

    if (entry.path === currentNote?.path) {
      if (anchor && containerRef.current) {
        const element = containerRef.current.querySelector(`#${CSS.escape(anchor)}`);
        if (element) {
          scrollElementIntoContainer(containerRef.current, element);
        }
      }
      return true;
    }

    pendingAnchorRef.current = anchor || null;
    openNote(entry);

    return true;
  }, [mergedEntries, currentNote, openNote]);

  useEffect(() => {
    if (compiled && pendingAnchorRef.current && containerRef.current) {
      const anchor = pendingAnchorRef.current;
      pendingAnchorRef.current = null;
      
      setTimeout(() => {
        const element = containerRef.current?.querySelector(`#${CSS.escape(anchor)}`);
        if (element && containerRef.current) {
          scrollElementIntoContainer(containerRef.current, element);
        }
      }, 50);
    }
  }, [compiled]);

  useEffect(() => {
    if (currentNote?.path && !pendingAnchorRef.current && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentNote?.path]);

  useEffect(() => {
    const notePath = currentNote?.path;

    if (notePath !== lastNotePathRef.current) {
      lastNotePathRef.current = notePath ?? null;
      setCompiled(null);
      setError(null);
      setFrontmatter(null);
      setDebouncedContent(currentContent);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedContent(currentContent);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentContent, currentNote?.path]);

  useEffect(() => {
    if (!debouncedContent) {
      setCompiled(null);
      setError(null);
      setFrontmatter(null);
      return;
    }

    let cancelled = false;

    setError(null);
    setFrontmatter(parseFrontmatter(debouncedContent));

    const contentWithoutFrontmatter = stripFrontmatter(debouncedContent);

    compileMdx(contentWithoutFrontmatter, resolvers)
      .then((result) => {
        if (!cancelled) {
          setCompiled(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Preview compilation error:", err);
          setError(err.message || "Preview failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedContent, resolvers]);

  if (isLoadingNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2" />
          <p className="text-muted text-sm">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        <p>Select a note to preview</p>
      </div>
    );
  }

  if (currentNote.type === "pdf") {
    const pendingChange = pendingChangeForCurrentNote;
    
    if (pendingChange?.type === "create" && pendingChange.isBinary && pendingChange.content) {
      return (
        <div className="flex-1 min-h-0 bg-background flex flex-col">
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              PDF preview from local data. Click Sync to upload to GitHub.
            </p>
          </div>
          <PendingPDFPreview pendingChange={pendingChange} />
        </div>
      );
    }
    
    return (
      <div className="flex-1 min-h-0 bg-background flex flex-col">
        <EditorPDFViewer path={currentNote.path} adapter={adapter} height="100%" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-background">
      <div className="p-4">
        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
            <p className="font-medium">Preview Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}
        {frontmatter && <FrontmatterDisplay data={frontmatter} />}
        {compiled ? (
          <PreviewErrorBoundary>
            <PreviewContent compiled={compiled} onInternalLinkClick={handleInternalLinkClick} />
          </PreviewErrorBoundary>
        ) : debouncedContent ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ) : (
          <p className="text-muted">Empty document</p>
        )}
      </div>
    </div>
  );
}
