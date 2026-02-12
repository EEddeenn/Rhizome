# Rhizome

A static personal notes and knowledge management system built with Next.js, MDX, and Tailwind CSS. Deploys to Cloudflare Pages.

## Features

- **MDX Content** - Write notes in MDX with YAML frontmatter
- **Wiki-links** - Link between notes using `[[Note Title]]` syntax
- **Backlinks** - See what other notes link to the current page
- **Tags** - Organize content with tags and browse by tag
- **Static Export** - Fully static site, no server required
- **Cloudflare Pages** - Optimized for deployment on Cloudflare

## Quick Start

```bash
# Install dependencies
npm install

# Run content generator and start dev server
npm run dev

# Build for production
npm run build
```

The static site will be output to the `out/` directory.

## Project Structure

```
├── content/
│   ├── notes/           # Note MDX files
│   ├── articles/        # Article MDX files
│   └── assets/          # Images and attachments
├── src/
│   ├── app/(site)/      # Next.js App Router pages
│   │   ├── notes/       # Notes routes
│   │   ├── articles/    # Articles routes
│   │   └── tags/        # Tag routes
│   ├── components/
│   │   ├── blocks/      # Content blocks (EntryList, BacklinksPanel, etc.)
│   │   ├── layout/      # Layout components (Nav, Footer)
│   │   └── mdx/         # MDX components
│   ├── lib/
│   │   ├── content/     # Content utilities
│   │   ├── generated/   # Loaders for generated data
│   │   └── ui/          # UI utilities
│   └── generated/       # Generated JSON indices
├── scripts/
│   └── gen-content.ts   # Build-time content generator
└── out/                 # Static export output
```

## Content Format

Create MDX files in `content/notes/` or `content/articles/`:

```mdx
---
title: "My Note Title"
date: "2026-02-12"
type: "note"
tags: ["tag1", "tag2"]
summary: "A brief description for list pages."
---

# My Note Title

Content goes here. Use wiki-links to connect to other notes: [[Another Note]].

You can also use aliases: [[Another Note|custom text]].
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes* | Note title (*auto-derived from filename if missing) |
| `date` | No | Publication date (YYYY-MM-DD) |
| `type` | No | Content type: `note`, `article`, `book`, `paper` |
| `tags` | No | Array of tags |
| `summary` | No | Brief description for list pages |
| `status` | No | Reading status: `to-read`, `reading`, `done` |
| `private` | No | Set to `true` to exclude from build |

### Link Syntax

- **Wiki-links**: `[[Note Title]]` or `[[Note Title|Alias]]`
- **Markdown links**: `[text](/notes/slug)`

## Commands

| Command | Description |
|---------|-------------|
| `npm run gen` | Run content generator |
| `npm run dev` | Start development server |
| `npm run build` | Build for production (runs gen + export) |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |

## Deployment

### Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Node version**: 18 or higher

The `next.config.mjs` is pre-configured with `output: "export"` for static generation.

## Architecture

### Build-time Generation

All content is processed at build time:

1. **Scan** - Discover all MDX files in `content/`
2. **Parse** - Extract frontmatter, headings, and links
3. **Resolve** - Convert wiki-links to proper routes
4. **Index** - Build backlinks, tags, and graph data
5. **Emit** - Write JSON files to `src/generated/`

### Static Rendering

- `generateStaticParams()` enumerates all pages at build time
- MDX content is loaded from generated JSON
- Wiki-links are resolved to proper URLs during rendering

## License

MIT
