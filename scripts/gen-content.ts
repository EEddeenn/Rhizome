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
  extractHeadings,
  extractPlainText,
} from "../src/lib/content/link-resolver";
import type {
  Entry,
  TagsIndex,
  BacklinksIndex,
  Graph,
  WikiLink,
  SearchDoc,
} from "../src/lib/content/types";

const CONTENT_DIR = "content";
const GENERATED_DIR = "src/generated";
const SITE_URL = process.env.SITE_URL || "https://example.com";
const SITE_TITLE = process.env.SITE_TITLE || "Rhizome";

interface RawEntry {
  slug: string;
  route: string;
  sourcePath: string;
  title: string;
  date?: string;
  updated?: string;
  tags: string[];
  type: Entry["type"];
  summary?: string;
  status?: string;
  private?: boolean;
  headings: { depth: number; text: string; id: string }[];
  wikiLinks: WikiLink[];
  mdRoutes: string[];
  searchText: string;
  wordCount: number;
  readingTimeMin: number;
  rawContent: string;
}

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
  const headings = extractHeadings(content);
  const wikiLinks = extractWikiLinks(src);
  const mdRoutes = extractMarkdownInternalRoutes(src);
  const searchText = extractPlainText(content);
  const { wordCount, minutes } = estimateReadingTime(searchText);

  let rawContent = content;
  rawContent = rawContent.replace(
    /!\[([^\]]*)\]\(\.\.\/assets\/([^)]+)\)/g,
    '![$1](/assets/$2)'
  );
  rawContent = rawContent.replace(
    /!\[([^\]]*)\]\(\.\/assets\/([^)]+)\)/g,
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

function buildBacklinks(entries: Entry[]): BacklinksIndex {
  const backlinks: BacklinksIndex = {};

  for (const entry of entries) {
    backlinks[entry.slug] = [];
  }

  for (const entry of entries) {
    if (entry.outboundLinks) {
      for (const targetSlug of entry.outboundLinks) {
        if (backlinks[targetSlug] && !backlinks[targetSlug].includes(entry.slug)) {
          backlinks[targetSlug].push(entry.slug);
        }
      }
    }
  }

  return backlinks;
}

function buildTagsIndex(entries: Entry[]): TagsIndex {
  const index: TagsIndex = {};

  for (const entry of entries) {
    for (const tag of entry.tags) {
      if (!index[tag]) {
        index[tag] = [];
      }
      if (!index[tag].includes(entry.slug)) {
        index[tag].push(entry.slug);
      }
    }
  }

  return index;
}

function buildGraph(entries: Entry[]): Graph {
  const nodes = entries.map((entry) => ({
    id: entry.slug,
    title: entry.title,
    type: entry.type,
    tags: entry.tags,
  }));

  const edges: Graph["edges"] = [];
  for (const entry of entries) {
    if (entry.outboundLinks) {
      for (const target of entry.outboundLinks) {
        edges.push({ source: entry.slug, target });
      }
    }
  }

  return { nodes, edges };
}

function buildSearchIndex(rawEntries: RawEntry[]): SearchDoc[] {
  return rawEntries.map((entry) => ({
    id: entry.slug,
    title: entry.title,
    route: entry.route,
    type: entry.type,
    tags: entry.tags,
    date: entry.date,
    text: entry.searchText,
  }));
}

function generateSitemap(entries: Entry[], baseUrl: string): string {
  const now = new Date().toISOString().split("T")[0];
  const urls = entries
    .map((entry) => {
      const lastmod = entry.updated || entry.date || now;
      return `  <url>
    <loc>${baseUrl}${entry.route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateRSS(entries: Entry[], baseUrl: string, siteTitle: string): string {
  const now = new Date().toUTCString();
  const items = entries
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 20)
    .map((entry) => {
      const pubDate = entry.date ? new Date(entry.date).toUTCString() : now;
      const description = entry.summary || "";
      return `    <item>
      <title>${escapeXML(entry.title)}</title>
      <link>${baseUrl}${entry.route}</link>
      <guid>${baseUrl}${entry.route}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXML(description)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(siteTitle)}</title>
    <link>${baseUrl}</link>
    <description>Personal knowledge base and articles</description>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function writeJSON(filename: string, data: unknown): Promise<void> {
  const outputPath = path.join(GENERATED_DIR, filename);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));

  const publicFiles = ["search-index.json", "graph.json"];
  if (publicFiles.includes(filename)) {
    const publicPath = path.join("public", "generated", filename);
    await fs.mkdir(path.dirname(publicPath), { recursive: true });
    await fs.writeFile(publicPath, JSON.stringify(data));
  }
}

