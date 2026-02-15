"use client";

import { useState, useEffect, useMemo, Component, type ReactNode } from "react";
import { useEditor } from "./EditorContext";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { sharedRemarkPlugins, sharedRehypePlugins, rehypeSlug } from "@/lib/mdx/plugins";
import { remarkMermaid, remarkWikiLinks, remarkObsidianCallouts, rehypeBlockIds } from "@/lib/content/plugins";
import { Callout } from "@/components/mdx/Callout";

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

function PreviewMermaid({ code }: { code?: string }) {
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono overflow-x-auto my-4">
      <div className="text-xs text-muted mb-2">Mermaid Diagram</div>
      <pre>{code}</pre>
    </div>
  );
}

function PreviewPDFViewer({ src, initialPage }: { src?: string; initialPage?: number }) {
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm my-4">
      <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">PDF Viewer</div>
      <div>{src}{initialPage ? ` (page ${initialPage})` : ""}</div>
    </div>
  );
}

function PreviewNoteEmbed({ slug, anchor, blockId }: { slug?: string; anchor?: string; blockId?: string }) {
  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm my-4">
      <div className="text-xs text-green-600 dark:text-green-400 mb-1">Embedded Note</div>
      <div>{slug}{anchor ? `#${anchor}` : ""}{blockId ? `#^${blockId}` : ""}</div>
    </div>
  );
}

function PreviewEmbedError({ target, reason }: { target?: string; reason?: string }) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400 my-4">
      <div className="font-medium mb-1">Embed Not Found</div>
      <div>{target} ({reason})</div>
    </div>
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

function PreviewContent({ compiled }: { compiled: MDXRemoteSerializeResult }) {
  const mdxComponents = useMemo(
    () => ({
      a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline">
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
    []
  );

  return (
    <div className="prose max-w-none dark:prose-invert prose-sm">
      <MDXRemote {...compiled} components={mdxComponents} />
    </div>
  );
}

export function PreviewPane() {
  const { currentContent, currentNote } = useEditor();
  const [compiled, setCompiled] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debouncedContent, setDebouncedContent] = useState(currentContent);

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
      return;
    }

    setError(null);

    const contentWithoutFrontmatter = stripFrontmatter(debouncedContent);

    serialize(contentWithoutFrontmatter, {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [
          ...sharedRemarkPlugins,
          remarkMermaid,
          remarkObsidianCallouts,
          remarkWikiLinks,
        ],
        rehypePlugins: [rehypeSlug, rehypeBlockIds, ...sharedRehypePlugins],
      },
    })
      .then((result) => setCompiled(result))
      .catch((err) => {
        console.error("Preview compilation error:", err);
        setError(err.message || "Preview failed");
      });
  }, [debouncedContent]);

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted border-l border-border">
        <p>Select a note to preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto border-l border-border bg-background">
      <div className="p-4">
        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
            <p className="font-medium">Preview Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}
        {compiled ? (
          <PreviewErrorBoundary>
            <PreviewContent compiled={compiled} />
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
