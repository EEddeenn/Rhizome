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

function formatFrontmatterValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  return String(value);
}

function FrontmatterDisplay({ data }: { data: Record<string, unknown> }) {
  const fields: Array<{ key: string; label: string; icon: ReactNode }> = [
    { key: "title", label: "Title", icon: <TitleIcon /> },
    { key: "date", label: "Date", icon: <DateIcon /> },
    { key: "type", label: "Type", icon: <TypeIcon /> },
    { key: "tags", label: "Tags", icon: <TagsIcon /> },
    { key: "status", label: "Status", icon: <StatusIcon /> },
    { key: "summary", label: "Summary", icon: <SummaryIcon /> },
  ];

  const displayFields = fields.filter(f => data[f.key] !== undefined);

  if (displayFields.length === 0) return null;

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-border">
      <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
        Frontmatter
      </div>
      <div className="space-y-2">
        {displayFields.map(({ key, label, icon }) => (
          <div key={key} className="flex items-start gap-2">
            <span className="text-muted mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted">{label}:</span>
              <span className="ml-2 text-sm break-words">
                {formatFrontmatterValue(data[key])}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TitleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function DateIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function TagsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SummaryIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
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
