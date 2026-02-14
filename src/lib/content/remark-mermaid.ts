import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Code } from "mdast";

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

function parseMeta(meta: string | null | undefined): { title?: string } {
  if (!meta) return {};
  
  const titleMatch = meta.match(/title="([^"]*)"/);
  if (titleMatch) {
    return { title: titleMatch[1] };
  }
  
  return {};
}

export const remarkMermaid: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (index === undefined || !parent) return;
      
      if (node.lang !== "mermaid") return;
      
      const { title } = parseMeta(node.meta);
      
      const attributes: MdxJsxAttribute[] = [
        {
          type: "mdxJsxAttribute",
          name: "code",
          value: node.value || "",
        },
      ];
      
      if (title) {
        attributes.push({
          type: "mdxJsxAttribute",
          name: "title",
          value: title,
        });
      }
      
      const mermaidNode: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Mermaid",
        attributes,
        children: [],
      };
      
      parent.children[index] = mermaidNode as unknown as typeof parent.children[0];
    });
  };
};
