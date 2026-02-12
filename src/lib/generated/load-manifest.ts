import manifest from "@/generated/manifest.json";
import type { Entry, Manifest } from "@/lib/content/types";

let entryMap: Map<string, Entry> | null = null;
let wikiLinkResolver: ((title: string) => string) | null = null;
let notesCache: Entry[] | null = null;
let articlesCache: Entry[] | null = null;

function getEntryMap(): Map<string, Entry> {
  if (!entryMap) {
    entryMap = new Map();
    for (const entry of manifest as Manifest) {
      entryMap.set(entry.slug, entry);
    }
  }
  return entryMap;
}

export function getManifest(): Manifest {
  return manifest as Manifest;
}

export function getAllEntries(): Entry[] {
  return getManifest();
}

export function getEntryBySlug(slug: string): Entry | undefined {
  return getEntryMap().get(slug);
}

export function getNotes(): Entry[] {
  if (!notesCache) {
    notesCache = getAllEntries().filter((entry) => entry.slug.startsWith("notes/"));
  }
  return notesCache;
}

export function getArticles(): Entry[] {
  if (!articlesCache) {
    articlesCache = getAllEntries().filter((entry) => entry.slug.startsWith("articles/"));
  }
  return articlesCache;
}

export function getWikiLinkResolver(): (title: string) => string {
  if (!wikiLinkResolver) {
    const entries = getAllEntries();
    const titleToSlug = new Map<string, string>();
    
    for (const entry of entries) {
      const normalized = entry.title.toLowerCase().trim();
      titleToSlug.set(normalized, entry.route);
    }

    wikiLinkResolver = (title: string): string => {
      const normalized = title.toLowerCase().trim();
      const route = titleToSlug.get(normalized);
      if (route) return route;
      return `/notes/${title.toLowerCase().replace(/\s+/g, "-")}`;
    };
  }
  
  return wikiLinkResolver;
}
