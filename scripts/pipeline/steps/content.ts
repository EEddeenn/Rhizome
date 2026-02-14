import type { Step, StepContext, StepResult, Artifact } from "../types";

export const contentStep: Step = {
  id: "content",
  name: "Content Index",
  description: "Builds raw content index for MDX rendering",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const contentIndex: Record<string, string> = {};
    for (const entry of ctx.rawEntries) {
      contentIndex[entry.slug] = entry.rawContent;
    }
    
    const outputPath = await ctx.writeJson("content", "content.json", contentIndex, false);
    artifacts.push({ path: outputPath, isPublic: false });

    const publicPath = await ctx.writeJson("content", "content.json", contentIndex, true);
    artifacts.push({ path: publicPath, isPublic: true });

    return {
      success: true,
      artifacts,
      summary: { entries: Object.keys(contentIndex).length },
    };
  },
};
