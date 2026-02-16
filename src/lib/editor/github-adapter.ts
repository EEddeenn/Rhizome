import type {
  RepoInfo,
  NoteInfo,
  FileContent,
  WriteParams,
  WriteResult,
  DeleteParams,
  VaultAdapter,
  GitHubError,
} from "./types";

const GITHUB_API_BASE = "https://api.github.com";

function base64Encode(str: string): string {
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, "utf-8").toString("base64");
}

function base64Decode(base64: string): string {
  if (typeof window !== "undefined") {
    return decodeURIComponent(escape(atob(base64)));
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

function isNotePath(path: string): "note" | "article" | "pdf" {
  if (path.includes("/notes/")) return "note";
  if (path.includes("/articles/")) return "article";
  if (path.includes("/assets/pdfs/")) return "pdf";
  return "note";
}

function extractFileName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1].replace(/\.(md|mdx|pdf)$/, "");
}

async function handleGitHubError(response: Response): Promise<never> {
  let message = `GitHub API error: ${response.status}`;
  let documentationUrl: string | undefined;

  try {
    const error = (await response.json()) as GitHubError;
    message = error.message || message;
    documentationUrl = error.documentation_url;
  } catch {
  }

  throw new (await import("./types")).GitHubApiError(
    response.status,
    message,
    documentationUrl
  );
}

export interface GitHubAdapterPATConfig {
  owner: string;
  repo: string;
  token: string;
}

export class GitHubAdapterPAT implements VaultAdapter {
  private owner: string;
  private repo: string;
  private token: string;
  private defaultBranch: string | null = null;

  constructor(config: GitHubAdapterPATConfig) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.token = config.token;
  }

  private async fetchGitHub<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${GITHUB_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...options.headers,
      },
    });

    if (!response.ok) {
      await handleGitHubError(response);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async getRepoInfo(): Promise<RepoInfo> {
    if (this.defaultBranch) {
      return {
        owner: this.owner,
        repo: this.repo,
        defaultBranch: this.defaultBranch,
      };
    }

    const data = await this.fetchGitHub<{
      default_branch: string;
    }>(`/repos/${this.owner}/${this.repo}`);

    this.defaultBranch = data.default_branch;

    return {
      owner: this.owner,
      repo: this.repo,
      defaultBranch: this.defaultBranch,
    };
  }

  async listNotes(params?: { root?: string }): Promise<NoteInfo[]> {
    const { defaultBranch } = await this.getRepoInfo();
    const root = params?.root || "content";

    const notes: NoteInfo[] = [];

    const notesPath = `${root}/notes`;
    const articlesPath = `${root}/articles`;
    const pdfsPath = `${root}/assets/pdfs`;

    const fetchDir = async (dirPath: string, isPdfDir = false): Promise<void> => {
      try {
        const data = await this.fetchGitHub<
          Array<{ path: string; sha: string; type: string }>
        >(
          `/repos/${this.owner}/${this.repo}/contents/${dirPath}?ref=${defaultBranch}`
        );

        for (const item of data) {
          if (isPdfDir && item.type === "file" && /\.pdf$/i.test(item.path)) {
            notes.push({
              path: item.path,
              sha: item.sha,
              name: extractFileName(item.path),
              type: "pdf",
            });
          } else if (!isPdfDir && item.type === "file" && /\.(md|mdx)$/.test(item.path)) {
            notes.push({
              path: item.path,
              sha: item.sha,
              name: extractFileName(item.path),
              type: isNotePath(item.path),
            });
          } else if (item.type === "dir") {
            await fetchDir(item.path, isPdfDir);
          }
        }
      } catch (error) {
        const { GitHubApiError } = await import("./types");
        if (error instanceof GitHubApiError && error.status === 404) {
          return;
        }
        throw error;
      }
    };

    await Promise.all([
      fetchDir(notesPath),
      fetchDir(articlesPath),
      fetchDir(pdfsPath, true),
    ]);

    notes.sort((a, b) => a.name.localeCompare(b.name));

    return notes;
  }

  async readFile(path: string, ref?: string): Promise<FileContent> {
    const { defaultBranch } = await this.getRepoInfo();
    const branch = ref || defaultBranch;

    const data = await this.fetchGitHub<{
      content: string;
      sha: string;
      encoding: string;
    }>(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${branch}`);

    if (data.encoding !== "base64") {
      throw new Error(`Unexpected encoding: ${data.encoding}`);
    }

    return {
      content: base64Decode(data.content),
      sha: data.sha,
    };
  }

  async writeFile(params: WriteParams): Promise<WriteResult> {
    const { defaultBranch } = await this.getRepoInfo();
    const branch = params.branch || defaultBranch;

    const body: Record<string, unknown> = {
      message: params.message,
      content: base64Encode(params.content),
      branch,
    };

    if (params.sha) {
      body.sha = params.sha;
    }

    const data = await this.fetchGitHub<{
      commit: { sha: string; html_url: string };
      content?: { sha: string };
    }>(`/repos/${this.owner}/${this.repo}/contents/${params.path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return {
      commitSha: data.commit.sha,
      htmlUrl: data.commit.html_url,
      newSha: data.content?.sha,
    };
  }

  async fileExists(path: string, ref?: string): Promise<boolean> {
    try {
      const { defaultBranch } = await this.getRepoInfo();
      const branch = ref || defaultBranch;

      await this.fetchGitHub<{ sha: string }>(
        `/repos/${this.owner}/${this.repo}/contents/${path}?ref=${branch}`
      );
      return true;
    } catch (error) {
      const { GitHubApiError } = await import("./types");
      if (error instanceof GitHubApiError && error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  async deleteFile(params: DeleteParams): Promise<WriteResult> {
    const { defaultBranch } = await this.getRepoInfo();
    const branch = params.branch || defaultBranch;

    const data = await this.fetchGitHub<{
      commit: { sha: string; html_url: string };
    }>(`/repos/${this.owner}/${this.repo}/contents/${params.path}`, {
      method: "DELETE",
      body: JSON.stringify({
        message: params.message,
        sha: params.sha,
        branch,
      }),
    });

    return {
      commitSha: data.commit.sha,
      htmlUrl: data.commit.html_url,
    };
  }
}
