"use client";

import { useState } from "react";
import { useEditor } from "./EditorContext";

export function ConnectionPanel() {
  const {
    isConnected,
    isConnecting,
    connectionError,
    config,
    setConfig,
    setToken,
    disconnect,
    validateAndConnect,
  } = useEditor();

  const [token, setTokenInput] = useState("");
  const [remember, setRemember] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const handleConnect = async () => {
    setConfig({
      owner: config.owner.trim(),
      repo: config.repo.trim(),
      contentRoot: config.contentRoot.trim(),
    });
    if (token.trim()) {
      setToken(token.trim(), remember);
    }
    await validateAndConnect();
  };

  const handleDisconnect = () => {
    disconnect();
    setTokenInput("");
  };

  if (isConnected) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">
              Connected to {config.owner}/{config.repo}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-border">
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold">Connect to GitHub</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Repository</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="owner"
              value={config.owner}
              onChange={(e) => setConfig({ owner: e.target.value })}
              className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <span className="flex items-center text-muted">/</span>
            <input
              type="text"
              placeholder="repo"
              value={config.repo}
              onChange={(e) => setConfig({ repo: e.target.value })}
              className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Content Root</label>
          <input
            type="text"
            placeholder="content"
            value={config.contentRoot}
            onChange={(e) => setConfig({ contentRoot: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Personal Access Token
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              {showToken ? (
                <EyeSlashIcon />
              ) : (
                <EyeIcon />
              )}
            </button>
          </div>
          <p className="text-xs text-muted">
            Fine-grained PAT with Contents: read and write permissions.
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create token
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-border"
          />
          <label htmlFor="remember" className="text-sm">
            Remember token (stored locally)
          </label>
        </div>

        {connectionError && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
            {connectionError}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={isConnecting || !config.owner || !config.repo}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          {isConnecting ? "Connecting..." : "Connect"}
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}
