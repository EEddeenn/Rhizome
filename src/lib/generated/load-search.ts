import searchIndex from "@/generated/search-index.json";
import type { SearchDoc } from "@/lib/content/types";

export function getSearchIndex(): SearchDoc[] {
  return searchIndex as SearchDoc[];
}
