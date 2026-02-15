# Rhizome Static Web Editor

The Rhizome static web editor allows you to edit your MDX notes directly in the browser and commit changes to GitHub without any backend server.

## Features

- **Pure Static**: No backend server required — runs entirely in the browser
- **Direct Commits**: Saves directly to your repository's default branch
- **Live Preview**: See rendered MDX as you type (with debouncing)
- **CodeMirror 6**: Full-featured code editor with syntax highlighting
- **Conflict Detection**: SHA-based optimistic concurrency for safe saves
- **Session or Persistent Storage**: Choose between session-only or remembered tokens

## Access the Editor

Navigate to `/editor` on your deployed site to access the editor.

## Setting Up GitHub Authentication

### Creating a Fine-Grained Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Or visit: https://github.com/settings/personal-access-tokens/new

2. Configure the token:
   - **Token name**: Choose a descriptive name (e.g., "Rhizome Editor")
   - **Expiration**: Select an appropriate expiration period
   - **Repository access**: Select "Only select repositories" and choose your Rhizome repository
   - **Permissions**: Under "Repository permissions", set:
     - **Contents**: Read and write

3. Click "Generate token" and copy the token immediately (you won't be able to see it again)

### Connecting in the Editor

1. Open the editor at `/editor`
2. Enter your repository owner and name (e.g., `username` and `rhizome-notes`)
3. Set the content root (default: `content`)
4. Paste your fine-grained PAT
5. Optionally check "Remember token" to store it in localStorage
6. Click "Connect"

## Token Storage

- **Session only (default)**: Token is stored in `sessionStorage` and cleared when you close the browser tab
- **Remember token**: Token is stored in `localStorage` and persists across browser sessions

### Revoking a Token

If you need to revoke access:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Find your Rhizome Editor token
3. Click "Delete" to revoke it immediately

After revoking, you'll need to create a new token to use the editor again.

## Using the Editor

### Browsing Notes

- The left sidebar shows all notes in your content directory
- Use the search box to filter notes by name or path
- Filter by type (Notes/Articles) using the buttons below the search

### Editing

- Click a note to open it in the editor
- The editor supports MDX syntax with syntax highlighting
- Changes are tracked locally (shown as "unsaved")

### Preview

- The right panel shows a live preview of your MDX content
- Click the eye icon in the bottom-right corner to toggle the preview
- Preview uses the same MDX plugins as the main site (callouts, wiki-links, math, etc.)
- **Limitations**:
  - Note embeds show as placeholders (green boxes with slug)
  - PDF embeds show as placeholders (blue boxes with path)
  - Mermaid diagrams show as code blocks
  - Internal links use basic styling (no split-view integration)

### Saving

- Click "Save" to commit your changes directly to the default branch
- A commit is created with the message "Update [note name]"
- After saving, you can click "View commit" to see the commit on GitHub

### Creating New Notes

1. Click "New Note" in the toolbar
2. Enter a title for your note
3. Select the type (Note or Article)
4. Click "Create"

The note will be created in the appropriate directory (`content/notes/` or `content/articles/`) with default frontmatter.

### Handling Conflicts

If the remote file has changed since you loaded it:

1. You'll see a conflict dialog when trying to save
2. Choose one of:
   - **Reload Remote**: Discard your changes and load the latest version
   - **Overwrite Remote**: Force save your changes (requires confirmation)
   - **Cancel**: Keep editing and resolve manually

## Direct-Commit Architecture

The editor commits directly to your repository's default branch using the GitHub REST API:

1. When you save, the editor sends a `PUT` request to `/repos/{owner}/{repo}/contents/{path}`
2. The request includes your content (base64 encoded) and a commit message
3. GitHub creates a commit on the default branch
4. Your CI/CD pipeline (if any) rebuilds the site automatically

### Implications

- Changes are immediately visible in the repository
- No pull requests or review process
- The site must be rebuilt for changes to appear on the live site
- Consider using branch protection rules if you need a review process

## Security Considerations

- **Token Scope**: The token only needs read/write access to the repository contents
- **Client-Side Only**: All operations happen in your browser; no data is sent to any server other than GitHub
- **Token Visibility**: The token is stored in browser storage and could be accessed by browser extensions or XSS attacks
- **HTTPS Required**: Always use HTTPS to protect your token in transit

## Troubleshooting

### "Invalid token" Error

- Verify the token hasn't expired
- Ensure the token has Contents: read and write permissions
- Check that the token is for the correct repository

### "Repository not found" Error

- Verify the owner and repository name are correct
- Ensure the token has access to the repository

### "Failed to save" Error

- Check your internet connection
- Verify the token still has write permissions
- Try disconnecting and reconnecting

### Preview Not Rendering

- The preview uses a subset of MDX features
- Some custom components may not render in preview
- Preview errors don't affect the actual content
