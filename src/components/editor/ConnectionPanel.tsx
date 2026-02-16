"use client";

import { useState } from "react";
import { useConnection } from "./contexts";
import { EyeIcon, EyeSlashIcon } from "@/components/icons";

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
    autoLogin,
    setAutoLogin,
  } = useConnection();

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
      <div className="p-3 sm:p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm sm:text-base font-medium">
              Connected to {config.owner}/{config.repo}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="repo-owner" className="block text-sm font-medium">
            Repository
          </label>
          <div className="flex gap-2 items-center">
            <input
              id="repo-owner"
              type="text"
              placeholder="owner"
              value={config.owner}
              onChange={(e) => setConfig({ owner: e.target.value })}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <span className="text-muted">/</span>
            <input
              id="repo-name"
              type="text"
              placeholder="repo"
              value={config.repo}
              onChange={(e) => setConfig({ repo: e.target.value })}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="content-root" className="block text-sm font-medium">
            Content Root
          </label>
          <input
            id="content-root"
            type="text"
            placeholder="content"
            value={config.contentRoot}
            onChange={(e) => setConfig({ contentRoot: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="pat-token" className="block text-sm font-medium">
            Personal Access Token
          </label>
          <div className="relative">
            <input
              id="pat-token"
              type={showToken ? "text" : "password"}
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label={showToken ? "Hide token" : "Show token"}
            >
              {showToken ? (
                <EyeSlashIcon />
              ) : (
                <EyeIcon />
              )}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-muted">
            Fine-grained PAT with Contents: read and write permissions.{" "}
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
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
            className="rounded border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500"
          />
          <label htmlFor="remember" className="text-sm sm:text-base">
            Remember token (stored locally)
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoLogin"
            checked={autoLogin}
            onChange={(e) => setAutoLogin(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500"
          />
          <label htmlFor="autoLogin" className="text-sm sm:text-base">
            Auto-login on next visit
          </label>
        </div>
      </div>

      {connectionError && (
        <div className="p-3 sm:p-4 text-sm sm:text-base text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {connectionError}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={isConnecting || !config.owner || !config.repo}
        className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        {isConnecting ? "Connecting..." : "Connect"}
      </button>
    </div>
  );
}
