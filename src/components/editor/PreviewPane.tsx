"use client";

import { useState, useEffect, useMemo, Component, useCallback, useRef, type ReactNode } from "react";
import { useNote } from "./contexts/EditorNoteContext";
import { useManifest } from "./contexts/EditorManifestContext";
import { useConnection } from "./contexts/EditorConnectionContext";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { sharedRemarkPlugins, sharedRehypePlugins, rehypeSlug } from "@/lib/mdx/plugins";
import { remarkMermaid, remarkWikiLinks, remarkObsidianCallouts, rehypeBlockIds } from "@/lib/content/plugins";
import { createWikiLinkResolver, createEmbedResolver } from "@/lib/content/wiki-link-resolver";
import { getManifest } from "@/lib/generated/load-manifest";
import { Callout } from "@/components/mdx/Callout";
import { Mermaid } from "@/components/mdx/Mermaid/Mermaid";
import { FrontmatterDisplay } from "./FrontmatterDisplay";
import { PreviewPDFViewer, EditorPDFViewer, PreviewNoteEmbed, PreviewEmbedError, EmbedProvider } from "./preview";
import { scrollElementIntoContainer } from "@/components/navigation";
import { pendingChanges, type PendingChange } from "@/lib/editor/pending-changes";
import matter from "gray-matter";
import dynamic from "next/dynamic";

const PDFViewerInner = dynamic(
  () => import("@/components/mdx/PDFViewer/PDFViewerInner").then((mod) => mod.PDFViewerInner),
  { ssr: false }
);

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
  try {
    const { data } = matter(content);
    return Object.keys(data).length > 0 ? data : null;
  } catch {
    return null;
  }
}

interface EditorPreviewPDFViewerProps {
  src?: string;
  initialPage?: string | number;
  height?: string;
}

function EditorPreviewPDFViewer({ src, initialPage, height }: EditorPreviewPDFViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPending, setIsPending] = useState<boolean | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!src) {
      setIsPending(null);
      setBlobUrl(null);
      return;
    }
    
    const path = `content${src}`;
    const pendingChange = pendingChanges.getChange(path);
    const pending = pendingChange?.type === "create" && 
      pendingChange.isBinary === true && 
      !!pendingChange.content;
    
    setIsPending(pending);

    if (pending && pendingChange?.content) {
      try {
        const binaryString = atob(pendingChange.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        blobUrlRef.current = url;
        setBlobUrl(url);
      } catch {
        setBlobUrl(null);
      }
    } else {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setBlobUrl(null);
    }
  }, [src]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  if (!src) {
    return (
      <div className="my-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
          PDF Viewer: No source provided
        </div>
      </div>
    );
  }

  if (isPending === null || (isPending && !blobUrl)) {
    return (
      <div className="my-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="h-[50vh] flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm animate-pulse">
          Loading PDF viewer...
        </div>
      </div>
    );
  }

  if (isPending && blobUrl) {
    const page = typeof initialPage === "string" ? parseInt(initialPage, 10) : initialPage;
    
    return (
      <div className="my-4 border border-yellow-300 dark:border-yellow-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <div className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-700 text-xs text-yellow-700 dark:text-yellow-300">
          PDF preview from local data (pending sync)
        </div>
        <PDFViewerInner src={blobUrl} initialPage={page || 1} height={height || "50vh"} />
      </div>
    );
  }

  return <PreviewPDFViewer src={src} initialPage={initialPage} height={height} />;
}

interface PendingPDFPreviewProps {
  pendingChange: PendingChange;
}

function PendingPDFPreview({ pendingChange }: PendingPDFPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingChange.content || !pendingChange.isBinary) {
      return;
    }

    try {
      const binaryString = atob(pendingChange.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = url;
      setBlobUrl(url);
    } catch (e) {
      console.error("Failed to create PDF blob:", e);
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [pendingChange.content, pendingChange.isBinary]);

  if (!blobUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  return (
    <PDFViewerInner src={blobUrl} height="100%" />
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PreviewErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="font-medium">Render Error</p>
          <p className="mt-1">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function PreviewContent({ 
  compiled, 
  onInternalLinkClick 
}: { 
  compiled: MDXRemoteSerializeResult;
  onInternalLinkClick: (href: string) => boolean;
}) {
  const mdxComponents = useMemo(
    () => ({
      a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a 
          href={href} 
          className="text-blue-600 dark:text-blue-400 hover:underline"
          onClick={(e) => {
            if (href && onInternalLinkClick(href)) {
              e.preventDefault();
            }
          }}
        >
          {children}
        </a>
      ),
      table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
        <div className="overflow-x-auto">
          <table>{children}</table>
        </div>
      ),
      Callout,
      Mermaid,
      PDFViewer: EditorPreviewPDFViewer,
      NoteEmbed: PreviewNoteEmbed,
      EmbedError: PreviewEmbedError,
    }),
    [onInternalLinkClick]
  );

  return (
    <EmbedProvider onLinkClick={onInternalLinkClick}>
      <div className="prose max-w-none dark:prose-invert prose-sm">
        <MDXRemote {...compiled} components={mdxComponents} />
      </div>
    </EmbedProvider>
  );
}

export function PreviewPane() {
  const { currentContent, currentNote, openNote, isLoadingNote, pendingChangeForCurrentNote } = useNote();
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

    serialize(contentWithoutFrontmatter, {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [
          ...sharedRemarkPlugins,
          remarkMermaid,
          remarkObsidianCallouts,
          [remarkWikiLinks, { resolve: resolvers.resolve, resolveEmbed: resolvers.resolveEmbed }],
        ],
        rehypePlugins: [rehypeSlug, rehypeBlockIds, ...sharedRehypePlugins],
      },
    })
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
