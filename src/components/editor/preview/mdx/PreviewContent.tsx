"use client";

import { useMemo } from "react";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { Callout } from "@/components/mdx/Callout";
import { Mermaid } from "@/components/mdx/Mermaid/Mermaid";
import { PreviewNoteEmbed } from "../PreviewNoteEmbed";
import { PreviewEmbedError } from "../EditorPDFViewer";
import { EmbedProvider } from "../EmbedContext";
import { EditorPreviewPDFViewer } from "../pdf/EditorPreviewPDFViewer";

interface PreviewContentProps {
  compiled: MDXRemoteSerializeResult;
  onInternalLinkClick: (href: string) => boolean;
}

export function PreviewContent({ compiled, onInternalLinkClick }: PreviewContentProps) {
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
