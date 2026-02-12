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
    <div className="mt-12 pt-8 border-t border-border">
      <h2 className="text-lg font-semibold mb-4">Backlinks</h2>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={entry.route}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
            >
              <span className="text-muted">→</span>
              <span>{entry.title}</span>
              {entry.summary && (
                <span className="text-muted text-sm">— {entry.summary}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
