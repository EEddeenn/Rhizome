import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";
import matter from "gray-matter";
import {
  slugFromPath,
  routeFromSlug,
  getEntryTypeFromSlug,
} from "../src/lib/content/slug";
import { normalizeTags, deriveTitleFromSlug } from "../src/lib/content/normalize";
import { estimateReadingTime } from "../src/lib/content/reading-time";
import {
  extractWikiLinks,
  extractMarkdownInternalRoutes,
  resolveRoutesToSlugs,
  resolveWikiLinksToSlugs,
  buildTitleIndex,
  extractContent,
} from "../src/lib/content/link-resolver";
import type { Entry, WikiLink } from "../src/lib/content/types";
import { runPipeline } from "./pipeline/runner";
import type { RawEntry } from "./pipeline/types";
import { CONTENT_DIR, PUBLIC_DIR } from "./pipeline/constants";
import {
  vendorStep,
  siteConfigStep,
  manifestStep,
  backlinksStep,
  tagsStep,
  graphStep,
  searchStep,
  contentStep,
  sitemapStep,
} from "./pipeline/steps";

const SITE_URL = process.env.SITE_URL || "https://example.com";
const SITE_TITLE = process.env.SITE_TITLE || "Rhizome";

async function discoverContentFiles(): Promise<string[]> {
  return fg.glob(`${CONTENT_DIR}/**/*.mdx`);
}

function parseFrontmatter(src: string): { data: Record<string, unknown>; content: string } {
  const { data, content } = matter(src);
  return { data, content };
}

async function buildRawEntry(filePath: string, src: string): Promise<RawEntry | null> {
  const { data, content } = parseFrontmatter(src);

  if (data.private === true) {
    return null;
  }

  const slug = slugFromPath(filePath);
  const route = routeFromSlug(slug);
  const type = (data.type as Entry["type"]) || getEntryTypeFromSlug(slug);
  const title = (data.title as string) || deriveTitleFromSlug(slug);
  const tags = normalizeTags(data.tags);
  const { headings, plainText: searchText } = extractContent(content);
  const wikiLinks = extractWikiLinks(src);
  const mdRoutes = extractMarkdownInternalRoutes(src);
  const { wordCount, minutes } = estimateReadingTime(searchText);

  let rawContent = content;
  rawContent = rawContent.replace(
    /!\[([^\]]*)\]\(\.\.?\/assets\/([^)]+)\)/g,
    '![$1](/assets/$2)'
  );

  return {
    slug,
    route,
    sourcePath: filePath,
    title,
    date: data.date as string | undefined,
    updated: data.updated as string | undefined,
    tags,
    type,
    summary: data.summary as string | undefined,
    status: data.status as string | undefined,
    private: data.private as boolean | undefined,
    headings,
    wikiLinks,
    mdRoutes,
    searchText,
    wordCount,
    readingTimeMin: minutes,
    rawContent,
  };
}

function resolveLinks(rawEntries: RawEntry[], titleIndex: Map<string, string>): Entry[] {
  return rawEntries.map((raw) => {
    const { slugs: wikiSlugs, unresolved } = resolveWikiLinksToSlugs(
      raw.wikiLinks,
      titleIndex
    );
    const mdSlugs = resolveRoutesToSlugs(raw.mdRoutes);
    const outboundLinks = [...new Set([...wikiSlugs, ...mdSlugs])];

    if (unresolved.length > 0) {
      console.log(`    Warning: ${raw.slug} has broken links: ${unresolved.map(l => l.title).join(", ")}`);
    }

    return {
      slug: raw.slug,
      route: raw.route,
      sourcePath: raw.sourcePath,
      title: raw.title,
      date: raw.date,
      updated: raw.updated,
      tags: raw.tags,
      type: raw.type,
      summary: raw.summary,
      status: raw.status,
      private: raw.private,
      wordCount: raw.wordCount,
      readingTimeMin: raw.readingTimeMin,
      headings: raw.headings,
      outboundLinks,
    };
  });
}

async function copyAssets(): Promise<number> {
  const assetFiles = await fg.glob(`${CONTENT_DIR}/assets/**/*`);
  const copyPromises: Promise<void>[] = [];

  for (const assetFile of assetFiles) {
    const relativePath = assetFile.replace(`${CONTENT_DIR}/assets/`, "");
    if (relativePath === "favicon.ico") continue;
    const destPath = path.join(PUBLIC_DIR, "assets", relativePath);

    copyPromises.push(
      fs.mkdir(path.dirname(destPath), { recursive: true }).then(() =>
        fs.copyFile(assetFile, destPath)
      )
    );
  }

  await Promise.all(copyPromises);
  return copyPromises.length;
}

async function main(): Promise<void> {
  console.log("Rhizome content generator");
  console.log("=========================");

  console.log("\n1. Discovering content files...");
  const filePaths = await discoverContentFiles();
  console.log(`   Found ${filePaths.length} MDX files`);

  console.log("\n2. Parsing frontmatter and extracting metadata...");
  const entryPromises = filePaths.map(async (filePath) => {
    try {
      const src = await fs.readFile(filePath, "utf-8");
      return await buildRawEntry(filePath, src);
    } catch (error) {
      console.error(`   Error processing ${filePath}: ${error}`);
      return null;
    }
  });
  const rawEntries = (await Promise.all(entryPromises)).filter((e): e is RawEntry => e !== null);
  console.log(`   Parsed ${rawEntries.length} entries`);

  console.log("\n3. Building title index...");
  const titleIndex = buildTitleIndex(rawEntries);
  console.log(`   Indexed ${titleIndex.size} unique titles`);

  console.log("\n4. Resolving links...");
  const manifest = resolveLinks(rawEntries, titleIndex);

  console.log("\n5. Running build pipeline...");
  const steps = [
    vendorStep,
    siteConfigStep,
    manifestStep,
    backlinksStep,
    tagsStep,
    graphStep,
    searchStep,
    contentStep,
    sitemapStep,
  ];

  await runPipeline(steps, manifest, rawEntries, SITE_URL, SITE_TITLE);

  console.log("\n6. Copying assets...");
  const copiedCount = await copyAssets();
  console.log(`   Copied ${copiedCount} asset files`);

  console.log("\n✓ Content generation complete!");
  console.log("  Pipeline report: public/generated/debug/pipeline-report.json");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
