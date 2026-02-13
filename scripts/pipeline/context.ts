import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { 
  StepContext, 
  StepCache, 
  StepOutput, 
  Artifact, 
  Logger,
  Manifest,
  RawEntry 
} from "./types";

const GENERATED_DIR = "src/generated";
const PUBLIC_DIR = "public";
const CACHE_DIR = ".pipeline-cache";

export function createLogger(prefix: string = ""): Logger {
  return {
    info: (msg: string) => console.log(`${prefix}${msg}`),
    warn: (msg: string) => console.warn(`${prefix}Warning: ${msg}`),
    error: (msg: string) => console.error(`${prefix}Error: ${msg}`),
    debug: (msg: string) => {
      if (process.env.DEBUG) console.log(`${prefix}[debug] ${msg}`);
    },
  };
}

export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export function hashObject(obj: unknown): string {
  return hashContent(JSON.stringify(obj, Object.keys(obj as object).sort()));
}

export function createStepContext(
  manifest: Manifest[],
  rawEntries: RawEntry[],
  siteUrl: string,
  siteTitle: string,
  stepOutputs: Map<string, StepOutput>,
  logger: Logger
): StepContext {
  return {
    manifest,
    rawEntries,
    siteUrl,
    siteTitle,
    logger,
    
    hash: hashContent,
    
    writeJson: async (stepId: string, filename: string, data: unknown, isPublic = false): Promise<string> => {
      const content = JSON.stringify(data, null, 2);
      const destDir = isPublic 
        ? path.join(PUBLIC_DIR, "generated", stepId)
        : path.join(GENERATED_DIR, stepId);
      const destPath = path.join(destDir, filename);
      
      await fs.mkdir(destDir, { recursive: true });
      await fs.writeFile(destPath, content);
      
      return destPath;
    },
    
    writeText: async (stepId: string, filename: string, content: string, isPublic = false): Promise<string> => {
      const destDir = isPublic 
        ? path.join(PUBLIC_DIR, "generated", stepId)
        : path.join(GENERATED_DIR, stepId);
      const destPath = path.join(destDir, filename);
      
      await fs.mkdir(destDir, { recursive: true });
      await fs.writeFile(destPath, content);
      
      return destPath;
    },
    
    readCache: async (stepId: string): Promise<StepCache | null> => {
      try {
        const cachePath = path.join(CACHE_DIR, `${stepId}.json`);
        const content = await fs.readFile(cachePath, "utf-8");
        return JSON.parse(content);
      } catch {
        return null;
      }
    },
    
    writeCache: async (stepId: string, cache: StepCache): Promise<void> => {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      const cachePath = path.join(CACHE_DIR, `${stepId}.json`);
      await fs.writeFile(cachePath, JSON.stringify(cache, null, 2));
    },
    
    getStepOutput: (stepId: string): StepOutput | undefined => {
      return stepOutputs.get(stepId);
    },
  };
}

export async function copyLegacyFiles(
  stepId: string,
  filename: string,
  isPublic: boolean
): Promise<void> {
  const srcDir = isPublic 
    ? path.join(PUBLIC_DIR, "generated")
    : GENERATED_DIR;
  const srcPath = path.join(srcDir, filename);
  
  const destDir = isPublic 
    ? path.join(PUBLIC_DIR, "generated", stepId)
    : path.join(GENERATED_DIR, stepId);
  const destPath = path.join(destDir, filename);
  
  try {
    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(srcPath, destPath);
  } catch {
    // Source file doesn't exist, skip
  }
}

export function createArtifact(filePath: string, isPublic: boolean, content?: string): Artifact {
  return {
    path: filePath,
    isPublic,
    hash: content ? hashContent(content) : undefined,
  };
}
