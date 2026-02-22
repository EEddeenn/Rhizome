import Link from "next/link";
import { memo } from "react";
import type { Entry } from "@/lib/content/types";
import { TagPills } from "./TagPills";

interface EntryItemProps {
  entry: Entry;
  showDate: boolean;
  showSummary: boolean;
}

const EntryItem = memo(function EntryItem({ entry, showDate, showSummary }: EntryItemProps) {
  return (
    <li className="border-b border-border pb-4 sm:pb-6 last:border-0">
      <Link href={entry.route} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded -m-1 p-1 block">
        <h3 className="text-base sm:text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {entry.title}
        </h3>
      </Link>
      {showDate && entry.date && (
        <p className="text-xs sm:text-sm text-muted mt-1">{entry.date}</p>
      )}
      {showSummary && entry.summary && (
        <p className="text-muted text-sm sm:text-base mt-1.5 sm:mt-2">{entry.summary}</p>
      )}
      <TagPills tags={entry.tags} />
    </li>
  );
});

interface EntryListProps {
  entries: Entry[];
  showDate?: boolean;
  showSummary?: boolean;
}

export function EntryList({ entries, showDate = true, showSummary = true }: EntryListProps) {
  if (entries.length === 0) {
    return <p className="text-muted text-sm sm:text-base">No entries found.</p>;
  }

  return (
    <ul className="space-y-4 sm:space-y-6">
      {entries.map((entry) => (
        <EntryItem key={entry.slug} entry={entry} showDate={showDate} showSummary={showSummary} />
      ))}
    </ul>
  );
}
