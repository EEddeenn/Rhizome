import { normalizeTitle } from "./normalize";
import { slugifyAnchor } from "./slug";
import type { Manifest, ResolvedLink, ResolvedEmbed } from "./types";

export type { ResolvedLink, ResolvedEmbed };

export function createWikiLinkResolver(manifest: Manifest): (title: string, anchor?: string) => ResolvedLink {
  const titleToRoute = new Map<string, string>();

  for (const entry of manifest) {
    titleToRoute.set(normalizeTitle(entry.title), entry.route);
  }

  return (title: string, anchor?: string): ResolvedLink => {
    const route = titleToRoute.get(normalizeTitle(title));
    const processedAnchor = anchor
      ? anchor.startsWith("^")
        ? anchor
        : slugifyAnchor(anchor)
      : undefined;
    if (route) {
      return { route, anchor: processedAnchor, exists: true };
    }
    return {
      route: `/notes/${title.toLowerCase().replace(/\s+/g, "-")}`,
      anchor: processedAnchor,
      exists: false,
    };
  };
}

export function createEmbedResolver(manifest: Manifest): (target: string, anchor?: string) => ResolvedEmbed | null {
  const titleToSlug = new Map<string, string>();

  for (const entry of manifest) {
    titleToSlug.set(normalizeTitle(entry.title), entry.slug);
  }

  return (target: string, anchor?: string): ResolvedEmbed | null => {
    const lowerTarget = target.toLowerCase();
    const processedAnchor = anchor
      ? anchor.startsWith("^")
        ? anchor
        : slugifyAnchor(anchor)
      : undefined;
    
    if (lowerTarget.endsWith(".pdf")) {
      const pdfPath = target.startsWith("/") ? target : `/assets/pdfs/${target}`;
      let page: number | undefined;
      
      if (anchor) {
        const pageMatch = anchor.match(/^page=(\d+)$/i);
        if (pageMatch) {
          page = parseInt(pageMatch[1], 10);
        }
      }
      
      return { type: "pdf", path: pdfPath, page };
    }
    
    const slug = titleToSlug.get(normalizeTitle(target));
    if (slug) {
      return { type: "note", slug, anchor: processedAnchor };
    }
    
    const fallbackSlug = `notes/${target.toLowerCase().replace(/\s+/g, "-")}`;
    return { type: "note", slug: fallbackSlug, anchor: processedAnchor };
  };
}
