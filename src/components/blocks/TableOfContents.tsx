import type { Heading } from "@/lib/content/types";

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  if (!headings || headings.length === 0) return null;

  const filteredHeadings = headings.filter((h) => h.depth >= 2 && h.depth <= 4);
  if (filteredHeadings.length === 0) return null;

  return (
    <nav className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Table of Contents
      </h2>
      <ul className="space-y-1">
        {filteredHeadings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.depth - 2) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline block py-0.5"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
