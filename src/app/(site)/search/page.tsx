"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MiniSearch from "minisearch";
import { SearchDoc } from "@/lib/content/types";

const miniSearchOptions = {
  fields: ["title", "text", "tags"],
  storeFields: ["id", "title", "route", "type", "tags", "date"],
  searchOptions: {
    boost: { title: 2, tags: 1.5 },
    fuzzy: 0.2,
    prefix: true,
  },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [miniSearch, setMiniSearch] = useState<MiniSearch<SearchDoc> | null>(null);
  const [results, setResults] = useState<SearchDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    fetch("/generated/search-index.json")
      .then((res) => res.json())
      .then((docs: SearchDoc[]) => {
        const ms = new MiniSearch(miniSearchOptions);
        ms.addAll(docs);
        setMiniSearch(ms);

        const tags = new Set<string>();
        docs.forEach((doc) => doc.tags?.forEach((t) => tags.add(t)));
        setAllTags(Array.from(tags).sort());

        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!miniSearch || !query.trim()) {
      setResults([]);
      return;
    }

    const rawResults = miniSearch.search(query);
    let filtered = rawResults as unknown as SearchDoc[];

    if (typeFilter) {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }

    if (tagFilter) {
      filtered = filtered.filter((r) => r.tags?.includes(tagFilter));
    }

    setResults(filtered);
  }, [query, typeFilter, tagFilter, miniSearch]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Search</h1>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading search index...</p>
      ) : (
        <>
          <div className="mb-6 space-y-3 sm:space-y-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes and articles..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">All types</option>
                <option value="note">Notes</option>
                <option value="article">Articles</option>
              </select>

              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {query.trim() && (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>

              {results.length > 0 ? (
                <ul className="space-y-3 sm:space-y-4">
                  {results.map((result) => (
                    <li key={result.id}>
                      <Link
                        href={result.route}
                        className="block p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                      >
                        <div>
                          <h2 className="font-semibold text-base sm:text-lg">{result.title}</h2>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {result.type}
                            {result.date && ` · ${result.date}`}
                          </p>
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No results found.</p>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
