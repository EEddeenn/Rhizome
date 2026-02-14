import manifest from "@/generated/manifest/manifest.json";
import type { Entry, Manifest } from "@/lib/content/types";
import { createWikiLinkResolver } from "@/lib/content/wiki-link-resolver";

let entryMap: Map<string, Entry> | null = null;
let cachedResolver: ((title: string) => string) | null = null;
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
  if (!cachedResolver) {
    cachedResolver = createWikiLinkResolver(manifest as Manifest);
  }
  return cachedResolver;
}
