import backlinksIndex from "@/generated/backlinks/backlinks.json";
import type { BacklinksIndex, BacklinkInfo } from "@/lib/content/types";

export function getBacklinksIndex(): BacklinksIndex {
  return backlinksIndex as unknown as BacklinksIndex;
}

export function getBacklinksForSlug(slug: string): BacklinkInfo[] {
  return getBacklinksIndex()[slug] || [];
}
