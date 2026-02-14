import { normalizeTitle } from "./normalize";
import type { Manifest } from "./types";

export function createWikiLinkResolver(manifest: Manifest): (title: string) => string {
  const titleToRoute = new Map<string, string>();

  for (const entry of manifest) {
    titleToRoute.set(normalizeTitle(entry.title), entry.route);
  }

  return (title: string): string => {
    const route = titleToRoute.get(normalizeTitle(title));
    return route ?? `/notes/${title.toLowerCase().replace(/\s+/g, "-")}`;
  };
}
