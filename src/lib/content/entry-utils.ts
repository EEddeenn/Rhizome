import type { Entry } from "@/lib/content/types";

export interface EntryMetadata {
  title: string;
  description?: string;
  openGraph: {
    title: string;
    description?: string;
    type: string;
    publishedTime?: string;
    modifiedTime?: string;
    tags?: string[];
  };
  twitter: {
    card: string;
    title: string;
    description?: string;
  };
}

export function buildEntryMetadata(entry: Entry | undefined): EntryMetadata | { title: string } {
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

export function buildFullSlug(category: string, slugParts: string[]): string {
  return `${category}/${slugParts.join("/")}`;
}
