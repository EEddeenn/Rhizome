"use client";

import { useState, useEffect, useMemo, Component, type ReactNode } from "react";
import { useEditor } from "./EditorContext";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { sharedRemarkPlugins, sharedRehypePlugins, rehypeSlug } from "@/lib/mdx/plugins";
import { remarkMermaid, remarkWikiLinks, remarkObsidianCallouts, rehypeBlockIds } from "@/lib/content/plugins";
import { createWikiLinkResolver, createEmbedResolver } from "@/lib/content/wiki-link-resolver";
import { getManifest } from "@/lib/generated/load-manifest";
import { Callout } from "@/components/mdx/Callout";
import { FrontmatterDisplay } from "./FrontmatterDisplay";
import { PreviewMermaid, PreviewPDFViewer, PreviewNoteEmbed, PreviewEmbedError } from "./PreviewPlaceholders";
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
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown> | null>(null);

  const resolvers = useMemo(() => {
    const manifest = getManifest();
    return {
      resolve: createWikiLinkResolver(manifest),
      resolveEmbed: createEmbedResolver(manifest),
    };
  }, []);

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

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted">
        <p>Select a note to preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
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
