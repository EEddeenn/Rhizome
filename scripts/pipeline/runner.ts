import fs from "fs/promises";
import path from "path";
import type { Step, StepContext, StepOutput, StepReport, PipelineReport, Manifest, RawEntry } from "./types";
import { createLogger, createStepContext, hashObject, hashContent } from "./context";

const CACHE_DIR = ".pipeline-cache";
const PUBLIC_DIR = "public";
const GENERATED_DIR = "src/generated";

export function topologicalSort(steps: Step[]): Step[] {
  const sorted: Step[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const stepMap = new Map(steps.map(s => [s.id, s]));

  function visit(step: Step): void {
    if (visited.has(step.id)) return;
    if (visiting.has(step.id)) {
      throw new Error(`Circular dependency detected: ${step.id}`);
    }

    visiting.add(step.id);

    for (const depId of step.dependsOn) {
      const dep = stepMap.get(depId);
      if (!dep) {
        throw new Error(`Unknown dependency: ${depId} (required by ${step.id})`);
      }
      visit(dep);
    }

    visiting.delete(step.id);
    visited.add(step.id);
    sorted.push(step);
  }

  for (const step of steps) {
    visit(step);
  }

  return sorted;
}

function computeInputHash(
  step: Step, 
  manifest: Manifest[], 
  rawEntries: RawEntry[],
  stepOutputs: Map<string, StepOutput>
): string {
  const inputs: unknown[] = [];
  
  for (const depId of step.dependsOn) {
    const output = stepOutputs.get(depId);
    if (output) {
      inputs.push({
        id: depId,
        artifacts: output.artifacts.map(a => ({ path: a.path, hash: a.hash })),
      });
    }
  }
  
  inputs.push({
    manifestHash: hashObject(manifest),
    rawEntriesCount: rawEntries.length,
  });
  
  return hashObject(inputs);
}

export async function runPipeline(
  steps: Step[],
  manifest: Manifest[],
  rawEntries: RawEntry[],
  siteUrl: string,
  siteTitle: string,
  force = false
): Promise<PipelineReport> {
  const logger = createLogger();
  const startTime = Date.now();
  const stepOutputs = new Map<string, StepOutput>();
  const stepReports: StepReport[] = [];

  const sortedSteps = topologicalSort(steps);
  logger.info(`Pipeline order: ${sortedSteps.map(s => s.id).join(" → ")}`);

  const ctx = createStepContext(manifest, rawEntries, siteUrl, siteTitle, stepOutputs, logger);

  for (const step of sortedSteps) {
    const stepStartTime = Date.now();
    logger.info(`\n→ Running step: ${step.id}`);

    let cached = false;
    let result;

    if (!force) {
      const inputHash = computeInputHash(step, manifest, rawEntries, stepOutputs);
      const cachedData = await ctx.readCache(step.id);

      if (cachedData && cachedData.inputHash === inputHash) {
        logger.info(`  Cache hit for ${step.id}`);
        cached = true;
        
        result = {
          success: true,
          artifacts: cachedData.artifacts.map(p => ({
            path: p,
            isPublic: p.startsWith(PUBLIC_DIR),
          })),
        };
      }
    }

    if (!cached) {
      try {
        result = await step.run(ctx);
        
        if (result.success) {
          const inputHash = computeInputHash(step, manifest, rawEntries, stepOutputs);
          await ctx.writeCache(step.id, {
            inputHash,
            outputHash: hashObject(result.artifacts),
            timestamp: Date.now(),
            artifacts: result.artifacts.map(a => a.path),
          });
        }
      } catch (error) {
        result = {
          success: false,
          artifacts: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    const duration = Date.now() - stepStartTime;
    
    const output: StepOutput = {
      id: step.id,
      artifacts: result?.artifacts || [],
      duration,
      cached,
    };
    stepOutputs.set(step.id, output);

    stepReports.push({
      id: step.id,
      name: step.name,
      duration,
      cached,
      success: result?.success ?? false,
      error: result?.error,
      artifacts: result?.artifacts || [],
      summary: result?.summary,
    });

    if (result?.success) {
      logger.info(`  ✓ ${step.id} (${duration}ms, ${result.artifacts.length} artifacts)`);
    } else {
      logger.error(`  ✗ ${step.id} failed: ${result?.error}`);
    }
  }

  const totalDuration = Date.now() - startTime;
  const report: PipelineReport = {
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    siteUrl,
    siteTitle,
    steps: stepReports,
    summary: {
      totalSteps: steps.length,
      cachedSteps: stepReports.filter(r => r.cached).length,
      failedSteps: stepReports.filter(r => !r.success).length,
      totalArtifacts: stepReports.reduce((sum, r) => sum + r.artifacts.length, 0),
    },
  };

  await fs.mkdir(path.join(PUBLIC_DIR, "generated", "debug"), { recursive: true });
  await fs.writeFile(
    path.join(PUBLIC_DIR, "generated", "debug", "pipeline-report.json"),
    JSON.stringify(report, null, 2)
  );

  logger.info(`\n✓ Pipeline complete (${totalDuration}ms)`);
  logger.info(`  Cached: ${report.summary.cachedSteps}/${report.summary.totalSteps}`);
  logger.info(`  Artifacts: ${report.summary.totalArtifacts}`);

  return report;
}

export function defineStep(step: Step): Step {
  return step;
}
