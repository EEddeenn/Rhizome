import type { Entry } from "./types";

function parseDate(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  const timestamp = new Date(dateStr).getTime();
  return isNaN(timestamp) ? 0 : timestamp;
}

function sortByDateDesc(a: Entry, b: Entry): number {
  const dateA = parseDate(a.date);
  const dateB = parseDate(b.date);
  return dateB - dateA;
}

function sortByTitleAsc(a: Entry, b: Entry): number {
  return a.title.localeCompare(b.title);
}

export function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (a.date && b.date) {
      return sortByDateDesc(a, b);
    }
    if (a.date) return -1;
    if (b.date) return 1;
    return sortByTitleAsc(a, b);
  });
}
