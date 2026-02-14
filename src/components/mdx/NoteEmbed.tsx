import { MDXRemote } from "next-mdx-remote/rsc";
import { getMdxContent } from "@/lib/generated/load-content";
import { getEntryBySlug } from "@/lib/generated/load-manifest";
import { getMdxPlugins } from "@/lib/content/mdx-config";
import { extractSectionBySlug } from "@/lib/content/section-extractor";
import { EmbedError } from "./EmbedError";
import { MermaidLazy } from "./MermaidLazy";
import { Callout } from "./Callout";
import { PDFViewerLazy } from "./PDFViewerLazy";

interface NoteEmbedProps {
  slug: string;
  anchor?: string;
  blockId?: string;
  parentPath?: string[];
}

function NoteEmbedInternal({ slug, anchor, blockId, parentPath = [] }: NoteEmbedProps) {
  if (parentPath.includes(slug)) {
    return <EmbedError target={slug} reason="cycle_detected" />;
  }

  const entry = getEntryBySlug(slug);
  if (!entry) {
    return <EmbedError target={slug} reason="not_found" />;
  }

  let content = getMdxContent(slug);
  if (!content) {
    return <EmbedError target={slug} reason="not_found" />;
  }

  if (blockId) {
    return <EmbedError target={`${slug}#^${blockId}`} reason="block_not_found" />;
  }

  if (anchor) {
    const sectionContent = extractSectionBySlug(content, anchor);
    if (!sectionContent) {
      return <EmbedError target={`${slug}#${anchor}`} reason="section_not_found" />;
    }
    content = sectionContent;
  }

  const currentPath = [...parentPath, slug];
  const { remarkPlugins, rehypePlugins } = getMdxPlugins();
  const NestedNoteEmbed = createNoteEmbedWithParentPath(currentPath);

  return (
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
        <MDXRemote
          source={content}
          components={{ Mermaid: MermaidLazy, Callout, PDFViewer: PDFViewerLazy, NoteEmbed: NestedNoteEmbed, EmbedError }}
          options={{
            mdxOptions: {
              remarkPlugins,
              rehypePlugins,
            },
          }}
        />
      </div>
    </div>
  );
}

function createNoteEmbedWithParentPath(parentPath: string[]) {
  return function NoteEmbedWithParentPath(props: Omit<NoteEmbedProps, "parentPath">) {
    return <NoteEmbedInternal {...props} parentPath={parentPath} />;
  };
}

export const NoteEmbed = createNoteEmbedWithParentPath([]);
