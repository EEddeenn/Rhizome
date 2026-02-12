import Link from "next/link";
import type { Entry } from "@/lib/content/types";

interface EntryListSectionProps {
  title: string;
  viewAllHref: string;
  entries: Entry[];
}

export function EntryListSection({ title, viewAllHref, entries }: EntryListSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
        <Link href={viewAllHref} className="text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm">
          View all
        </Link>
      </div>
      <ul className="space-y-2 sm:space-y-3">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={entry.route}
              className="block p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <h3 className="font-medium text-sm sm:text-base">{entry.title}</h3>
              {entry.summary && (
                <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1">{entry.summary}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
