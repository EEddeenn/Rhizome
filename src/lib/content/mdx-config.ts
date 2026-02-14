import { sharedRemarkPlugins, sharedRehypePlugins, rehypeSlug } from "@/lib/mdx/plugins";
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
      ...sharedRemarkPlugins,
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
