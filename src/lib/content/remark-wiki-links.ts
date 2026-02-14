import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Text, Link, Parent } from "mdast";

interface WikiLinkOptions {
  resolve?: (title: string) => string;
}

export const remarkWikiLinks: Plugin<[WikiLinkOptions?], Root> = (options = {}) => {
  const resolver = options.resolve || ((title: string) => `/notes/${title.toLowerCase().replace(/\s+/g, "-")}`);

  return (tree: Root) => {
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    
    visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
      if (typeof index !== "number" || !parent) return;

      const value = node.value;
      const matches = [...value.matchAll(wikiLinkRegex)];

      if (matches.length === 0) return;

      const newNodes: (Text | Link)[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        const [fullMatch, content] = match;
        const startIndex = match.index!;
        const endIndex = startIndex + fullMatch.length;

        if (startIndex > lastIndex) {
          newNodes.push({
            type: "text",
            value: value.slice(lastIndex, startIndex),
          });
        }

        const pipeIndex = content.indexOf("|");
        const title = pipeIndex !== -1 ? content.slice(0, pipeIndex).trim() : content.trim();
        const alias = pipeIndex !== -1 ? content.slice(pipeIndex + 1).trim() : title;

        const href = resolver(title);

        newNodes.push({
          type: "link",
          url: href,
          children: [{ type: "text", value: alias }],
        });

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
