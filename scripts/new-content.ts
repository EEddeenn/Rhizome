import fs from "fs/promises";
import path from "path";
import { slugifyForFile } from "../src/lib/content/slug";

const CONTENT_DIR = "content";
const TEMPLATES_DIR = "templates";

const templates: Record<string, string> = {
  note: "note.mdx",
  article: "article.mdx",
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseArgs(): { type: string; title: string; output?: string } {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: npm run new -- <type> <title> [output-path]");
    console.log("");
    console.log("Types:");
    console.log("  note     Create a new note in content/notes/");
    console.log("  article  Create a new article in content/articles/");
    console.log("");
    console.log("Examples:");
    console.log("  npm run new -- note \"My New Note\"");
    console.log("  npm run new -- article \"Building a Second Brain\"");
    console.log("  npm run new -- note \"Deep Learning\" notes/ml/deep-learning");
    process.exit(1);
  }

  const type = args[0].toLowerCase();
  const title = args[1];
  const output = args[2];

  if (!templates[type]) {
    console.error(`Error: Unknown type "${type}". Valid types: ${Object.keys(templates).join(", ")}`);
    process.exit(1);
  }

  return { type, title, output };
}

async function loadTemplate(type: string): Promise<string> {
  const templatePath = path.join(TEMPLATES_DIR, templates[type]);
  return fs.readFile(templatePath, "utf-8");
}

function processTemplate(template: string, title: string): string {
  return template
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{date\}\}/g, formatDate(new Date()))
    .replace(/\{\{content\}\}/g, "");
}

function resolveOutputPath(type: string, title: string, customPath?: string): string {
  const slug = slugifyForFile(title);
  const subdir = type === "note" ? "notes" : "articles";

  if (customPath) {
    if (customPath.endsWith(".mdx")) {
      return path.join(CONTENT_DIR, subdir, customPath);
    }
    return path.join(CONTENT_DIR, subdir, `${customPath}.mdx`);
  }

  return path.join(CONTENT_DIR, subdir, `${slug}.mdx`);
}

async function main(): Promise<void> {
  const { type, title, output: customPath } = parseArgs();

  const template = await loadTemplate(type);
  const content = processTemplate(template, title);
  const outputPath = resolveOutputPath(type, title, customPath);

  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(outputPath);
    console.error(`Error: File already exists: ${outputPath}`);
    process.exit(1);
  } catch {
    // File doesn't exist, we can create it
  }

  await fs.writeFile(outputPath, content);

  console.log(`Created: ${outputPath}`);
  console.log(`Title: ${title}`);
  console.log(`Type: ${type}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
