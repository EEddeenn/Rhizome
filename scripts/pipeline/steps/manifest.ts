import type { Step, StepContext, StepResult, Artifact } from "../types";

export const manifestStep: Step = {
  id: "manifest",
  name: "Manifest",
  description: "Writes the content manifest with all entry metadata",
  dependsOn: [],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const outputPath = await ctx.writeJson("manifest", "manifest.json", ctx.manifest, false);
    artifacts.push({ path: outputPath, isPublic: false });
    
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
