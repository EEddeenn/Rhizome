import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const CONTENT_DIR = "content";
const GENERATOR_SCRIPT = "scripts/gen-content.ts";
const isWindows = process.platform === "win32";

const withServer = process.argv.includes("--with-server");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isGenerating = false;
let serverProcess: ReturnType<typeof spawn> | null = null;

function runCommand(command: string, args: string[]): ReturnType<typeof spawn> {
  return spawn(command, args, {
    stdio: "inherit",
    shell: isWindows,
  });
}

async function runGenerator(): Promise<void> {
  if (isGenerating) return;
  
  isGenerating = true;
  console.log("\n[watch] Running content generator...");
  
  return new Promise((resolve) => {
    const proc = runCommand("npx", ["tsx", GENERATOR_SCRIPT]);
    
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

function startServer(): void {
  if (serverProcess) return;
  
  console.log("[watch] Starting Next.js dev server...\n");
  serverProcess = runCommand("npx", ["next", "dev"]);
  
  serverProcess.on("close", (code) => {
    serverProcess = null;
    if (code !== null && code !== 0) {
      console.log(`[watch] Server exited with code ${code}`);
    }
  });
}

function cleanup(): void {
  console.log("\n[watch] Stopping...");
  if (serverProcess) {
    serverProcess.kill("SIGTERM");
  }
  process.exit(0);
}

async function watch(): Promise<void> {
  console.log("Rhizome watch mode");
  console.log("===================");
  console.log(`Watching: ${CONTENT_DIR}/`);
  if (withServer) {
    console.log("With Next.js dev server\n");
  } else {
    console.log("Press Ctrl+C to stop\n");
  }

  await runGenerator();

  if (withServer) {
    startServer();
  }

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

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  await new Promise(() => {});
}

watch().catch((err) => {
  console.error("Watch error:", err);
  process.exit(1);
});
