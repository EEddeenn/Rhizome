import fs from "fs/promises";
import path from "path";
import type { Step, StepContext, StepOutput, StepReport, PipelineReport, Manifest, RawEntry } from "./types";
import { createLogger, createStepContext, hashObject } from "./context";
import { PUBLIC_DIR } from "./constants";

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

interface StepLevel {
  level: number;
  steps: Step[];
}

export function groupStepsByLevel(steps: Step[]): StepLevel[] {
  const stepMap = new Map(steps.map(s => [s.id, s]));
  const levels = new Map<string, number>();
  
  function getLevel(stepId: string): number {
    if (levels.has(stepId)) return levels.get(stepId)!;
    
    const step = stepMap.get(stepId);
    if (!step) throw new Error(`Unknown step: ${stepId}`);
    
    if (step.dependsOn.length === 0) {
      levels.set(stepId, 0);
      return 0;
    }
    
    const maxDepLevel = Math.max(...step.dependsOn.map(getLevel));
    const stepLevel = maxDepLevel + 1;
    levels.set(stepId, stepLevel);
    return stepLevel;
  }
  
  for (const step of steps) {
    getLevel(step.id);
  }
  
  const levelGroups = new Map<number, Step[]>();
  for (const step of steps) {
    const level = levels.get(step.id)!;
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(step);
  }
  
  return [...levelGroups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, steps]) => ({ level, steps }));
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

interface StepRunResult {
  step: Step;
  result: { success: boolean; artifacts: import("./types").Artifact[]; error?: string; summary?: Record<string, unknown> };
  cached: boolean;
  duration: number;
}

async function runStep(
  step: Step,
  ctx: StepContext,
  manifest: Manifest[],
  rawEntries: RawEntry[],
  stepOutputs: Map<string, StepOutput>,
  force: boolean
): Promise<StepRunResult> {
  const stepStartTime = Date.now();
  
  if (!force) {
    const inputHash = computeInputHash(step, manifest, rawEntries, stepOutputs);
    const cachedData = await ctx.readCache(step.id);

    if (cachedData && cachedData.inputHash === inputHash) {
      const duration = Date.now() - stepStartTime;
      return {
        step,
        result: {
          success: true,
          artifacts: cachedData.artifacts.map(p => ({
            path: p,
            isPublic: p.startsWith(PUBLIC_DIR),
          })),
        },
        cached: true,
        duration,
      };
    }
  }

  try {
    const result = await step.run(ctx);
    
    if (result.success) {
      const inputHash = computeInputHash(step, manifest, rawEntries, stepOutputs);
      await ctx.writeCache(step.id, {
        inputHash,
        outputHash: hashObject(result.artifacts),
        timestamp: Date.now(),
        artifacts: result.artifacts.map(a => a.path),
      });
    }
    
    const duration = Date.now() - stepStartTime;
    return { step, result, cached: false, duration };
  } catch (error) {
    const duration = Date.now() - stepStartTime;
    return {
      step,
      result: {
        success: false,
        artifacts: [],
        error: error instanceof Error ? error.message : String(error),
      },
      cached: false,
      duration,
    };
  }
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

  const levels = groupStepsByLevel(steps);
  logger.info(`Pipeline levels: ${levels.map(l => `L${l.level}(${l.steps.map(s => s.id).join(",")})`).join(" → ")}`);

  const ctx = createStepContext(manifest, rawEntries, siteUrl, siteTitle, stepOutputs, logger);

  for (const { level, steps: levelSteps } of levels) {
    const levelStartTime = Date.now();
    const stepNames = levelSteps.map(s => s.id).join(", ");
    logger.info(`\n→ Level ${level}: ${stepNames}`);

    const runResults = await Promise.all(
      levelSteps.map(step => runStep(step, ctx, manifest, rawEntries, stepOutputs, force))
    );

    for (const { step, result, cached, duration } of runResults) {
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
        logger.info(`  ✓ ${step.id} (${duration}ms, ${result.artifacts.length} artifacts)${cached ? " [cached]" : ""}`);
      } else {
        logger.error(`  ✗ ${step.id} failed: ${result?.error}`);
      }
    }

    const levelDuration = Date.now() - levelStartTime;
    if (levelSteps.length > 1) {
      logger.info(`  Level ${level} complete: ${levelDuration}ms (parallel)`);
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
