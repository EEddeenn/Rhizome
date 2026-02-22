import matter from "gray-matter";

export function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, "");
}

export function parseFrontmatter(content: string): Record<string, unknown> | null {
  try {
    const { data } = matter(content);
    return Object.keys(data).length > 0 ? data : null;
  } catch {
    return null;
  }
}
