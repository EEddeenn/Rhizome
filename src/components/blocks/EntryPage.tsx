import { MDXRemote } from "next-mdx-remote/rsc";
import type { Entry } from "@/lib/content/types";
import { getBacklinksForSlug } from "@/lib/generated/load-backlinks";
import { getMdxContent } from "@/lib/generated/load-content";
import { getMdxPlugins } from "@/lib/content/mdx-config";
import { TagPills } from "@/components/blocks/TagPills";
import { BacklinksPanel } from "@/components/blocks/BacklinksPanel";
import { TableOfContents } from "@/components/blocks/TableOfContents";
import { EntryMetadata } from "@/components/blocks/EntryMetadata";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Mermaid } from "@/components/mdx/Mermaid";
import { Callout } from "@/components/mdx/Callout";
import { PDFViewer } from "@/components/mdx/PDFViewer";
import { useMDXComponents } from "@/components/mdx/MDXComponents";

interface EntryPageProps {
  entry: Entry;
  categoryLabel: string;
  categoryHref: string;
}

export function EntryPage({ entry, categoryLabel, categoryHref }: EntryPageProps) {
  const backlinks = getBacklinksForSlug(entry.slug);
  const source = getMdxContent(entry.slug);
  const { remarkPlugins, rehypePlugins } = getMdxPlugins();
  const mdxComponents = useMDXComponents({});

  const breadcrumbItems = [
    { label: categoryLabel, href: categoryHref },
    { label: entry.title },
  ];

  if (!source) {
    return null;
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <Breadcrumbs items={breadcrumbItems} />
      
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{entry.title}</h1>
        <EntryMetadata
          date={entry.date}
          updated={entry.updated}
          status={entry.status}
          readingTimeMin={entry.readingTimeMin}
          wordCount={entry.wordCount}
        />
        {entry.summary && (
          <p className="text-muted mt-3 sm:mt-4 text-base sm:text-lg">{entry.summary}</p>
        )}
        <TagPills tags={entry.tags} />
      </header>

      {entry.headings && entry.headings.length > 0 && (
        <TableOfContents headings={entry.headings} />
      )}

      <div className="prose max-w-none">
        <MDXRemote 
          source={source} 
          components={{ ...mdxComponents, Mermaid, Callout, PDFViewer }}
          options={{
            mdxOptions: {
              remarkPlugins,
              rehypePlugins,
            },
          }}
        />
      </div>

      <BacklinksPanel slugs={backlinks} />
    </article>
  );
}
