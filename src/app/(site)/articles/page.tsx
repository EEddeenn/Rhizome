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
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Articles</h1>
      <EntryList entries={articles} />
    </main>
  );
}
