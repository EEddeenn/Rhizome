import type { TokenValidationResult } from "./types";
import { GitHubApiError } from "./types";
import { GitHubAdapterPAT } from "./github-adapter";

const STORAGE_KEY_SESSION = "rhizome_editor_token_session";
const STORAGE_KEY_LOCAL = "rhizome_editor_token_local";
const STORAGE_KEY_CONFIG = "rhizome_editor_config";
const STORAGE_KEY_AUTO_LOGIN = "rhizome_editor_auto_login";

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

function getAutoLoginFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY_AUTO_LOGIN) === "true";
}

function saveAutoLoginToStorage(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_AUTO_LOGIN, String(enabled));
}

function saveTokenToStorage(token: string, remember: boolean): void {
  if (typeof window === "undefined") return;

  const key = remember ? STORAGE_KEY_LOCAL : STORAGE_KEY_SESSION;
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

export interface AuthState {
  config: EditorConfig;
  hasToken: boolean;
  autoLogin: boolean;
}

type AuthChangeCallback = (state: AuthState) => void;

class AuthStore {
  private token: string | null = null;
  private config: EditorConfig;
  private autoLogin: boolean = false;
  private initialized = false;
  private listeners: Set<AuthChangeCallback> = new Set();

  constructor() {
    this.config = DEFAULT_CONFIG;
  }

  private notify(): void {
    const state: AuthState = {
      config: { ...this.config },
      hasToken: this.token !== null,
      autoLogin: this.autoLogin,
    };
    this.listeners.forEach(callback => callback(state));
  }

  subscribe(callback: AuthChangeCallback): () => void {
    this.listeners.add(callback);
    if (this.initialized) {
      callback({
        config: { ...this.config },
        hasToken: this.token !== null,
        autoLogin: this.autoLogin,
      });
    }
    return () => this.listeners.delete(callback);
  }

  initialize(): void {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;
    
    this.config = getConfigFromStorage();
    this.autoLogin = getAutoLoginFromStorage();
    
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
    this.notify();
  }

  disconnect(): void {
    this.token = null;
    clearTokenFromStorage();
    this.notify();
  }

  getConfig(): EditorConfig {
    this.initialize();
    return { ...this.config };
  }

  setConfig(config: Partial<EditorConfig>): void {
    this.initialize();
    this.config = { ...this.config, ...config };
    saveConfigToStorage(this.config);
    this.notify();
  }

  getAutoLogin(): boolean {
    this.initialize();
    return this.autoLogin;
  }

  setAutoLogin(enabled: boolean): void {
    this.initialize();
    this.autoLogin = enabled;
    saveAutoLoginToStorage(enabled);
    this.notify();
  }

  hasValidConfig(): boolean {
    this.initialize();
    return Boolean(this.config.owner && this.config.repo);
  }

  private async checkWriteAccess(): Promise<boolean> {
    if (!this.token || !this.config.owner || !this.config.repo) {
      return false;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.permissions?.push === true;
    } catch {
      return false;
    }
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

      const canWrite = await this.checkWriteAccess();

      if (!canWrite) {
        return {
          ok: false,
          reason: "Token lacks write permissions. Ensure your PAT has 'Contents: read and write' scope for this repository.",
        };
      }

      return {
        ok: true,
        repoAccess: canRead,
        writeAccess: canWrite,
      };
    } catch (error: unknown) {
      if (error instanceof GitHubApiError) {
        if (error.status === 401) {
          return { ok: false, reason: "Invalid or expired token. Please check your PAT." };
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
