import Link from "next/link";
import type { Entry } from "@/lib/content/types";
import { TagPills } from "./TagPills";

interface EntryListProps {
  entries: Entry[];
  showDate?: boolean;
  showSummary?: boolean;
}

export function EntryList({ entries, showDate = true, showSummary = true }: EntryListProps) {
  if (entries.length === 0) {
    return <p className="text-muted">No entries found.</p>;
  }

  return (
    <ul className="space-y-6">
      {entries.map((entry) => (
        <li key={entry.slug} className="border-b border-border pb-6 last:border-0">
          <Link href={entry.route} className="group">
            <h3 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {entry.title}
            </h3>
          </Link>
          {showDate && entry.date && (
            <p className="text-sm text-muted mt-1">{entry.date}</p>
          )}
          {showSummary && entry.summary && (
            <p className="text-muted mt-2">{entry.summary}</p>
          )}
          <TagPills tags={entry.tags} />
        </li>
      ))}
    </ul>
  );
}
