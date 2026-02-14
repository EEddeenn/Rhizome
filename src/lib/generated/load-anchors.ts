import anchorsIndex from "@/generated/anchors/anchors.json";
import type { AnchorsIndex, AnchorsEntry } from "@/lib/content/types";

export function getAnchorsIndex(): AnchorsIndex {
  return anchorsIndex as AnchorsIndex;
}

export function getAnchorsForSlug(slug: string): AnchorsEntry | undefined {
  return (anchorsIndex as AnchorsIndex)[slug];
}

export function resolveBlockIdToHeading(slug: string, blockId: string): string | undefined {
  const entry = (anchorsIndex as AnchorsIndex)[slug];
  if (!entry) return undefined;
  
  const blockInfo = entry.blockIds[blockId];
  return blockInfo?.headingId;
}
