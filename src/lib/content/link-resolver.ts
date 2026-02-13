import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import type { WikiLink, Heading } from "./types";
import { normalizeTitle } from "./normalize";

const WIKI_LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
const MD_LINK_PATTERN = /\[[^\]]*\]\(([^)]+)\)/g;

const cachedParser = unified().use(remarkParse);

export function extractWikiLinks(raw: string): WikiLink[] {
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;
  WIKI_LINK_PATTERN.lastIndex = 0;

  while ((match = WIKI_LINK_PATTERN.exec(raw)) !== null) {
    const content = match[1];
    const pipeIndex = content.indexOf("|");
    if (pipeIndex !== -1) {
      links.push({
        raw: match[0],
        title: content.slice(0, pipeIndex).trim(),
        alias: content.slice(pipeIndex + 1).trim(),
      });
    } else {
      links.push({
        raw: match[0],
        title: content.trim(),
      });
    }
  }

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
  return route.replace(/^\//, "");
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
): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of entries) {
    const normalized = normalizeTitle(entry.title);
    if (!index.has(normalized)) {
      index.set(normalized, entry.slug);
    }
  }
  return index;
}

type MdastNode = {
  type: string;
  depth?: number;
  children?: MdastNode[];
  value?: string;
  url?: string;
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
  let text = "";
  for (const node of nodes) {
    if (node.type === "text" && node.value) {
      text += node.value;
    } else if (node.children) {
      text += extractTextFromNodes(node.children);
    }
  }
  return text;
}

export function extractHeadings(mdxSource: string): Heading[] {
  return extractContent(mdxSource).headings;
}

export function extractPlainText(mdxSource: string): string {
  return extractContent(mdxSource).plainText;
}
