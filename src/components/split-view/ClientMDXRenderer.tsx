"use client";

import { useState, useEffect, useMemo } from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { remarkWikiLinks } from "@/lib/content/remark-wiki-links";
import { remarkObsidianCallouts } from "@/lib/content/remark-obsidian-callouts";
import { createCachedFetcher } from "@/lib/cache/create-cached-fetcher";
import { createWikiLinkResolver, createEmbedResolver } from "@/lib/content/wiki-link-resolver";
import { MermaidLazy } from "@/components/mdx/MermaidLazy";
import { Callout } from "@/components/mdx/Callout";
import { PDFViewerLazy } from "@/components/mdx/PDFViewerLazy";
import { NoteEmbedClient, EmbedProvider } from "@/components/mdx/NoteEmbedClient";
import { EmbedError } from "@/components/mdx/EmbedError";
import { InternalLink } from "./InternalLink";
import type { Manifest } from "@/lib/content/types";

const loadContent = createCachedFetcher<Record<string, string>>(
  "/generated/content/content.json"
);
const loadManifest = createCachedFetcher<Manifest>("/generated/manifest/manifest.json");

interface ClientMDXRendererProps {
  slug: string;
}

export function ClientMDXRenderer({ slug }: ClientMDXRendererProps) {
  const [compiled, setCompiled] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setCompiled(null);

    Promise.all([loadContent(), loadManifest()])
      .then(([contentIndex, manifest]) => {
        const rawContent = contentIndex[slug];
        if (!rawContent) {
          setError(`Content not found for slug: ${slug}`);
          return;
        }

        const linkResolver = createWikiLinkResolver(manifest);
        const embedResolver = createEmbedResolver(manifest);

        return serialize(rawContent, {
          parseFrontmatter: false,
          mdxOptions: {
            remarkPlugins: [
              remarkGfm,
              remarkMath,
              remarkObsidianCallouts,
              [remarkWikiLinks, { resolve: linkResolver, resolveEmbed: embedResolver }],
            ],
            rehypePlugins: [rehypeSlug, rehypeKatex, rehypeHighlight],
          },
        });
      })
      .then((result) => {
        if (result) setCompiled(result);
      })
      .catch((err) => {
        setError(`Failed to load content: ${err.message}`);
      });
  }, [slug]);

  const mdxComponents = useMemo(() => ({
    a: InternalLink,
    table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="overflow-x-auto">
        <table>{children}</table>
      </div>
    ),
    Mermaid: MermaidLazy,
    Callout,
    PDFViewer: PDFViewerLazy,
    NoteEmbed: NoteEmbedClient,
    EmbedError,
  }), []);

  if (error) {
    return (
      <div className="p-4 text-red-500 dark:text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!compiled) {
    return (
      <div className="p-4 animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  return (
    <EmbedProvider>
      <div className="prose max-w-none dark:prose-invert prose-sm">
        <MDXRemote {...compiled} components={mdxComponents} />
      </div>
    </EmbedProvider>
  );
}
