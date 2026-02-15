import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import type { HeadingWithPosition, LinkWithContext } from "./types";
import { WIKI_LINK_PATTERN, HEADING_PATTERN } from "./patterns";

type MdastNode = {
  type: string;
  value?: string;
  position?: {
    start?: { offset?: number };
  };
};

const cachedParser = unified().use(remarkParse);
const SNIPPET_LENGTH = parseInt(process.env.BACKLINK_SNIPPET_LENGTH || "100", 10);

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
