import { notFound } from "next/navigation";
import { getEntryBySlug, getNotes } from "@/lib/generated/load-manifest";
import { EntryPage } from "@/components/pages";

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
    openGraph: {
      title: entry.title,
      description: entry.summary,
      type: "article",
      publishedTime: entry.date,
      modifiedTime: entry.updated,
      tags: entry.tags,
    },
    twitter: {
      card: "summary",
      title: entry.title,
      description: entry.summary,
    },
  };
}

export default async function NotePage({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = `notes/${slug.join("/")}`;
  const entry = getEntryBySlug(fullSlug);

  if (!entry) {
    notFound();
  }

  return <EntryPage entry={entry} categoryLabel="Notes" categoryHref="/notes" />;
}
