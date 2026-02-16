export interface RepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
}

export interface NoteInfo {
  path: string;
  sha?: string;
  name: string;
  type: "note" | "article" | "pdf";
}

export interface FileContent {
  content: string;
  sha: string;
}

export interface WriteResult {
  commitSha: string;
  htmlUrl?: string;
  newSha?: string;
}

export interface WriteParams {
  path: string;
  content: string;
  message: string;
  branch?: string;
  sha?: string;
}

export interface DeleteParams {
  path: string;
  message: string;
  sha: string;
  branch?: string;
}

export interface VaultAdapter {
  getRepoInfo(): Promise<RepoInfo>;
  listNotes(params?: { root?: string }): Promise<NoteInfo[]>;
  readFile(path: string, ref?: string): Promise<FileContent>;
  writeFile(params: WriteParams): Promise<WriteResult>;
  deleteFile(params: DeleteParams): Promise<WriteResult>;
  fileExists(path: string, ref?: string): Promise<boolean>;
}

export interface GitHubError {
  status: number;
  message: string;
  documentation_url?: string;
}

export class GitHubApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public documentationUrl?: string
  ) {
    super(message);
    this.name = "GitHubApiError";
  }

  static isConflict(error: unknown): boolean {
    return error instanceof GitHubApiError && error.status === 409;
  }

  static isUnprocessable(error: unknown): boolean {
    return error instanceof GitHubApiError && error.status === 422;
  }

  static isAuthError(error: unknown): boolean {
    return (
      error instanceof GitHubApiError && (error.status === 401 || error.status === 403)
    );
  }

  static isNotFound(error: unknown): boolean {
    return error instanceof GitHubApiError && error.status === 404;
  }
}

export interface TokenValidationResult {
  ok: boolean;
  reason?: string;
  repoAccess?: boolean;
  writeAccess?: boolean;
}
