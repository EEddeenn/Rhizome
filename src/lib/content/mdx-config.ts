import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { remarkWikiLinks } from "./remark-wiki-links";
import { getWikiLinkResolver } from "@/lib/generated/load-manifest";
import type { PluggableList } from "unified";

let cachedPlugins: {
  remarkPlugins: PluggableList;
  rehypePlugins: PluggableList;
} | null = null;

export function getMdxPlugins() {
  if (!cachedPlugins) {
    cachedPlugins = {
      remarkPlugins: [
        remarkGfm,
        remarkMath,
        [remarkWikiLinks, { resolve: getWikiLinkResolver() }],
      ] as PluggableList,
      rehypePlugins: [rehypeSlug, rehypeKatex, rehypeHighlight] as PluggableList,
    };
  }
  return cachedPlugins;
}
