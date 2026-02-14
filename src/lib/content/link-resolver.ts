import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import type { WikiLink, Heading } from "./types";
import { normalizeTitle } from "./normalize";

const WIKI_LINK_PATTERN = /(!?)\[\[([^\]#|]+)(?:#(\^?[^\]|]+))?(?:\|([^\]]+))?\]\]/g;
const MD_LINK_PATTERN = /\[[^\]]*\]\(([^)]+)\)/g;

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

type MdastNode = {
  type: string;
  depth?: number;
  children?: MdastNode[];
  value?: string;
  url?: string;
  position?: {
    start?: { offset?: number };
    end?: { offset?: number };
  };
};

export interface ExtractedContent {
  headings: Heading[];
  plainText: string;
}

export function extractContent(mdxSource: string): ExtractedContent {
  const headings: Heading[] = [];
  const textParts: string[] = [];
  const slugger = new GithubSlugger();
  const tree = cachedParser.parse(mdxSource);

  visit(tree, (node: MdastNode) => {
    if (node.type === "heading") {
      const depth = node.depth ?? 1;
      const text = node.children ? extractTextFromNodes(node.children) : "";
      const id = slugger.slug(text);
      headings.push({ depth, text, id });
    } else if (node.type === "text" && node.value) {
      textParts.push(node.value);
    }
  });

  const plainText = textParts.join(" ").replace(/\s+/g, " ").trim();
  return { headings, plainText };
}

function extractTextFromNodes(nodes: MdastNode[]): string {
  const stack: MdastNode[] = [...nodes].reverse();
  const textParts: string[] = [];
  
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.type === "text" && node.value) {
      textParts.push(node.value);
    } else if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
  }
  
  return textParts.join("");
}

export function extractHeadings(mdxSource: string): Heading[] {
  return extractContent(mdxSource).headings;
}

export function extractPlainText(mdxSource: string): string {
  return extractContent(mdxSource).plainText;
}

export interface HeadingWithPosition extends Heading {
  position: number;
}

export interface LinkWithContext {
  raw: string;
  title: string;
  alias?: string;
  position: number;
  snippet: string;
  heading?: string;
}

const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/gm;

export function extractHeadingPositions(content: string): HeadingWithPosition[] {
  const headings: HeadingWithPosition[] = [];
  let match: RegExpExecArray | null;
  
  HEADING_PATTERN.lastIndex = 0;
  while ((match = HEADING_PATTERN.exec(content)) !== null) {
    const depth = match[1].length;
    const text = match[2].trim();
    headings.push({
      depth,
      text,
      id: "",
      position: match.index,
    });
  }
  
  return headings;
}

export function findNearestHeading(
  linkPosition: number,
  headings: HeadingWithPosition[]
): string | undefined {
  let nearest: HeadingWithPosition | undefined;
  
  for (const heading of headings) {
    if (heading.position < linkPosition) {
      nearest = heading;
    } else {
      break;
    }
  }
  
  return nearest?.text;
}

const SNIPPET_LENGTH = parseInt(process.env.BACKLINK_SNIPPET_LENGTH || "100", 10);

export function extractSnippet(content: string, position: number, linkLength: number): string {
  const halfLength = Math.floor(SNIPPET_LENGTH / 2);
  const start = Math.max(0, position - halfLength);
  const end = Math.min(content.length, position + linkLength + halfLength);
  
  let snippet = content.slice(start, end);
  
  if (start > 0) {
    snippet = "..." + snippet;
  }
  if (end < content.length) {
    snippet = snippet + "...";
  }
  
  snippet = snippet
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/[#*`_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  return snippet;
}

export function extractLinksWithContext(content: string): LinkWithContext[] {
  const links: LinkWithContext[] = [];
  const headings = extractHeadingPositions(content);
  
  const tree = cachedParser.parse(content);
  
  visit(tree, "text", (node: MdastNode, _, parent: MdastNode | undefined) => {
    if (!node.value || !parent) return;
    
    const parentType = parent.type;
    if (parentType === "inlineCode" || parentType === "code") return;
    
    if (!node.position || !node.position.start) return;
    const nodeStartOffset = node.position.start.offset ?? 0;
    
    const text = node.value;
    let match: RegExpExecArray | null;
    WIKI_LINK_PATTERN.lastIndex = 0;
    
    while ((match = WIKI_LINK_PATTERN.exec(text)) !== null) {
      const fullMatch = match[0];
      const title = match[2].trim();
      const alias = match[4]?.trim();
      
      const globalPosition = nodeStartOffset + match.index;
      
      const heading = findNearestHeading(globalPosition, headings);
      const snippet = extractSnippet(content, globalPosition, fullMatch.length);
      
      links.push({
        raw: fullMatch,
        title,
        alias,
        position: globalPosition,
        snippet,
        heading,
      });
    }
  });
  
  return links;
}
