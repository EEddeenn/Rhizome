import type { TokenValidationResult } from "./types";
import { GitHubApiError } from "./types";
import { GitHubAdapterPAT } from "./github-adapter";

const STORAGE_KEY_SESSION = "rhizome_editor_token_session";
const STORAGE_KEY_LOCAL = "rhizome_editor_token_local";
const STORAGE_KEY_CONFIG = "rhizome_editor_config";

export interface EditorConfig {
  owner: string;
  repo: string;
  contentRoot: string;
}

const DEFAULT_CONFIG: EditorConfig = {
  owner: "",
  repo: "",
  contentRoot: "content",
};

function getConfigFromStorage(): EditorConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch {
  }
  return DEFAULT_CONFIG;
}

function saveConfigToStorage(config: EditorConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

function getTokenFromStorage(remember: boolean): string | null {
  if (typeof window === "undefined") return null;
  const key = remember ? STORAGE_KEY_LOCAL : STORAGE_KEY_SESSION;
  const storage = remember ? localStorage : sessionStorage;
  return storage.getItem(key);
}

function saveTokenToStorage(token: string, remember: boolean): void {
  if (typeof window === "undefined") return;
  
  const key = remember ? STORAGE_KEY_LOCAL : STORAGE_KEY_LOCAL;
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(key, token);
  
  if (remember) {
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
  } else {
    localStorage.removeItem(STORAGE_KEY_LOCAL);
  }
}

function clearTokenFromStorage(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY_SESSION);
  localStorage.removeItem(STORAGE_KEY_LOCAL);
}

class AuthStore {
  private token: string | null = null;
  private config: EditorConfig;
  private initialized = false;

  constructor() {
    this.config = DEFAULT_CONFIG;
  }

  initialize(): void {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;
    
    this.config = getConfigFromStorage();
    
    const localToken = localStorage.getItem(STORAGE_KEY_LOCAL);
    const sessionToken = sessionStorage.getItem(STORAGE_KEY_SESSION);
    this.token = localToken || sessionToken || null;
  }

  getToken(): string | null {
    this.initialize();
    return this.token;
  }

  setToken(token: string, remember: boolean): void {
    this.initialize();
    this.token = token;
    saveTokenToStorage(token, remember);
  }

  disconnect(): void {
    this.token = null;
    clearTokenFromStorage();
  }

  getConfig(): EditorConfig {
    this.initialize();
    return { ...this.config };
  }

  setConfig(config: Partial<EditorConfig>): void {
    this.initialize();
    this.config = { ...this.config, ...config };
    saveConfigToStorage(this.config);
  }

  hasValidConfig(): boolean {
    this.initialize();
    return Boolean(this.config.owner && this.config.repo);
  }

  async validateTokenAndRepoAccess(): Promise<TokenValidationResult> {
    this.initialize();
    
    if (!this.token) {
      return { ok: false, reason: "No token provided" };
    }

    if (!this.config.owner || !this.config.repo) {
      return { ok: false, reason: "Repository not configured" };
    }

    try {
      const adapter = new GitHubAdapterPAT({
        owner: this.config.owner,
        repo: this.config.repo,
        token: this.token,
      });

      await adapter.getRepoInfo();

      const notes = await adapter.listNotes({ root: this.config.contentRoot });
      const canRead = notes !== null;

      return {
        ok: true,
        repoAccess: canRead,
        writeAccess: true,
      };
    } catch (error: unknown) {
      if (error instanceof GitHubApiError) {
        if (error.status === 401) {
          return { ok: false, reason: "Invalid token. Please check your PAT." };
        }
        if (error.status === 403) {
          return { ok: false, reason: "Token lacks required permissions. Ensure it has 'Contents: read and write' scope." };
        }
        if (error.status === 404) {
          return { ok: false, reason: `Repository not found. Check: 1) Correct owner/repo name 2) PAT has access to this repo 3) Token was pasted correctly` };
        }
        return { ok: false, reason: error.message };
      }
      return { ok: false, reason: "Failed to validate token" };
    }
  }

  createAdapter(): GitHubAdapterPAT | null {
    this.initialize();
    
    if (!this.token || !this.config.owner || !this.config.repo) {
      return null;
    }

    return new GitHubAdapterPAT({
      owner: this.config.owner,
      repo: this.config.repo,
      token: this.token,
    });
  }
}

export const authStore = new AuthStore();
