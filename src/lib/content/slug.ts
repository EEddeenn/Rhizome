const CONTENT_DIR = "content";

export function slugifyAnchor(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "");
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

export function slugifyForFile(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugFromPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const contentIndex = normalized.indexOf(`${CONTENT_DIR}/`);
  if (contentIndex === -1) {
    throw new Error(`Path does not contain content/: ${filePath}`);
  }
  const relativePath = normalized.slice(contentIndex + CONTENT_DIR.length + 1);
  const withoutExt = relativePath.replace(/\.mdx?$/, "");
  return withoutExt;
}

export function deriveSlugFromPath(path: string): string {
  return path
    .replace(/^content\//, "")
    .replace(/\.(md|mdx)$/, "");
}

export function deriveTitleFromPath(path: string): string {
  const filename = path.split("/").pop() || path;
  const nameWithoutExt = filename.replace(/\.(md|mdx)$/, "");
  
  return nameWithoutExt
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function routeFromSlug(slug: string): string {
  return `/${slug}`;
}

export function getEntryTypeFromSlug(slug: string): "note" | "article" {
  if (slug.startsWith("notes/")) return "note";
  if (slug.startsWith("articles/")) return "article";
  return "note";
}
