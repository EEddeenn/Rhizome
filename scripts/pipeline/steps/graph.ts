import type { Step, StepContext, StepResult, Artifact } from "../types";
import type { Graph } from "../../../src/lib/content/types";

export const graphStep: Step = {
  id: "graph",
  name: "Knowledge Graph",
  description: "Builds graph data for visualization",
  dependsOn: ["manifest"],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];
    
    const nodes = ctx.manifest.map((entry) => ({
      id: entry.slug,
      title: entry.title,
      type: entry.type,
      tags: entry.tags,
    }));

    const edges: Graph["edges"] = [];
    for (const entry of ctx.manifest) {
      if (entry.outboundLinks) {
        for (const target of entry.outboundLinks) {
          edges.push({ source: entry.slug, target });
        }
      }
    }

    const graph: Graph = { nodes, edges };
    
    const outputPath = await ctx.writeJson("graph", "graph.json", graph, true);
    artifacts.push({ path: outputPath, isPublic: true });

    return {
      success: true,
      artifacts,
      summary: { nodes: nodes.length, edges: edges.length },
    };
  },
};
