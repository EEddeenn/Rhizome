import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  reconcile,
  filterByStatus,
  searchEntries,
  updateEntrySha,
} from "../src/lib/manifest/reconcile";
import type { BuildManifest, BuildEntry } from "../src/lib/manifest/buildManifest";
import type { RuntimeManifest } from "../src/lib/manifest/runtimeManifest";

function createBuildEntry(overrides: Partial<BuildEntry>): BuildEntry {
  return {
    path: "content/notes/test-note.mdx",
    slug: "notes/test-note",
    title: "Test Note",
    tags: [],
    type: "note",
    order: 0,
    ...overrides,
  };
}

function createBuildManifest(entries: BuildEntry[]): BuildManifest {
  return {
    list: entries,
    byPath: new Map(entries.map(e => [e.path, e])),
  };
}

function createRuntimeManifest(entries: Record<string, { sha?: string }>): RuntimeManifest {
  return {
    ref: "main",
    root: "content",
    entries: Object.fromEntries(
      Object.entries(entries).map(([path, data]) => [
        path,
        { path, sha: data.sha, updatedAt: Date.now() },
      ])
    ),
  };
}

describe("reconcile", () => {
  it("returns empty array when both manifests are null", () => {
    const result = reconcile(null, null);
    assert.deepEqual(result, []);
  });

  it("marks build-only entries as missing", () => {
    const build = createBuildManifest([
      createBuildEntry({ path: "content/notes/missing.mdx", slug: "notes/missing", title: "Missing" }),
    ]);
    
    const result = reconcile(build, null);
    
    assert.equal(result.length, 1);
    assert.equal(result[0].syncStatus, "missing");
    assert.equal(result[0].existsInBuild, true);
    assert.equal(result[0].existsInRuntime, false);
    assert.equal(result[0].stale, true);
  });

  it("marks runtime-only entries as new", () => {
    const build = createBuildManifest([]);
    const runtime = createRuntimeManifest({
      "content/notes/new-note.mdx": { sha: "abc123" },
    });
    
    const result = reconcile(build, runtime);
    
    assert.equal(result.length, 1);
    assert.equal(result[0].syncStatus, "new");
    assert.equal(result[0].existsInBuild, false);
    assert.equal(result[0].existsInRuntime, true);
    assert.equal(result[0].stale, true);
    assert.equal(result[0].runtimeSha, "abc123");
  });

  it("marks entries in both as indexed", () => {
    const build = createBuildManifest([
      createBuildEntry({ path: "content/notes/indexed.mdx", slug: "notes/indexed", title: "Indexed Note" }),
    ]);
    const runtime = createRuntimeManifest({
      "content/notes/indexed.mdx": { sha: "def456" },
    });
    
    const result = reconcile(build, runtime);
    
    assert.equal(result.length, 1);
    assert.equal(result[0].syncStatus, "indexed");
    assert.equal(result[0].existsInBuild, true);
    assert.equal(result[0].existsInRuntime, true);
    assert.equal(result[0].stale, false);
    assert.equal(result[0].runtimeSha, "def456");
  });

  it("merges build metadata with runtime SHA", () => {
    const build = createBuildManifest([
      createBuildEntry({
        path: "content/notes/rich.mdx",
        slug: "notes/rich",
        title: "Rich Note",
        tags: ["tag1", "tag2"],
        status: "reading",
        order: 5,
      }),
    ]);
    const runtime = createRuntimeManifest({
      "content/notes/rich.mdx": { sha: "xyz789" },
    });
    
    const result = reconcile(build, runtime);
    
    assert.equal(result[0].title, "Rich Note");
    assert.deepEqual(result[0].tags, ["tag1", "tag2"]);
    assert.equal(result[0].readingStatus, "reading");
    assert.equal(result[0].runtimeSha, "xyz789");
    assert.equal(result[0].orderKey, 5);
  });

  it("sorts by build order then alphabetically", () => {
    const build = createBuildManifest([
      createBuildEntry({ path: "a.mdx", slug: "a", title: "A", order: 2 }),
      createBuildEntry({ path: "b.mdx", slug: "b", title: "B", order: 1 }),
      createBuildEntry({ path: "c.mdx", slug: "c", title: "C", order: undefined as any }),
    ]);
    const runtime = createRuntimeManifest({
      "a.mdx": { sha: "a" },
      "b.mdx": { sha: "b" },
      "c.mdx": { sha: "c" },
      "d.mdx": { sha: "d" },
    });
    
    const result = reconcile(build, runtime);
    
    assert.equal(result[0].slug, "b");
    assert.equal(result[1].slug, "a");
    assert.equal(result[2].slug, "c");
    assert.equal(result[3].slug, "d");
  });

  it("derives title from path for runtime-only entries", () => {
    const build = createBuildManifest([]);
    const runtime = createRuntimeManifest({
      "content/notes/my-new-note.mdx": { sha: "sha" },
    });
    
    const result = reconcile(build, runtime);
    
    assert.equal(result[0].title, "My New Note");
  });
});

describe("filterByStatus", () => {
  it("returns all entries when showMissing is true", () => {
    const entries = [
      { syncStatus: "indexed" as const, path: "a" },
      { syncStatus: "new" as const, path: "b" },
      { syncStatus: "missing" as const, path: "c" },
    ];
    
    const result = filterByStatus(entries as any, true);
    
    assert.equal(result.length, 3);
  });

  it("filters out missing entries when showMissing is false", () => {
    const entries = [
      { syncStatus: "indexed" as const, path: "a" },
      { syncStatus: "new" as const, path: "b" },
      { syncStatus: "missing" as const, path: "c" },
    ];
    
    const result = filterByStatus(entries as any, false);
    
    assert.equal(result.length, 2);
    assert.equal(result.every(e => e.syncStatus !== "missing"), true);
  });
});

describe("searchEntries", () => {
  it("returns all entries when query is empty", () => {
    const entries = [
      { title: "Note A", path: "a.mdx" },
      { title: "Note B", path: "b.mdx" },
    ];
    
    const result = searchEntries(entries as any, "");
    
    assert.equal(result.length, 2);
  });

  it("filters by title case-insensitively", () => {
    const entries = [
      { title: "JavaScript Tips", path: "js.mdx" },
      { title: "Python Guide", path: "py.mdx" },
    ];
    
    const result = searchEntries(entries as any, "javascript");
    
    assert.equal(result.length, 1);
    assert.equal(result[0].title, "JavaScript Tips");
  });

  it("filters by path", () => {
    const entries = [
      { title: "Note A", path: "content/notes/special-topic.mdx" },
      { title: "Note B", path: "content/notes/other.mdx" },
    ];
    
    const result = searchEntries(entries as any, "special");
    
    assert.equal(result.length, 1);
    assert.equal(result[0].title, "Note A");
  });
});

describe("updateEntrySha", () => {
  it("updates SHA for matching entry", () => {
    const entries = [
      { path: "a.mdx", runtimeSha: "old-sha" },
      { path: "b.mdx", runtimeSha: "other-sha" },
    ];
    
    const result = updateEntrySha(entries as any, "a.mdx", "new-sha");
    
    assert.equal(result[0].runtimeSha, "new-sha");
    assert.equal(result[1].runtimeSha, "other-sha");
  });

  it("does not modify unmatched entries", () => {
    const entries = [
      { path: "a.mdx", runtimeSha: "sha" },
    ];
    
    const result = updateEntrySha(entries as any, "nonexistent.mdx", "new-sha");
    
    assert.equal(result[0].runtimeSha, "sha");
  });
});
