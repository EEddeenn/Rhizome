export function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeTags(tags: unknown): string[] {
  if (!tags) return [];
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  if (Array.isArray(tags)) {
    return tags
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

export function deriveTitleFromSlug(slug: string): string {
  const parts = slug.split("/");
  const lastPart = parts[parts.length - 1];
  return lastPart
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
