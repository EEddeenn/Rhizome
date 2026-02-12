import tagsIndex from "@/generated/tags.json";
import type { TagsIndex } from "@/lib/content/types";

export function getTagsIndex(): TagsIndex {
  return tagsIndex as TagsIndex;
}

export function getAllTags(): string[] {
  return Object.keys(getTagsIndex()).sort();
}

export function getSlugsForTag(tag: string): string[] {
  return getTagsIndex()[tag] || [];
}
