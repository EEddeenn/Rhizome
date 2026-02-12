import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const CONTENT_DIR = "content";
const GENERATOR_SCRIPT = "scripts/gen-content.ts";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isGenerating = false;

async function runGenerator(): Promise<void> {
  if (isGenerating) return;
  
  isGenerating = true;
  console.log("\n[watch] Running content generator...");
  
  return new Promise((resolve) => {
    const proc = spawn("npx", ["tsx", GENERATOR_SCRIPT], {
      stdio: "inherit",
      shell: true,
    });
    
    proc.on("close", (code) => {
      isGenerating = false;
      if (code === 0) {
        console.log("[watch] Generation complete\n");
      } else {
        console.log(`[watch] Generation failed with code ${code}\n`);
      }
      resolve();
    });
  });
}

function debounce(fn: () => void, delay: number): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    fn();
  }, delay);
}

async function watch(): Promise<void> {
  console.log("Rhizome watch mode");
  console.log("===================");
  console.log(`Watching: ${CONTENT_DIR}/`);
  console.log("Press Ctrl+C to stop\n");

  await runGenerator();

  const contentPath = path.resolve(CONTENT_DIR);
  const abortController = new AbortController();
  
  const watcher = fs.promises.watch(contentPath, { recursive: true, signal: abortController.signal });
  
  (async () => {
    try {
      for await (const event of watcher) {
        const filename = event.filename;
        if (filename && (filename.endsWith(".mdx") || filename.includes("assets"))) {
          console.log(`[watch] Change detected: ${filename}`);
          debounce(() => runGenerator(), 300);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("[watch] Error:", err);
      }
    }
  })();

  process.on("SIGINT", () => {
    console.log("\n[watch] Stopping...");
    abortController.abort();
    process.exit(0);
  });

  await new Promise(() => {});
}

watch().catch((err) => {
  console.error("Watch error:", err);
  process.exit(1);
});
