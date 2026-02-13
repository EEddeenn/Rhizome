import type { Step, StepContext, StepResult, Artifact } from "../types";
import path from "path";
import fs from "fs/promises";

const GENERATED_DIR = "src/generated";

export const manifestStep: Step = {
  id: "manifest",
  name: "Manifest",
  description: "Writes the content manifest with all entry metadata",
  dependsOn: [],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const outputPath = await ctx.writeJson("manifest", "manifest.json", ctx.manifest, false);
    artifacts.push({ path: outputPath, isPublic: false });
    
    await fs.mkdir(GENERATED_DIR, { recursive: true });
    await fs.writeFile(path.join(GENERATED_DIR, "manifest.json"), JSON.stringify(ctx.manifest, null, 2));
    artifacts.push({ path: path.join(GENERATED_DIR, "manifest.json"), isPublic: false });
    
    return {
      success: true,
      artifacts,
      summary: {
        entries: ctx.manifest.length,
        notes: ctx.manifest.filter(e => e.slug.startsWith("notes/")).length,
        articles: ctx.manifest.filter(e => e.slug.startsWith("articles/")).length,
      },
    };
  },
};
