import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import type { WikiLink } from "./types";
import { normalizeTitle } from "./normalize";
import { WIKI_LINK_PATTERN, MD_LINK_PATTERN } from "./patterns";

type MdastNode = {
  type: string;
  children?: MdastNode[];
  value?: string;
};

const cachedParser = unified().use(remarkParse);

export function extractWikiLinks(raw: string): WikiLink[] {
  const links: WikiLink[] = [];
  const tree = cachedParser.parse(raw);
  
  visit(tree, "text", (node: MdastNode, _, parent: MdastNode | undefined) => {
    if (!node.value || !parent) return;
    
    const parentType = parent.type;
    if (parentType === "inlineCode" || parentType === "code") return;
    
    const text = node.value;
    let match: RegExpExecArray | null;
    WIKI_LINK_PATTERN.lastIndex = 0;
    
    while ((match = WIKI_LINK_PATTERN.exec(text)) !== null) {
      const isEmbed = match[1] === "!";
      const title = match[2].trim();
      const anchor = match[3]?.trim();
      const alias = match[4]?.trim();
      const isBlockId = anchor?.startsWith("^") ?? false;

      links.push({
        raw: match[0],
        title,
        alias,
        anchor,
        isBlockId,
        isEmbed,
      });
    }
  });

  return links;
}

export function extractMarkdownInternalRoutes(mdxSource: string): string[] {
  const routes: string[] = [];
  let match: RegExpExecArray | null;
  MD_LINK_PATTERN.lastIndex = 0;

  while ((match = MD_LINK_PATTERN.exec(mdxSource)) !== null) {
    const href = match[1];
    if (href.startsWith("/notes/") || href.startsWith("/articles/")) {
      routes.push(href);
    }
  }

  return routes;
}

export function routeToSlug(route: string): string {
  const pathWithoutQuery = route.split("?")[0];
  return pathWithoutQuery.replace(/^\//, "");
}

export function resolveRoutesToSlugs(routes: string[]): string[] {
  return routes.map(routeToSlug);
}

export function resolveWikiLinksToSlugs(
  wikiLinks: WikiLink[],
  titleIndex: Map<string, string>
): { slugs: string[]; unresolved: WikiLink[] } {
  const slugs: string[] = [];
  const unresolved: WikiLink[] = [];

  for (const link of wikiLinks) {
    const normalized = normalizeTitle(link.title);
    const slug = titleIndex.get(normalized);
    if (slug) {
      slugs.push(slug);
    } else {
      unresolved.push(link);
    }
  }

  return { slugs, unresolved };
}

export function buildTitleIndex(
  entries: Array<{ title: string; slug: string }>
): { index: Map<string, string>; duplicates: Array<{ title: string; slugs: string[] }> } {
  const index = new Map<string, string>();
  const duplicateMap = new Map<string, string[]>();
  
  for (const entry of entries) {
    const normalized = normalizeTitle(entry.title);
    if (!index.has(normalized)) {
      index.set(normalized, entry.slug);
    } else {
      if (!duplicateMap.has(normalized)) {
        duplicateMap.set(normalized, [index.get(normalized)!]);
      }
      duplicateMap.get(normalized)!.push(entry.slug);
    }
  }
  
  const duplicates = Array.from(duplicateMap.entries()).map(([title, slugs]) => ({
    title,
    slugs,
  }));
  
  return { index, duplicates };
}
