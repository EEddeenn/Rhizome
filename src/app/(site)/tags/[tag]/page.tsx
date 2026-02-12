import { notFound } from "next/navigation";
import { getAllTags, getSlugsForTag } from "@/lib/generated/load-tags";
import { getEntryBySlug } from "@/lib/generated/load-manifest";
import { sortEntries } from "@/lib/content/sort";
import { EntryList } from "@/components/blocks/EntryList";

interface PageProps {
  params: Promise<{ tag: string }>;
}

export function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params;
  return {
    title: `Tag: ${tag}`,
    description: `All entries tagged with ${tag}`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const slugs = getSlugsForTag(tag);

  if (slugs.length === 0) {
    notFound();
  }

  const entries = slugs
    .map((slug) => getEntryBySlug(slug))
    .filter((e) => e !== undefined);

  const sorted = sortEntries(entries);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        <span className="text-muted">#</span>
        {tag}
      </h1>
      <p className="text-muted mb-8">
        {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
      </p>
      <EntryList entries={sorted} />
    </main>
  );
}
