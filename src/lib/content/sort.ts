import type { Entry } from "./types";

export function sortByDateDesc(a: Entry, b: Entry): number {
  const dateA = a.date ? new Date(a.date).getTime() : 0;
  const dateB = b.date ? new Date(b.date).getTime() : 0;
  return dateB - dateA;
}

export function sortByTitleAsc(a: Entry, b: Entry): number {
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
