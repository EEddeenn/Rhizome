import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { getEntryBySlug, getNotes, getAllEntries } from "@/lib/generated/load-manifest";
import { getBacklinksForSlug } from "@/lib/generated/load-backlinks";
import { getMdxContent } from "@/lib/generated/load-content";
import { TagPills } from "@/components/blocks/TagPills";
import { BacklinksPanel } from "@/components/blocks/BacklinksPanel";
import { remarkWikiLinks } from "@/lib/content/remark-wiki-links";
import { Mermaid } from "@/components/mdx/Mermaid";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  const notes = getNotes();
  return notes.map((note) => ({
    slug: note.slug.replace(/^notes\//, "").split("/"),
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = `notes/${slug.join("/")}`;
  const entry = getEntryBySlug(fullSlug);

  if (!entry) {
    return { title: "Not Found" };
  }

  return {
    title: entry.title,
    description: entry.summary,
  };
}

function buildWikiLinkResolver() {
  const entries = getAllEntries();
  const titleToSlug = new Map<string, string>();
  
  for (const entry of entries) {
    const normalized = entry.title.toLowerCase().trim();
    titleToSlug.set(normalized, entry.route);
  }

  return (title: string): string => {
    const normalized = title.toLowerCase().trim();
    const route = titleToSlug.get(normalized);
    if (route) return route;
    return `/notes/${title.toLowerCase().replace(/\s+/g, "-")}`;
  };
}

export default async function NotePage({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = `notes/${slug.join("/")}`;
  const entry = getEntryBySlug(fullSlug);

  if (!entry) {
    notFound();
  }

  const backlinks = getBacklinksForSlug(fullSlug);
  const source = getMdxContent(fullSlug);

  if (!source) {
    notFound();
  }

  const resolveWikiLink = buildWikiLinkResolver();

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{entry.title}</h1>
        {entry.date && (
          <p className="text-muted mt-2">{entry.date}</p>
        )}
        {entry.summary && (
          <p className="text-muted mt-4 text-lg">{entry.summary}</p>
        )}
        <TagPills tags={entry.tags} />
      </header>

      <div className="prose max-w-none">
        <MDXRemote 
          source={source} 
          components={{ Mermaid }}
          options={{
            mdxOptions: {
              remarkPlugins: [
                remarkGfm,
                remarkMath,
                [remarkWikiLinks, { resolve: resolveWikiLink }]
              ],
              rehypePlugins: [rehypeKatex],
            },
          }}
        />
      </div>

      <BacklinksPanel slugs={backlinks} />
    </article>
  );
}
