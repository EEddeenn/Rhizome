import { getNotes, getArticles } from "@/lib/generated/load-manifest";
import { sortEntries } from "@/lib/content/sort";
import { EntryListSection } from "@/components/blocks/EntryListSection";

export default function HomePage() {
  const notes = sortEntries(getNotes()).slice(0, 5);
  const articles = sortEntries(getArticles()).slice(0, 5);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Rhizome</h1>
      <p className="text-base sm:text-lg text-muted mb-6 sm:mb-8">
        A static personal notes and knowledge management system
      </p>

      <div className="grid gap-8 sm:gap-12 md:grid-cols-2">
        <EntryListSection title="Recent Notes" viewAllHref="/notes" entries={notes} />
        <EntryListSection title="Recent Articles" viewAllHref="/articles" entries={articles} />
      </div>
    </main>
  );
}
