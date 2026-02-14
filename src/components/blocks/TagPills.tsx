import Link from "next/link";
import type { Entry } from "@/lib/content/types";

interface TagPillsProps {
  tags: Entry["tags"];
}

export function TagPills({ tags }: TagPillsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/tags/${encodeURIComponent(tag)}`}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          #{tag}
        </Link>
      ))}
    </div>
  );
}
