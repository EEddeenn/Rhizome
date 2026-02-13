import type { Step, StepContext, StepResult, Artifact } from "../types";
import fs from "fs/promises";
import path from "path";
import { PUBLIC_DIR } from "../constants";

export const siteConfigStep: Step = {
  id: "site-config",
  name: "Site Config",
  description: "Generates robots.txt and _headers",
  dependsOn: [],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];

    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${ctx.siteUrl}/sitemap.xml
`;

    const robotsPath = await ctx.writeText("site-config", "robots.txt", robotsTxt, true);
    artifacts.push({ path: robotsPath, isPublic: true });

    const robotsRootPath = path.join(PUBLIC_DIR, "robots.txt");
    await fs.writeFile(robotsRootPath, robotsTxt);
    artifacts.push({ path: robotsRootPath, isPublic: true });

    const headers = `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/favicon.ico
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/sitemap.xml
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/rss.xml
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/robots.txt
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/generated/vendor/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/generated/vendor/katex.min.css
  Cache-Control: public, max-age=31536000, immutable

/generated/vendor/pdf.worker.min.js
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/generated/graph/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/generated/search/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/generated/sitemap/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`;

    const headersPath = await ctx.writeText("site-config", "_headers", headers, true);
    artifacts.push({ path: headersPath, isPublic: true });

    const headersRootPath = path.join(PUBLIC_DIR, "_headers");
    await fs.writeFile(headersRootPath, headers);
    artifacts.push({ path: headersRootPath, isPublic: true });

    return {
      success: true,
      artifacts,
      summary: {
        robotsTxt: true,
        headers: true,
      },
    };
  },
};
