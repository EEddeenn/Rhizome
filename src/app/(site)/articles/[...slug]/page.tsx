import { notFound } from "next/navigation";
import { getEntryBySlug, getArticles } from "@/lib/generated/load-manifest";
import { EntryPage } from "@/components/pages";
import { buildEntryMetadata, buildFullSlug } from "@/lib/content";

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
  const fullSlug = buildFullSlug("articles", slug);
  const entry = getEntryBySlug(fullSlug);
  return buildEntryMetadata(entry);
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const fullSlug = buildFullSlug("articles", slug);
  const entry = getEntryBySlug(fullSlug);

  if (!entry) {
    notFound();
  }

  return <EntryPage entry={entry} categoryLabel="Articles" categoryHref="/articles" />;
}
