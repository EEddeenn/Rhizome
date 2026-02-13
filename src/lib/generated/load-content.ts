import contentIndex from "@/generated/content/content.json";

export function getMdxContent(slug: string): string | undefined {
  return (contentIndex as Record<string, string>)[slug];
}
