"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from "react";
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
import { extractSectionBySlug } from "@/lib/content/section-extractor";
import { EmbedError } from "./EmbedError";
import type { Manifest } from "@/lib/content/types";

const loadContent = createCachedFetcher<Record<string, string>>("/generated/content/content.json");
const loadManifest = createCachedFetcher<Manifest>("/generated/manifest/manifest.json");

const EmbedPathContext = createContext<string[]>([]);

function useEmbedPath() {
  return useContext(EmbedPathContext);
}

interface NoteEmbedClientProps {
  slug: string;
  anchor?: string;
  blockId?: string;
}

export function NoteEmbedClient({ slug, anchor, blockId }: NoteEmbedClientProps) {
  const parentPath = useEmbedPath();
  const parentPathKey = useMemo(() => parentPath.join(","), [parentPath]);
  const [compiled, setCompiled] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<{ target: string; reason: "not_found" | "section_not_found" | "block_not_found" | "cycle_detected" } | null>(null);
  const [entry, setEntry] = useState<{ title: string; route: string } | null>(null);

  useEffect(() => {
    const pathArray = parentPathKey ? parentPathKey.split(",") : [];
    if (pathArray.includes(slug)) {
      setError({ target: slug, reason: "cycle_detected" });
      return;
    }

    Promise.all([loadContent(), loadManifest()])
      .then(([contentIndex, manifest]) => {
        const found = manifest.find((e) => e.slug === slug);
        if (!found) {
          setError({ target: slug, reason: "not_found" });
          return null;
        }

        setEntry({ title: found.title, route: found.route });

        let content = contentIndex[slug];
        if (!content) {
          setError({ target: slug, reason: "not_found" });
          return null;
        }

        if (blockId) {
          setError({ target: `${slug}#^${blockId}`, reason: "block_not_found" });
          return null;
        }

        if (anchor) {
          const sectionContent = extractSectionBySlug(content, anchor);
          if (!sectionContent) {
            setError({ target: `${slug}#${anchor}`, reason: "section_not_found" });
            return null;
          }
          content = sectionContent;
        }

        const linkResolver = createWikiLinkResolver(manifest);
        const embedResolver = createEmbedResolver(manifest);

        return serialize(content, {
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
        console.error("NoteEmbedClient error:", err);
        setError({ target: slug, reason: "not_found" });
      });
  }, [slug, anchor, blockId, parentPathKey]);

  if (error) {
    return <EmbedError target={error.target} reason={error.reason} />;
  }

  if (!compiled || !entry) {
    return (
      <div className="my-4 border-l-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-r-lg animate-pulse">
        <div className="px-4 py-2 h-8 bg-gray-100 dark:bg-gray-800/50" />
        <div className="px-4 py-3 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  const currentPath = [...parentPath, slug];

  return (
    <EmbedPathContext.Provider value={currentPath}>
      <div className="my-4 border-l-4 border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-900/50 rounded-r-lg">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/50 rounded-tr-lg">
          <a
            href={anchor ? `${entry.route}#${anchor}` : entry.route}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            ↗ {entry.title}
            {anchor && <span className="text-gray-500 dark:text-gray-400">#{anchor}</span>}
          </a>
        </div>
        <div className="px-4 py-3 prose prose-sm max-w-none dark:prose-invert">
          <MDXRemote {...compiled} />
        </div>
      </div>
    </EmbedPathContext.Provider>
  );
}

interface EmbedProviderProps {
  children: ReactNode;
}

export function EmbedProvider({ children }: EmbedProviderProps) {
  return (
    <EmbedPathContext.Provider value={[]}>
      {children}
    </EmbedPathContext.Provider>
  );
}
