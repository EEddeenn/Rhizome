"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [miniSearch, setMiniSearch] = useState<{ search: (q: string) => unknown[] } | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);

  const debouncedQuery = useDebouncedValue(query, 150);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      import("minisearch").then((m) => m.default),
      fetch("/generated/search/search-index.json").then((res) => res.json()),
    ])
      .then(([MiniSearch, docs]) => {
        const ms = new MiniSearch(miniSearchOptions);
        ms.addAll(docs as SearchDoc[]);
        setMiniSearch(ms);

        const tags = new Set<string>();
        (docs as SearchDoc[]).forEach((doc) => doc.tags?.forEach((t) => tags.add(t)));
        setAllTags(Array.from(tags).sort());

        setLoading(false);
      });
  }, []);

  const results = useMemo(() => {
    if (!miniSearch || !debouncedQuery.trim()) return [];

    let filtered = miniSearch.search(debouncedQuery) as unknown as SearchDoc[];

    if (typeFilter) {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }

    if (tagFilter) {
      filtered = filtered.filter((r) => r.tags?.includes(tagFilter));
    }

    return filtered;
  }, [debouncedQuery, typeFilter, tagFilter, miniSearch]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results.length]);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      window.location.href = results[selectedIndex].route;
    } else if (e.key === "Escape") {
      setSelectedIndex(-1);
      inputRef.current?.focus();
    }
  }, [results, selectedIndex]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Search</h1>

      {loading ? (
        <p className="text-muted">Loading search index...</p>
      ) : (
        <>
          <div className="mb-6 space-y-3 sm:space-y-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
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
              <p className="text-sm text-muted">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>

              {results.length > 0 ? (
                <ul className="space-y-3 sm:space-y-4">
                  {results.map((result, index) => (
                    <li
                      key={result.id}
                      ref={index === selectedIndex ? selectedRef : null}
                    >
                      <Link
                        href={result.route}
                        className={`block p-3 sm:p-4 border rounded-lg transition-colors ${
                          index === selectedIndex
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
                        }`}
                      >
                        <div>
                          <h2 className="font-semibold text-base sm:text-lg">{result.title}</h2>
                          <p className="text-xs sm:text-sm text-muted mt-1">
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
                <p className="text-muted">No results found.</p>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="max-w-3xl mx-auto px-4 py-6 sm:py-8"><p className="text-muted">Loading...</p></main>}>
      <SearchContent />
    </Suspense>
  );
}
