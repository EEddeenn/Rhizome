import contentIndex from "@/generated/content.json";

export function getMdxContent(slug: string): string | undefined {
  return (contentIndex as Record<string, string>)[slug];
}
