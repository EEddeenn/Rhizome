import { getArticles } from "@/lib/generated/load-manifest";
import { sortEntries } from "@/lib/content/sort";
import { CategoryPage } from "@/components/blocks/CategoryPage";

export const metadata = {
  title: "Articles",
  description: "All articles in the knowledge base",
};

export default function ArticlesPage() {
  const articles = sortEntries(getArticles());
  return <CategoryPage title="Articles" entries={articles} />;
}
