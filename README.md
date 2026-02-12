# Rhizome

A static personal notes and knowledge management system built with Next.js, MDX, and Tailwind CSS. Deploys to Cloudflare Pages.

## Features

### Content
- **MDX Support** - Write notes in MDX with YAML frontmatter
- **Wiki-links** - Link between notes using `[[Note Title]]` syntax
- **Backlinks** - See what notes link to the current page
- **Tags** - Organize content with tags and browse by tag
- **Status Tracking** - Mark items as to-read, reading, or done

### Rich Content
- **Callouts** - Note, tip, warning, danger, and info blocks
- **Code Highlighting** - Syntax highlighting for 50+ languages
- **Math** - KaTeX for LaTeX equations (inline and block)
- **Diagrams** - Mermaid flowcharts, sequence diagrams, class diagrams, and more

### Navigation
- **Table of Contents** - Auto-generated from headings
- **Breadcrumbs** - Navigate note hierarchy
- **Full-text Search** - MiniSearch with fuzzy matching
- **Graph View** - Visualize knowledge connections

### Technical
- **Dark Mode** - System-aware with manual toggle
- **Responsive** - Mobile-first design
- **Static Export** - No server required
- **SEO Ready** - Sitemap, RSS, Open Graph, Twitter cards
- **Self-Hosted Assets** - No external CDN dependencies (fonts, KaTeX)

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
│   │   ├── tags/        # Tag routes
│   │   ├── search/      # Search page
│   │   └── graph/       # Graph visualization
│   ├── components/
│   │   ├── blocks/      # Content blocks (EntryList, BacklinksPanel, TOC, etc.)
│   │   ├── layout/      # Layout components (Nav, Footer, Breadcrumbs)
│   │   └── mdx/         # MDX components (Mermaid, Callout)
│   ├── lib/
│   │   ├── content/     # Content utilities
│   │   ├── generated/   # Loaders for generated data
│   │   └── ui/          # UI utilities
│   └── generated/       # Generated JSON indices
├── public/
│   ├── fonts/            # KaTeX fonts for math rendering
│   ├── generated/        # Client-accessible JSON (search, graph)
│   ├── katex.min.css     # KaTeX styles
│   ├── sitemap.xml       # SEO sitemap
│   ├── rss.xml           # RSS feed
│   └── robots.txt        # Search engine directives
├── tests/               # Unit tests
├── scripts/
│   ├── gen-content.ts   # Build-time content generator
│   └── watch.ts         # Development watcher
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

Content goes here. Use wiki-links to connect: [[Another Note]].
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

### Wiki-links

```mdx
Link to another note: [[Note Title]]

With custom text: [[Note Title|display text]]
```

### Callouts

```mdx
<Callout type="note">
General information.
</Callout>

<Callout type="tip" title="Pro Tip">
Helpful suggestion.
</Callout>

<Callout type="warning">
Important caveat.
</Callout>

<Callout type="danger" title="Warning">
Critical warning.
</Callout>

<Callout type="info">
Background information.
</Callout>
```

### Code Blocks

````mdx
```javascript
function hello(name) {
  console.log(`Hello, ${name}!`);
}
```
````

Supported: `javascript`, `typescript`, `python`, `rust`, `go`, `bash`, `sql`, `json`, `yaml`, `css`, `html`, and many more.

### Math

```mdx
Inline math: $E = mc^2$

Block math:
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

### Diagrams

```mdx
<Mermaid code={`
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
`} />
```

Supported: flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, pie charts.

## Commands

| Command | Description |
|---------|-------------|
| `npm run gen` | Run content generator |
| `npm run watch` | Watch content and regenerate on changes |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run test` | Run tests |

## Deployment

### Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Node version**: 18 or higher
3. Set environment variables (optional):
   - `SITE_URL` - Your site URL (e.g., `https://notes.example.com`)
   - `SITE_TITLE` - Your site title (default: "Rhizome")

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
