import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root, Code } from "mdast";
import { type MdxJsxFlowElement, createMdxElement } from "./mdx-types";

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
      
      const attrs: Record<string, string | undefined> = {
        code: node.value || "",
      };
      
      if (title) {
        attrs.title = title;
      }
      
      const mermaidNode = createMdxElement("Mermaid", attrs);
      
      parent.children[index] = mermaidNode as unknown as typeof parent.children[0];
    });
  };
};
