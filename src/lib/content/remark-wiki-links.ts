import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Text, Link, Parent } from "mdast";

const WIKI_LINK_PATTERN = /(!?)\[\[([^\]#|]+)(?:#(\^?[^\]|]+))?(?:\|([^\]]+))?\]\]/g;

interface ResolvedLink {
  route: string;
  anchor?: string;
  exists: boolean;
}

interface ResolvedEmbed {
  type: "note" | "pdf";
  slug?: string;
  path?: string;
  anchor?: string;
  page?: number;
}

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
  return { route, anchor, exists: false };
};

const defaultEmbedResolver = (target: string, anchor?: string): ResolvedEmbed | null => {
  if (isPdfTarget(target)) {
    const { page } = parsePdfAnchor(anchor);
    const pdfPath = target.startsWith("/") ? target : `/assets/pdfs/${target}`;
    return { type: "pdf", path: pdfPath, page };
  }
  
  const slug = `notes/${target.toLowerCase().replace(/\s+/g, "-")}`;
  return { type: "note", slug, anchor };
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
  };
};
