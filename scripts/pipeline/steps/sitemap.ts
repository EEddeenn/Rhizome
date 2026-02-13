import type { Step, StepContext, StepResult, Artifact } from "../types";
import fs from "fs/promises";
import path from "path";
import { PUBLIC_DIR } from "../constants";

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const sitemapStep: Step = {
  id: "sitemap",
  name: "Sitemap & RSS",
  description: "Generates sitemap.xml and rss.xml",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const now = new Date().toISOString().split("T")[0];
    const urls = ctx.manifest
      .map((entry) => {
        const lastmod = entry.updated || entry.date || now;
        return `  <url>
    <loc>${ctx.siteUrl}${entry.route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`;
      })
      .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    const sitemapPath = await ctx.writeText("sitemap", "sitemap.xml", sitemap, true);
    artifacts.push({ path: sitemapPath, isPublic: true });

    const sitemapRootPath = path.join(PUBLIC_DIR, "sitemap.xml");
    await fs.writeFile(sitemapRootPath, sitemap);
    artifacts.push({ path: sitemapRootPath, isPublic: true });

    const rssNow = new Date().toUTCString();
    const items = [...ctx.manifest]
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 20)
      .map((entry) => {
        const pubDate = entry.date ? new Date(entry.date).toUTCString() : rssNow;
        return `    <item>
      <title>${escapeXML(entry.title)}</title>
      <link>${ctx.siteUrl}${entry.route}</link>
      <guid>${ctx.siteUrl}${entry.route}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXML(entry.summary || "")}</description>
    </item>`;
      })
      .join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(ctx.siteTitle)}</title>
    <link>${ctx.siteUrl}</link>
    <description>Personal knowledge base and articles</description>
    <atom:link href="${ctx.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${rssNow}</lastBuildDate>
${items}
  </channel>
</rss>`;

    const rssPath = await ctx.writeText("sitemap", "rss.xml", rss, true);
    artifacts.push({ path: rssPath, isPublic: true });

    const rssRootPath = path.join(PUBLIC_DIR, "rss.xml");
    await fs.writeFile(rssRootPath, rss);
    artifacts.push({ path: rssRootPath, isPublic: true });

    return {
      success: true,
      artifacts,
      summary: { urls: ctx.manifest.length, rssItems: Math.min(ctx.manifest.length, 20) },
    };
  },
};
