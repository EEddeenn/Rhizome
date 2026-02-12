import Link from "next/link";
import { getAllTags } from "@/lib/generated/load-tags";

export const metadata = {
  title: "Tags",
  description: "Browse content by tag",
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Tags</h1>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            #{tag}
          </Link>
        ))}
      </div>
    </main>
  );
}
