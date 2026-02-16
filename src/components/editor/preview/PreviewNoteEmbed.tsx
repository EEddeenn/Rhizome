"use client";

import { useState, useEffect, useMemo } from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { sharedRemarkPlugins, sharedRehypePlugins, rehypeSlug } from "@/lib/mdx/plugins";
import { remarkWikiLinks, remarkObsidianCallouts, remarkMermaid } from "@/lib/content/plugins";
import { createWikiLinkResolver, createEmbedResolver } from "@/lib/content/wiki-link-resolver";
import { extractSectionBySlug } from "@/lib/content/section-extractor";
import { getManifest } from "@/lib/generated/load-manifest";
import { useManifest } from "../contexts";
import { useEmbedPath, usePreviewLinkClick, EmbedProvider } from "./EmbedContext";
import { PreviewEmbedError } from "./Placeholders";
import { Callout } from "@/components/mdx/Callout";
import { Mermaid } from "@/components/mdx/Mermaid/Mermaid";

interface PreviewNoteEmbedProps {
  slug: string;
  anchor?: string;
  blockId?: string;
}

function PreviewNoteEmbedInternal({ slug, anchor, blockId }: PreviewNoteEmbedProps) {
  const parentPath = useEmbedPath();
  const parentPathKey = useMemo(() => parentPath.join(","), [parentPath]);
  const onLinkClick = usePreviewLinkClick();
  const { mergedEntries } = useManifest();
  const [compiled, setCompiled] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<{ target: string; reason: string } | null>(null);
  const [entry, setEntry] = useState<{ title: string; route: string } | null>(null);

  useEffect(() => {
    const pathArray = parentPathKey ? parentPathKey.split(",") : [];
    if (pathArray.includes(slug)) {
      setError({ target: slug, reason: "cycle_detected" });
      return;
    }

    if (blockId) {
      setError({ target: `${slug}#^${blockId}`, reason: "block_not_found" });
      return;
    }

    const found = mergedEntries.find((e) => e.slug === slug);
    if (!found) {
      setError({ target: slug, reason: "not_found" });
      return;
    }

    setEntry({
      title: found.title,
      route: `/${found.slug}`,
    });

    fetch("/generated/content/content.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch content");
        return res.json();
      })
      .then((contentIndex: Record<string, string>) => {
        let content = contentIndex[slug];
        if (!content) {
          setError({ target: slug, reason: "not_found" });
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

        const manifest = getManifest();
        const linkResolver = createWikiLinkResolver(manifest);
        const embedResolver = createEmbedResolver(manifest);

        return serialize(content, {
          parseFrontmatter: false,
          mdxOptions: {
            remarkPlugins: [
              ...sharedRemarkPlugins,
              remarkMermaid,
              remarkObsidianCallouts,
              [remarkWikiLinks, { resolve: linkResolver, resolveEmbed: embedResolver }],
            ],
            rehypePlugins: [rehypeSlug, ...sharedRehypePlugins],
          },
        });
      })
      .then((result) => {
        if (result) setCompiled(result);
      })
      .catch((err) => {
        console.error("PreviewNoteEmbed error:", err);
        setError({ target: slug, reason: "not_found" });
      });
  }, [slug, anchor, blockId, parentPathKey, mergedEntries]);

  if (error) {
    return <PreviewEmbedError target={error.target} reason={error.reason} />;
  }

  if (!compiled || !entry) {
    return (
      <div className="my-4 border-l-4 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-r-lg">
        <div className="px-4 py-2 h-8 bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
        <div className="px-4 py-3 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  const currentPath = [...parentPath, slug];

  const mdxComponents = {
    a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 hover:underline"
        onClick={(e) => {
          if (href && onLinkClick?.(href)) {
            e.preventDefault();
          }
        }}
      >
        {children}
      </a>
    ),
    Callout,
    Mermaid,
    NoteEmbed: PreviewNoteEmbed,
    EmbedError: PreviewEmbedError,
  };

  return (
    <EmbedProvider path={currentPath} onLinkClick={onLinkClick || undefined}>
      <div className="my-4 border-l-4 border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-900/50 rounded-r-lg">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/50 rounded-tr-lg">
          <a
            href={anchor ? `${entry.route}#${anchor}` : entry.route}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            onClick={(e) => {
              if (onLinkClick?.(anchor ? `${entry.route}#${anchor}` : entry.route)) {
                e.preventDefault();
              }
            }}
          >
            ↗ {entry.title}
            {anchor && <span className="text-gray-500 dark:text-gray-400">#{anchor}</span>}
          </a>
        </div>
        <div className="px-4 py-3 prose prose-sm max-w-none dark:prose-invert">
          <MDXRemote {...compiled} components={mdxComponents} />
        </div>
      </div>
    </EmbedProvider>
  );
}

export function PreviewNoteEmbed(props: PreviewNoteEmbedProps) {
  return <PreviewNoteEmbedInternal {...props} />;
}