async function writeContentIndex(rawEntries: RawEntry[]): Promise<void> {
  const contentIndex: Record<string, string> = {};
  for (const entry of rawEntries) {
    contentIndex[entry.slug] = entry.rawContent;
  }
  await writeJSON("content.json", contentIndex);
}

async function main(): Promise<void> {
  console.log("Rhizome content generator");
  console.log("=========================");

  console.log("\n1. Discovering content files...");
  const filePaths = await discoverContentFiles();
  console.log(`   Found ${filePaths.length} MDX files`);

  console.log("\n2. Parsing frontmatter and extracting metadata...");
  const rawEntries: RawEntry[] = [];
  for (const filePath of filePaths) {
    const src = await fs.readFile(filePath, "utf-8");
    const entry = await buildRawEntry(filePath, src);
    if (entry) {
      rawEntries.push(entry);
    }
  }
  console.log(`   Parsed ${rawEntries.length} entries`);

  console.log("\n3. Building title index...");
  const titleIndex = buildTitleIndex(rawEntries);
  console.log(`   Indexed ${titleIndex.size} unique titles`);

  console.log("\n4. Resolving links...");
  const brokenLinks: { slug: string; unresolved: WikiLink[] }[] = [];

  const entries: Entry[] = rawEntries.map((raw) => {
    const { slugs: wikiSlugs, unresolved } = resolveWikiLinksToSlugs(
      raw.wikiLinks,
      titleIndex
    );
    const mdSlugs = resolveRoutesToSlugs(raw.mdRoutes);
    const outboundLinks = [...new Set([...wikiSlugs, ...mdSlugs])];

    if (unresolved.length > 0) {
      brokenLinks.push({ slug: raw.slug, unresolved });
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

  if (brokenLinks.length > 0) {
    console.log(`   Warning: ${brokenLinks.length} entries have broken wiki-links`);
    for (const { slug, unresolved } of brokenLinks) {
      console.log(`     - ${slug}: ${unresolved.map((l) => l.title).join(", ")}`);
    }
  }

  const brokenLinksOutput = brokenLinks.map(({ slug, unresolved }) => ({
    slug,
    unresolved: unresolved.map((l) => l.title),
  }));

  console.log("\n5. Building indices...");
  const backlinks = buildBacklinks(entries);
  const tagsIndex = buildTagsIndex(entries);
  const graph = buildGraph(entries);
  const searchIndex = buildSearchIndex(rawEntries);
  console.log(`   Tags: ${Object.keys(tagsIndex).length}`);
  console.log(`   Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
  console.log(`   Search: ${searchIndex.length} documents`);

  console.log("\n6. Writing generated files...");
  await writeJSON("manifest.json", entries);
  await writeJSON("backlinks.json", backlinks);
  await writeJSON("tags.json", tagsIndex);
  await writeJSON("graph.json", graph);
  await writeJSON("search-index.json", searchIndex);
  await writeJSON("broken-links.json", brokenLinksOutput);
  await writeContentIndex(rawEntries);
  console.log("   JSON files written");

  console.log("\n7. Generating sitemap and RSS...");
  const sitemap = generateSitemap(entries, SITE_URL);
  const rss = generateRSS(entries, SITE_URL, SITE_TITLE);
  await fs.mkdir("public", { recursive: true });
  await fs.writeFile("public/sitemap.xml", sitemap);
  await fs.writeFile("public/rss.xml", rss);
  console.log("   sitemap.xml and rss.xml written");

  console.log("\n✓ Content generation complete!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
