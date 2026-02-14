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
import { MermaidLazy } from "@/components/mdx/MermaidLazy";
import { Callout } from "@/components/mdx/Callout";
import { PDFViewerLazy } from "@/components/mdx/PDFViewerLazy";
import { InternalLink } from "./InternalLink";
import type { Manifest } from "@/lib/content/types";

let contentCache: Record<string, string> | null = null;
let contentPromise: Promise<Record<string, string>> | null = null;
let manifestCache: Manifest | null = null;
let manifestPromise: Promise<Manifest> | null = null;
let titleToRouteCache: Map<string, string> | null = null;

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

async function loadContent(): Promise<Record<string, string>> {
  if (contentCache) return contentCache;
  if (contentPromise) return contentPromise;
  
  contentPromise = fetch("/generated/content/content.json")
    .then((res) => res.json())
    .then((data) => {
      contentCache = data;
      return data;
    });
  
  return contentPromise;
}

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

function buildTitleToRouteMap(manifest: Manifest): Map<string, string> {
  if (titleToRouteCache) return titleToRouteCache;
  const map = new Map<string, string>();
  for (const entry of manifest) {
    map.set(normalizeTitle(entry.title), entry.route);
  }
  titleToRouteCache = map;
  return map;
}

function createWikiLinkResolver(manifest: Manifest): (title: string) => string {
  const titleMap = buildTitleToRouteMap(manifest);
  return (title: string) => {
    const route = titleMap.get(normalizeTitle(title));
    return route || `/notes/${title.toLowerCase().replace(/\s+/g, "-")}`;
  };
}

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

        const resolver = createWikiLinkResolver(manifest);

        return serialize(rawContent, {
          parseFrontmatter: false,
          mdxOptions: {
            remarkPlugins: [
              remarkGfm,
              remarkMath,
              [remarkWikiLinks, { resolve: resolver }],
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
    <div className="prose max-w-none dark:prose-invert prose-sm">
      <MDXRemote {...compiled} components={mdxComponents} />
    </div>
  );
}
