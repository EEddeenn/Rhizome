import Link from "next/link";
import { getAllTags } from "@/lib/generated/load-tags";

export const metadata = {
  title: "Tags",
  description: "Browse content by tag",
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tags</h1>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            #{tag}
          </Link>
        ))}
      </div>
    </main>
  );
}
