"use client";

import { useState, useEffect, useMemo, Component, useCallback, useRef, type ReactNode } from "react";
import { useNote, useManifest } from "./contexts";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { sharedRemarkPlugins, sharedRehypePlugins, rehypeSlug } from "@/lib/mdx/plugins";
import { remarkMermaid, remarkWikiLinks, remarkObsidianCallouts, rehypeBlockIds } from "@/lib/content/plugins";
import { createWikiLinkResolver, createEmbedResolver } from "@/lib/content/wiki-link-resolver";
import { getManifest } from "@/lib/generated/load-manifest";
import { Callout } from "@/components/mdx/Callout";
import { FrontmatterDisplay } from "./FrontmatterDisplay";
import { PreviewMermaid, PreviewPDFViewer, PreviewNoteEmbed, PreviewEmbedError } from "./PreviewPlaceholders";
import { scrollElementIntoContainer } from "@/components/navigation";
import matter from "gray-matter";

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
      Mermaid: PreviewMermaid,
      PDFViewer: PreviewPDFViewer,
      NoteEmbed: PreviewNoteEmbed,
      EmbedError: PreviewEmbedError,
    }),
    [onInternalLinkClick]
  );

  return (
    <div className="prose max-w-none dark:prose-invert prose-sm">
      <MDXRemote {...compiled} components={mdxComponents} />
    </div>
  );
}

export function PreviewPane() {
  const { currentContent, currentNote, openNote, isLoadingNote } = useNote();
  const { mergedEntries } = useManifest();
  const [compiled, setCompiled] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debouncedContent, setDebouncedContent] = useState(currentContent);
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingAnchorRef = useRef<string | null>(null);

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
    const timer = setTimeout(() => {
      setDebouncedContent(currentContent);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentContent]);

  useEffect(() => {
    if (!debouncedContent) {
      setCompiled(null);
      setError(null);
      setFrontmatter(null);
      return;
    }

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
      .then((result) => setCompiled(result))
      .catch((err) => {
        console.error("Preview compilation error:", err);
        setError(err.message || "Preview failed");
      });
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
