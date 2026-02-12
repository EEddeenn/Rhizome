import { getArticles } from "@/lib/generated/load-manifest";
import { sortEntries } from "@/lib/content/sort";
import { EntryList } from "@/components/blocks/EntryList";

export const metadata = {
  title: "Articles",
  description: "All articles in the knowledge base",
};

export default function ArticlesPage() {
  const articles = sortEntries(getArticles());

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Articles</h1>
      <EntryList entries={articles} />
    </main>
  );
}
