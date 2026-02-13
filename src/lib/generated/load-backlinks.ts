import backlinksIndex from "@/generated/backlinks/backlinks.json";
import type { BacklinksIndex } from "@/lib/content/types";

export function getBacklinksIndex(): BacklinksIndex {
  return backlinksIndex as BacklinksIndex;
}

export function getBacklinksForSlug(slug: string): string[] {
  return getBacklinksIndex()[slug] || [];
}
