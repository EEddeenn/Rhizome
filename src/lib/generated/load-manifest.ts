import manifest from "@/generated/manifest.json";
import type { Entry, Manifest } from "@/lib/content/types";

export function getManifest(): Manifest {
  return manifest as Manifest;
}

export function getAllEntries(): Entry[] {
  return getManifest();
}

export function getEntryBySlug(slug: string): Entry | undefined {
  return getAllEntries().find((entry) => entry.slug === slug);
}

export function getNotes(): Entry[] {
  return getAllEntries().filter((entry) => entry.slug.startsWith("notes/"));
}

export function getArticles(): Entry[] {
  return getAllEntries().filter((entry) => entry.slug.startsWith("articles/"));
}
