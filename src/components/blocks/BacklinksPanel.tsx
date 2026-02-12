import Link from "next/link";
import { getEntryBySlug } from "@/lib/generated/load-manifest";
import type { Entry } from "@/lib/content/types";

interface BacklinksPanelProps {
  slugs: string[];
}

export function BacklinksPanel({ slugs }: BacklinksPanelProps) {
  if (!slugs || slugs.length === 0) return null;

  const entries = slugs
    .map((slug) => getEntryBySlug(slug))
    .filter((e): e is Entry => e !== undefined);

  if (entries.length === 0) return null;

  return (
    <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Backlinks</h2>
      <ul className="space-y-1.5 sm:space-y-2">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={entry.route}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-start sm:items-center gap-2 text-sm sm:text-base"
            >
              <span className="text-muted flex-shrink-0">→</span>
              <span className="truncate">{entry.title}</span>
              {entry.summary && (
                <span className="text-muted text-xs sm:text-sm hidden sm:inline truncate">— {entry.summary}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
