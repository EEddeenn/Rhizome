import { notFound } from "next/navigation";
import { getEntryBySlug, getArticles } from "@/lib/generated/load-manifest";
import { EntryPage } from "@/components/blocks/EntryPage";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  const articles = getArticles();
  return articles.map((article) => ({
    slug: article.slug.replace(/^articles\//, "").split("/"),
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = `articles/${slug.join("/")}`;
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

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = `articles/${slug.join("/")}`;
  const entry = getEntryBySlug(fullSlug);

  if (!entry) {
    notFound();
  }

  return <EntryPage entry={entry} categoryLabel="Articles" categoryHref="/articles" />;
}
