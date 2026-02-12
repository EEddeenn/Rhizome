import Link from "next/link";
import { getNotes, getArticles } from "@/lib/generated/load-manifest";
import { sortEntries } from "@/lib/content/sort";

export default function HomePage() {
  const notes = sortEntries(getNotes()).slice(0, 5);
  const articles = sortEntries(getArticles()).slice(0, 5);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Rhizome</h1>
      <p className="text-lg text-muted mb-8">
        A static personal notes and knowledge management system
      </p>

      <div className="grid gap-12 md:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Notes</h2>
            <Link href="/notes" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.slug}>
                <Link
                  href={note.route}
                  className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <h3 className="font-medium">{note.title}</h3>
                  {note.summary && (
                    <p className="text-sm text-muted mt-1">{note.summary}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Articles</h2>
            <Link href="/articles" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              View all
            </Link>
          </div>
          <ul className="space-y-3">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={article.route}
                  className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <h3 className="font-medium">{article.title}</h3>
                  {article.summary && (
                    <p className="text-sm text-muted mt-1">{article.summary}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
