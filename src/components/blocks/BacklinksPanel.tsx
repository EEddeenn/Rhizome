import { useMemo } from "react";
import Link from "next/link";
import type { BacklinkInfo, Entry } from "@/lib/content/types";
import { getEntryBySlug } from "@/lib/generated/load-manifest";

interface BacklinksPanelProps {
  backlinks: BacklinkInfo[];
}

function groupByHeading(backlinks: BacklinkInfo[]): Map<string | null, BacklinkInfo[]> {
  const groups = new Map<string | null, BacklinkInfo[]>();
  
  for (const backlink of backlinks) {
    const key = backlink.heading || null;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(backlink);
  }
  
  return groups;
}

export function BacklinksPanel({ backlinks }: BacklinksPanelProps) {
  const { entriesWithInfo, grouped, entriesMap, hasHeadings } = useMemo(() => {
    if (!backlinks || backlinks.length === 0) {
      return {
        entriesWithInfo: [] as { entry: Entry; info: BacklinkInfo }[],
        grouped: new Map<string | null, BacklinkInfo[]>(),
        entriesMap: new Map<string, Entry>(),
        hasHeadings: false
      };
    }
    const entriesWithInfo = backlinks
      .map((info) => {
        const entry = getEntryBySlug(info.slug);
        return entry ? { entry, info } : null;
      })
      .filter((e): e is { entry: Entry; info: BacklinkInfo } => e !== null);

    const grouped = groupByHeading(backlinks);
    const entriesMap = new Map(entriesWithInfo.map(({ entry, info }) => [info.slug, entry]));
    const hasHeadings = [...grouped.keys()].some((h) => h !== null);

    return { entriesWithInfo, grouped, entriesMap, hasHeadings };
  }, [backlinks]);

  if (entriesWithInfo.length === 0) return null;

  return (
    <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Backlinks</h2>
      
      {hasHeadings ? (
        <div className="space-y-4">
          {[...grouped.entries()].map(([heading, infos]) => (
            <div key={heading || "ungrouped"}>
              {heading && (
                <h3 className="text-sm font-medium text-muted mb-2">{heading}</h3>
              )}
              <ul className="space-y-2">
                {infos.map((info) => {
                  const entry = entriesMap.get(info.slug);
                  if (!entry) return null;
                  
                  return (
                    <li key={info.slug}>
                      <Link
                        href={entry.route}
                        className="block group"
                      >
                        <span className="text-blue-600 dark:text-blue-400 group-hover:underline font-medium">
                          {entry.title}
                        </span>
                        {info.snippet && (
                          <p className="text-sm text-muted mt-0.5 line-clamp-2">
                            {info.snippet}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {entriesWithInfo.map(({ entry, info }) => (
            <li key={info.slug}>
              <Link
                href={entry.route}
                className="block group"
              >
                <span className="text-blue-600 dark:text-blue-400 group-hover:underline font-medium">
                  {entry.title}
                </span>
                {info.snippet && (
                  <p className="text-sm text-muted mt-0.5 line-clamp-2">
                    {info.snippet}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
