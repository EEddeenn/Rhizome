import { notFound } from "next/navigation";
import { getEntryBySlug, getNotes } from "@/lib/generated/load-manifest";
import { EntryPage } from "@/components/pages";
import { buildEntryMetadata, buildFullSlug } from "@/lib/content";

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
  const fullSlug = buildFullSlug("notes", slug);
  const entry = getEntryBySlug(fullSlug);
  return buildEntryMetadata(entry);
}

export default async function NotePage({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = buildFullSlug("notes", slug);
  const entry = getEntryBySlug(fullSlug);

  if (!entry) {
    notFound();
  }

  return <EntryPage entry={entry} categoryLabel="Notes" categoryHref="/notes" />;
}
