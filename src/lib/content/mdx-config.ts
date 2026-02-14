import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { remarkWikiLinks } from "./remark-wiki-links";
import { remarkObsidianCallouts } from "./remark-obsidian-callouts";
import { rehypeBlockIds } from "./rehype-block-ids";
import { getWikiLinkResolver, getEmbedResolver } from "@/lib/generated/load-manifest";
import { NoteEmbed } from "@/components/mdx/NoteEmbed";
import { EmbedError } from "@/components/mdx/EmbedError";
import type { PluggableList } from "unified";

export function getMdxPlugins() {
  return {
    remarkPlugins: [
      remarkGfm,
      remarkMath,
      remarkObsidianCallouts,
      [remarkWikiLinks, { 
        resolve: getWikiLinkResolver(),
        resolveEmbed: getEmbedResolver(),
      }],
    ] as PluggableList,
    rehypePlugins: [rehypeSlug, rehypeBlockIds, rehypeKatex, rehypeHighlight] as PluggableList,
  };
}

export function getMdxComponents() {
  return {
    NoteEmbed,
    EmbedError,
  };
}
