import { sharedRemarkPlugins, sharedRehypePlugins, rehypeSlug } from "@/lib/mdx/plugins";
import { remarkMermaid, remarkWikiLinks, remarkObsidianCallouts, rehypeBlockIds } from "./plugins";
import { getWikiLinkResolver, getEmbedResolver } from "@/lib/generated/load-manifest";
import { NoteEmbed } from "@/components/mdx/NoteEmbed";
import { EmbedError } from "@/components/mdx/EmbedError";
import type { PluggableList } from "unified";

export function getMdxPlugins() {
  return {
    remarkPlugins: [
      ...sharedRemarkPlugins,
      remarkMermaid,
      remarkObsidianCallouts,
      [remarkWikiLinks, { 
        resolve: getWikiLinkResolver(),
        resolveEmbed: getEmbedResolver(),
      }],
    ] as PluggableList,
    rehypePlugins: [rehypeSlug, rehypeBlockIds, ...sharedRehypePlugins] as PluggableList,
  };
}

export function getMdxComponents() {
  return {
    NoteEmbed,
    EmbedError,
  };
}
