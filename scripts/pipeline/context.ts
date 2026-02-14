import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { StepContext, StepCache, StepOutput, Logger, Manifest, RawEntry } from "./types";
import { GENERATED_DIR, PUBLIC_DIR, CACHE_DIR } from "./constants";

export function createLogger(prefix = ""): Logger {
  return {
    info: (msg) => console.log(`${prefix}${msg}`),
    warn: (msg) => console.warn(`${prefix}Warning: ${msg}`),
    error: (msg) => console.error(`${prefix}Error: ${msg}`),
    debug: (msg) => { if (process.env.DEBUG) console.log(`${prefix}[debug] ${msg}`); },
  };
}

export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

const hashCache = new WeakMap<object, string>();

export function hashObject(obj: unknown): string {
  if (typeof obj !== "object" || obj === null) {
    return hashContent(String(obj));
  }
  
  const cached = hashCache.get(obj as object);
  if (cached) return cached;
  
  const hash = hashContent(JSON.stringify(obj, Object.keys(obj as object).sort()));
  hashCache.set(obj as object, hash);
  return hash;
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
    
    writeJson: async (stepId, filename, data, isPublic = false) => {
      const destDir = isPublic 
        ? path.join(PUBLIC_DIR, "generated", stepId)
        : path.join(GENERATED_DIR, stepId);
      const destPath = path.join(destDir, filename);
      await fs.mkdir(destDir, { recursive: true });
      await fs.writeFile(destPath, JSON.stringify(data));
      return destPath;
    },
    
    writeText: async (stepId, filename, content, isPublic = false) => {
      const destDir = isPublic 
        ? path.join(PUBLIC_DIR, "generated", stepId)
        : path.join(GENERATED_DIR, stepId);
      const destPath = path.join(destDir, filename);
      await fs.mkdir(destDir, { recursive: true });
      await fs.writeFile(destPath, content);
      return destPath;
    },
    
    readCache: async (stepId) => {
      try {
        const content = await fs.readFile(path.join(CACHE_DIR, `${stepId}.json`), "utf-8");
        return JSON.parse(content);
      } catch {
        return null;
      }
    },
    
    writeCache: async (stepId, cache) => {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(path.join(CACHE_DIR, `${stepId}.json`), JSON.stringify(cache));
    },
    
    getStepOutput: (stepId) => stepOutputs.get(stepId),
  };
}
