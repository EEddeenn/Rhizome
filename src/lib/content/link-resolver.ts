import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import type { WikiLink, Heading } from "./types";

const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g;

export function extractWikiLinks(raw: string): WikiLink[] {
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(WIKI_LINK_REGEX.source, "g");

  while ((match = regex.exec(raw)) !== null) {
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
  const mdLinkRegex = /\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = mdLinkRegex.exec(mdxSource)) !== null) {
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
    const normalized = link.title.toLowerCase().trim();
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
    const normalized = entry.title.toLowerCase().trim();
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

export function extractHeadings(mdxSource: string): Heading[] {
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();

  const tree = unified().use(remarkParse).parse(mdxSource);

  visit(tree, "heading", (node: MdastNode) => {
    const depth = node.depth ?? 1;
    let text = "";
    if (node.children) {
      text = extractTextFromNodes(node.children);
    }
    const id = slugger.slug(text);
    headings.push({ depth, text, id });
  });

  return headings;
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

export function extractPlainText(mdxSource: string): string {
  const texts: string[] = [];
  const tree = unified().use(remarkParse).parse(mdxSource);

  visit(tree, "text", (node: MdastNode) => {
    if (node.value) {
      texts.push(node.value);
    }
  });

  return texts.join(" ").replace(/\s+/g, " ").trim();
}
