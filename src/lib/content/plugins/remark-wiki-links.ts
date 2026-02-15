import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Text, Link, Parent, Paragraph } from "mdast";
import { slugifyAnchor } from "../slug";
import type { ResolvedLink, ResolvedEmbed } from "../types";
import { WIKI_LINK_PATTERN } from "../patterns";

interface WikiLinkOptions {
  resolve?: (title: string, anchor?: string) => ResolvedLink;
  resolveEmbed?: (target: string, anchor?: string) => ResolvedEmbed | null;
}

function isPdfTarget(target: string): boolean {
  return target.toLowerCase().endsWith(".pdf");
}

function parsePdfAnchor(anchor: string | undefined): { page?: number; fragment?: string } {
  if (!anchor) return {};
  
  const pageMatch = anchor.match(/^page=(\d+)$/i);
  if (pageMatch) {
    return { page: parseInt(pageMatch[1], 10) };
  }
  
  return { fragment: anchor };
}

const defaultResolver = (title: string, anchor?: string): ResolvedLink => {
  const route = `/notes/${title.toLowerCase().replace(/\s+/g, "-")}`;
  const processedAnchor = anchor
    ? anchor.startsWith("^")
      ? anchor
      : slugifyAnchor(anchor)
    : undefined;
  return { route, anchor: processedAnchor, exists: false };
};

const defaultEmbedResolver = (target: string, anchor?: string): ResolvedEmbed | null => {
  const processedAnchor = anchor
    ? anchor.startsWith("^")
      ? anchor
      : slugifyAnchor(anchor)
    : undefined;
  
  if (isPdfTarget(target)) {
    const { page } = parsePdfAnchor(anchor);
    const pdfPath = target.startsWith("/") ? target : `/assets/pdfs/${target}`;
    return { type: "pdf", path: pdfPath, page };
  }
  
  const slug = `notes/${target.toLowerCase().replace(/\s+/g, "-")}`;
  return { type: "note", slug, anchor: processedAnchor };
};

interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value: string | null;
}

interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: MdxJsxAttribute[];
  children: [];
}

function createMdxElement(name: string, attrs: Record<string, string | undefined>): MdxJsxFlowElement {
  const attributes: MdxJsxAttribute[] = Object.entries(attrs)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ({
      type: "mdxJsxAttribute" as const,
      name,
      value: value ?? null,
    }));

  return {
    type: "mdxJsxFlowElement",
    name,
    attributes,
    children: [],
  };
}

function isMdxJsxFlowElement(node: unknown): node is MdxJsxFlowElement {
  return typeof node === "object" && node !== null && (node as { type?: string }).type === "mdxJsxFlowElement";
}

export const remarkWikiLinks: Plugin<[WikiLinkOptions?], Root> = (options = {}) => {
  const resolver = options.resolve || defaultResolver;
  const embedResolver = options.resolveEmbed || defaultEmbedResolver;

  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
      if (typeof index !== "number" || !parent) return;

      const value = node.value;
      WIKI_LINK_PATTERN.lastIndex = 0;
      const matches = [...value.matchAll(WIKI_LINK_PATTERN)];

      if (matches.length === 0) return;

      const newNodes: (Text | Link | MdxJsxFlowElement)[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        const [fullMatch, embedMarker, target, anchor, alias] = match;
        const isEmbed = embedMarker === "!";
        const startIndex = match.index!;
        const endIndex = startIndex + fullMatch.length;

        if (startIndex > lastIndex) {
          newNodes.push({
            type: "text",
            value: value.slice(lastIndex, startIndex),
          });
        }

        if (isEmbed) {
          const resolved = embedResolver(target.trim(), anchor?.trim());
          
          if (resolved?.type === "pdf") {
            const attrs: Record<string, string | undefined> = {
              src: resolved.path,
            };
            if (resolved.page) {
              attrs.initialPage = String(resolved.page);
            }
            newNodes.push(createMdxElement("PDFViewer", attrs));
          } else if (resolved?.type === "note") {
            const attrs: Record<string, string | undefined> = {
              slug: resolved.slug,
            };
            if (resolved.anchor) {
              if (resolved.anchor.startsWith("^")) {
                attrs.blockId = resolved.anchor.slice(1);
              } else {
                attrs.anchor = resolved.anchor;
              }
            }
            newNodes.push(createMdxElement("NoteEmbed", attrs));
          } else {
            newNodes.push(createMdxElement("EmbedError", {
              target: target.trim(),
              reason: "not_found",
            }));
          }
        } else {
          const resolved = resolver(target.trim(), anchor?.trim());
          const displayText = alias?.trim() || target.trim();
          
          let url = resolved.route;
          if (resolved.anchor) {
            url += `#${resolved.anchor}`;
          }

          newNodes.push({
            type: "link",
            url,
            children: [{ type: "text", value: displayText }],
          });
        }

        lastIndex = endIndex;
      }

      if (lastIndex < value.length) {
        newNodes.push({
          type: "text",
          value: value.slice(lastIndex),
        });
      }

      parent.children.splice(index, 1, ...newNodes);
    });

    visit(tree, "paragraph", (node: Paragraph, index, parent: Parent | undefined) => {
      if (typeof index !== "number" || !parent) return;

      const hasEmbed = node.children.some(isMdxJsxFlowElement);
      if (!hasEmbed) return;

      const newNodes: (Paragraph | MdxJsxFlowElement)[] = [];
      let currentParagraph: Paragraph = { type: "paragraph", children: [] };

      for (const child of node.children) {
        if (isMdxJsxFlowElement(child)) {
          if (currentParagraph.children.length > 0) {
            newNodes.push(currentParagraph);
            currentParagraph = { type: "paragraph", children: [] };
          }
          newNodes.push(child);
        } else {
          currentParagraph.children.push(child);
        }
      }

      if (currentParagraph.children.length > 0) {
        newNodes.push(currentParagraph);
      }

      parent.children.splice(index, 1, ...newNodes);
    });
  };
};
