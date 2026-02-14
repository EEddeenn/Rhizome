import type { Step, StepContext, StepResult, Artifact } from "../types";
import fs from "fs/promises";
import path from "path";
import { PUBLIC_DIR, CONTENT_DIR } from "../constants";

export const vendorStep: Step = {
  id: "vendor",
  name: "Vendor Assets",
  description: "Copies vendor assets from node_modules and content to public",
  dependsOn: [],
  run: async (ctx: StepContext): Promise<StepResult> => {
    const artifacts: Artifact[] = [];

    const vendorDir = path.join(PUBLIC_DIR, "generated", "vendor");
    const fontsDir = path.join(vendorDir, "fonts");
    await fs.mkdir(fontsDir, { recursive: true });

    const katexCssSrc = path.join("node_modules", "katex", "dist", "katex.min.css");
    const katexCssDest = path.join(vendorDir, "katex.min.css");
    await fs.copyFile(katexCssSrc, katexCssDest);
    artifacts.push({ path: katexCssDest, isPublic: true });

    const fontsSrcDir = path.join("node_modules", "katex", "dist", "fonts");
    const fontFiles = await fs.readdir(fontsSrcDir);
    const fontCopyPromises: Promise<void>[] = [];
    
    for (const fontFile of fontFiles) {
      if (fontFile.endsWith(".woff") || fontFile.endsWith(".woff2")) {
        const srcPath = path.join(fontsSrcDir, fontFile);
        const destPath = path.join(fontsDir, fontFile);
        fontCopyPromises.push(fs.copyFile(srcPath, destPath));
        artifacts.push({ path: destPath, isPublic: true });
      }
    }
    
    await Promise.all(fontCopyPromises);
    const fontsCopied = fontCopyPromises.length;

    const pdfWorkerDest = path.join(vendorDir, "pdf.worker.min.js");
    const pdfWorkerSources = [
      path.join("node_modules", "react-pdf", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
      path.join("node_modules", "react-pdf", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.js"),
      path.join("node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
      path.join("node_modules", "pdfjs-dist", "build", "pdf.worker.min.js"),
    ];
    
    let pdfWorkerCopied = false;
    for (const src of pdfWorkerSources) {
      try {
        await fs.copyFile(src, pdfWorkerDest);
        artifacts.push({ path: pdfWorkerDest, isPublic: true });
        pdfWorkerCopied = true;
        break;
      } catch {
        continue;
      }
    }
    
    if (!pdfWorkerCopied) {
      throw new Error("Could not find pdf.worker.min.js or pdf.worker.min.mjs in node_modules");
    }

    const faviconSrc = path.join(CONTENT_DIR, "assets", "favicon.ico");
    const faviconDest = path.join(PUBLIC_DIR, "favicon.ico");
    await fs.copyFile(faviconSrc, faviconDest);
    artifacts.push({ path: faviconDest, isPublic: true });

    return {
      success: true,
      artifacts,
      summary: {
        katexCss: true,
        fonts: fontsCopied,
        pdfWorker: true,
        favicon: true,
      },
    };
  },
};
