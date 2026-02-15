import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import type { Heading } from "./types";

type MdastNode = {
  type: string;
  depth?: number;
  children?: MdastNode[];
  value?: string;
};

const cachedParser = unified().use(remarkParse);

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
